import { FormEvent, useState } from 'react'
import { ArrowRight, Download, LoaderCircle, Search } from 'lucide-react'

interface AudioResult {
  id: string
  title: string
  channel: string
  duration: string
  thumbnail: string
  sourceUrl: string
}

const pageIntro = <section className="page-intro"><div className="container"><span className="eyebrow">Media tools</span><h1>Free Audio Downloader</h1><p>Search for audio and save permitted content to your device.</p></div></section>

export default function AudioDownloaderPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AudioResult[]>([])
  const [searching, setSearching] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState<string[]>([])
  const [error, setError] = useState('')

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = query.trim()
    if (!value) { setError('Search for a video or paste a YouTube URL first.'); return }
    setSearching(true)
    setError('')
    setResults([])
    try {
      const response = await fetch('/api/audio/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: value }) })
      const data = await response.json().catch(() => ({})) as { results?: AudioResult[]; error?: string }
      if (!response.ok) throw new Error(data.error || 'YouTube search is unavailable right now.')
      setResults(data.results || [])
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'YouTube search is unavailable right now.') } finally { setSearching(false) }
  }

  const download = async (result: AudioResult) => {
    if (downloading) return
    setDownloading(result.id)
    setError('')
    try {
      const response = await fetch('/api/audio/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: result.sourceUrl, title: result.title, permissionConfirmed: true }) })
      if (!response.ok) { const data = await response.json().catch(() => ({})) as { error?: string }; throw new Error(data.error || 'This audio could not be prepared.') }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${result.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'audio'}.mp3`
      link.click()
      URL.revokeObjectURL(objectUrl)
      setDownloaded(current => current.includes(result.id) ? current : [...current, result.id])
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'This audio could not be prepared.') } finally { setDownloading(null) }
  }

  return <>{pageIntro}<section className="section audio-section"><div className="container audio-container"><form className="audio-search" onSubmit={search}><div className="audio-search-input"><Search size={20} /><input aria-label="Search YouTube" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search YouTube..." /></div><button className="button button-coral" type="submit" disabled={searching}>{searching ? <><LoaderCircle className="spin" size={17} /> Searching...</> : <>Search <ArrowRight size={17} /></>}</button></form><div className="audio-notice"><Download size={17} /><span>Download only content you own or have permission to download. You are responsible for complying with copyright and platform terms.</span></div>{error && <div className="audio-error" role="alert">{error}</div>}{searching && <div className="audio-loading"><LoaderCircle className="spin" size={23} /><span>Searching YouTube...</span></div>}{!searching && results.length > 0 && <div className="audio-results"><div className="results-meta"><span>{results.length} result{results.length === 1 ? '' : 's'}</span><span>Review permission before downloading</span></div>{results.map(result => <article className="audio-result" key={result.id}><img src={result.thumbnail} alt={result.title} loading="lazy" /><div className="audio-result-copy"><span className="eyebrow">{result.channel}</span><h2>{result.title}</h2><span className="audio-duration">{result.duration}</span></div><button className="button button-ink audio-download" onClick={() => download(result)} disabled={downloading !== null}>{downloading === result.id ? <><LoaderCircle className="spin" size={16} /> Preparing...</> : <><Download size={16} /> {downloaded.includes(result.id) ? 'Download MP3' : 'Download Audio'}</>}</button></article>)}</div>}{!searching && !error && results.length === 0 && <div className="audio-empty"><div className="audio-empty-icon"><Search size={23} /></div><h2>Search for something useful.</h2><p>Paste a YouTube URL or search for a title. Search results come through the official YouTube Data API.</p></div>}</div></section></>
}
