interface Env {
  BREVO_API_KEY: string
}

type PagesContext = {
  request: Request
  env: Env
}

type BrevoList = {
  id: number
  name: string
}

type BrevoError = {
  code?: string
  message?: string
}

const recentRequests = new Map<string, number>()
const RATE_LIMIT_WINDOW_MS = 60_000

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
})

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const brevoRequest = async (path: string, apiKey: string, init?: RequestInit) => fetch(`https://api.brevo.com/v3${path}`, {
  ...init,
  headers: {
    accept: 'application/json',
    'content-type': 'application/json',
    'api-key': apiKey,
    ...init?.headers,
  },
})

const findSubscriberListId = async (apiKey: string) => {
  for (let offset = 0; offset < 500; offset += 50) {
    const response = await brevoRequest(`/contacts/lists?limit=50&offset=${offset}`, apiKey)
    if (!response.ok) throw new Error('Unable to read Brevo lists')
    const data = await response.json() as { lists?: BrevoList[] }
    const match = data.lists?.find(list => list.name.trim().toLowerCase() === 'millenaryhub subscribers')
    if (match) return match.id
    if (!data.lists || data.lists.length < 50) break
  }
  return null
}

export const onRequestOptions = ({ request }: PagesContext) => {
  if (request.headers.get('Origin')) return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } })
  return new Response(null, { status: 204 })
}

export const onRequestPost = async ({ request, env }: PagesContext) => {
  if (!env.BREVO_API_KEY) return json({ error: 'Newsletter service is not configured.' }, 503)

  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const lastRequest = recentRequests.get(ip)
  if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) return json({ error: 'Please wait a moment before trying again.' }, 429)
  recentRequests.set(ip, now)
  for (const [key, timestamp] of recentRequests) if (now - timestamp > RATE_LIMIT_WINDOW_MS) recentRequests.delete(key)

  let payload: { email?: unknown; website?: unknown }
  try {
    payload = await request.json() as { email?: unknown; website?: unknown }
  } catch {
    return json({ error: 'Please enter a valid email address.' }, 400)
  }

  if (payload.website) return json({ success: true })
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  if (!isValidEmail(email) || email.length > 254) return json({ error: 'Please enter a valid email address.' }, 400)

  try {
    const listId = await findSubscriberListId(env.BREVO_API_KEY)
    if (!listId) return json({ error: 'The newsletter list is not available yet.' }, 503)

    const response = await brevoRequest('/contacts', env.BREVO_API_KEY, {
      method: 'POST',
      body: JSON.stringify({ email, listIds: [listId], updateEnabled: true }),
    })

    if (response.ok || response.status === 204) return json({ success: true })
    const error = await response.json().catch(() => ({})) as BrevoError
    const duplicate = error.code === 'duplicate_parameter' || error.message?.toLowerCase().includes('already exists')
    if (duplicate) return json({ success: true })
    return json({ error: 'We could not subscribe you right now. Please try again.' }, 502)
  } catch {
    return json({ error: 'We could not subscribe you right now. Please try again.' }, 502)
  }
}
