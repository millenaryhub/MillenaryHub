export interface AudioDownloadEnv {
  MEDIA_DOWNLOAD_ENDPOINT?: string
  MEDIA_PROVIDER_API_KEY?: string
}

export type AudioDownloadRequest = {
  url: string
  title: string
  permissionConfirmed: boolean
}

const SUPPORTED_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'])

const getVideoId = (value: string) => {
  try {
    const url = new URL(value)
    if (!SUPPORTED_HOSTS.has(url.hostname.toLowerCase())) return null
    if (url.hostname.toLowerCase().includes('youtu.be')) return url.pathname.slice(1).split('/')[0] || null
    return url.searchParams.get('v') || (url.pathname.match(/^\/shorts\/([^/]+)/)?.[1] ?? null)
  } catch {
    return null
  }
}

export const audioDownloadService = {
  async process(request: AudioDownloadRequest, env: AudioDownloadEnv) {
    if (!request.permissionConfirmed) throw new Error('Confirm that you own this content or have permission to download it.')
    const videoId = getVideoId(request.url)
    if (!videoId) throw new Error('Please provide a supported YouTube video URL.')
    if (!env.MEDIA_DOWNLOAD_ENDPOINT) throw new Error('Audio processing is not configured yet. Connect a permitted processing service first.')

    const providerResponse = await fetch(env.MEDIA_DOWNLOAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(env.MEDIA_PROVIDER_API_KEY ? { Authorization: `Bearer ${env.MEDIA_PROVIDER_API_KEY}` } : {}) },
      body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${videoId}`, title: request.title, format: 'mp3', permissionConfirmed: true }),
    })

    if (!providerResponse.ok) throw new Error('The permitted processing service could not prepare this audio.')
    const contentType = providerResponse.headers.get('Content-Type') || ''
    if (!contentType.startsWith('audio/')) throw new Error('The processing service returned an unsupported audio format.')
    return { body: providerResponse.body, contentType }
  },
}
