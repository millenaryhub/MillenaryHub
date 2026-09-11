import { audioDownloadService } from '../../_services/audioDownloadService'

interface Env {
  MEDIA_DOWNLOAD_ENDPOINT?: string
  MEDIA_PROVIDER_API_KEY?: string
}

type Context = { request: Request; env: Env }
const recentRequests = new Map<string, number>()
const RATE_LIMIT_MS = 15_000

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' },
})

export const onRequestPost = async ({ request, env }: Context) => {
  const clientKey = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0].trim() || 'unknown'
  const now = Date.now()
  const previous = recentRequests.get(clientKey)
  if (previous && now - previous < RATE_LIMIT_MS) return json({ error: 'Please wait before requesting another download.' }, 429)
  recentRequests.set(clientKey, now)

  let body: { url?: unknown; title?: unknown; permissionConfirmed?: unknown }
  try { body = await request.json() as { url?: unknown; title?: unknown; permissionConfirmed?: unknown } } catch { return json({ error: 'The selected media request is invalid.' }, 400) }
  const url = typeof body.url === 'string' ? body.url.trim() : ''
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
  if (!/^https?:\/\//i.test(url) || !title || body.permissionConfirmed !== true) return json({ error: 'Confirm that you own this content or have permission to download it.' }, 400)

  try {
    const result = await audioDownloadService.process({ url, title, permissionConfirmed: true }, env)
    return new Response(result.body, { status: 200, headers: { 'Content-Type': result.contentType, 'Content-Disposition': `attachment; filename="${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'audio'}.mp3"`, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } })
  } catch (error) { const message = error instanceof Error ? error.message : 'The audio provider is unavailable right now.'; return json({ error: message }, message.includes('not configured') ? 503 : 502) }
}
