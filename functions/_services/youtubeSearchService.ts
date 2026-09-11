type YouTubeThumbnail = { url?: string }
type YouTubeSearchItem = { id?: { videoId?: string }; snippet?: { title?: string; channelTitle?: string; thumbnails?: { medium?: YouTubeThumbnail; default?: YouTubeThumbnail } } }
type YouTubeVideoItem = { id?: string; snippet?: { title?: string; channelTitle?: string; thumbnails?: { medium?: YouTubeThumbnail; default?: YouTubeThumbnail } }; contentDetails?: { duration?: string } }

type YouTubeResponse<T> = { items?: T[]; error?: { message?: string } }

export type YouTubeSearchResult = {
  id: string
  title: string
  channel: string
  duration: string
  thumbnail: string
  sourceUrl: string
}

const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'])

export const getYouTubeVideoId = (value: string) => {
  try {
    const url = new URL(value)
    if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null
    if (url.hostname.toLowerCase().includes('youtu.be')) return url.pathname.slice(1).split('/')[0] || null
    return url.searchParams.get('v') || (url.pathname.match(/^\/shorts\/([^/]+)/)?.[1] ?? null)
  } catch {
    return null
  }
}

const formatDuration = (value?: string) => {
  if (!value) return 'Unavailable'
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return 'Unavailable'
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`
}

const youtubeRequest = async <T,>(path: string, apiKey: string) => {
  const response = await fetch(`https://www.googleapis.com/youtube/v3${path}`)
  const data = await response.json() as YouTubeResponse<T>
  if (!response.ok) throw new Error(data.error?.message || 'YouTube could not complete the request.')
  return data.items || []
}

const toResult = (item: YouTubeVideoItem): YouTubeSearchResult | null => {
  const id = item.id
  if (!id) return null
  return { id, title: item.snippet?.title || 'Untitled video', channel: item.snippet?.channelTitle || 'Unknown channel', duration: formatDuration(item.contentDetails?.duration), thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`, sourceUrl: `https://www.youtube.com/watch?v=${id}` }
}

export const searchYouTube = async (query: string, apiKey: string) => {
  const videoId = getYouTubeVideoId(query)
  if (videoId) {
    const items = await youtubeRequest<YouTubeVideoItem>(`/videos?part=snippet,contentDetails&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`, apiKey)
    const result = items.map(toResult).find(Boolean)
    if (!result) throw new Error('That video is unavailable or could not be found.')
    return [result as YouTubeSearchResult]
  }

  const searchItems = await youtubeRequest<YouTubeSearchItem>(`/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`, apiKey)
  const ids = searchItems.map(item => item.id?.videoId).filter((id): id is string => Boolean(id))
  if (!ids.length) return []
  const videos = await youtubeRequest<YouTubeVideoItem>(`/videos?part=snippet,contentDetails&id=${encodeURIComponent(ids.join(','))}&key=${encodeURIComponent(apiKey)}`, apiKey)
  const ordered = new Map(videos.map(video => [video.id, video]))
  return ids.map(id => toResult(ordered.get(id) || {})).filter((result): result is YouTubeSearchResult => Boolean(result))
}
