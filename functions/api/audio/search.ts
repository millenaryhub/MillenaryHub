import { searchYouTube } from '../../_services/youtubeSearchService'

interface Env {
  YOUTUBE_API_KEY?: string
}

type Context = { request: Request; env: Env }
const recentRequests = new Map<string, number>()
const RATE_LIMIT_MS = 10_000

const responseJson = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
})

const getClientKey = (request: Request) => request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0].trim() || 'unknown'

export const onRequestPost = async ({ request, env }: Context) => {
  const key = getClientKey(request)
  const now = Date.now()
  const previous = recentRequests.get(key)
  if (previous && now - previous < RATE_LIMIT_MS) return responseJson({ error: 'Please wait a few seconds before searching again.' }, 429)
  recentRequests.set(key, now)

  if (!env.YOUTUBE_API_KEY) return responseJson({ error: 'YouTube search is not configured yet. Add YOUTUBE_API_KEY to the server environment.' }, 503)

  let body: { query?: unknown }
  try { body = await request.json() as { query?: unknown } } catch { return responseJson({ error: 'Enter a search term or valid URL.' }, 400) }
  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query || query.length > 300) return responseJson({ error: 'Enter a search term or valid URL.' }, 400)

  try {
    const results = await searchYouTube(query, env.YOUTUBE_API_KEY)
    return responseJson({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : ''
    return responseJson({ error: message.includes('not found') || message.includes('unavailable') ? 'That video is unavailable or could not be found.' : 'YouTube search is unavailable right now. Please try again.' }, 502)
  }
}
