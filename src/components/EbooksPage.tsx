import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Download, LoaderCircle, LogIn, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../supabaseClient'

type Row = Record<string, unknown>
type Ebook = { id: string; title: string; description: string; author: string; cover: string; price: string; raw: Row }

const text = (row: Row, keys: string[], fallback: string) => { const value = keys.map(key => row[key]).find(value => typeof value === 'string' || typeof value === 'number'); return value === undefined || value === null ? fallback : String(value) }
const normalizeEbook = (row: Row): Ebook => ({ id: text(row, ['id', 'ebook_id'], ''), title: text(row, ['title', 'name'], 'Untitled ebook'), description: text(row, ['description', 'summary'], 'A useful digital resource from MillenaryHub.'), author: text(row, ['author', 'author_name', 'created_by'], 'MillenaryHub'), cover: text(row, ['cover_url', 'cover', 'cover_image_url', 'image_url'], ''), price: text(row, ['price', 'amount'], 'Free'), raw: row })
const ownedId = (row: Row) => text(row, ['ebook_id', 'ebookId', 'product_id', 'item_id', 'id'], '')

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>([])
  const [ownedIds, setOwnedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [downloadId, setDownloadId] = useState<string | null>(null)

  const load = async () => {
    if (!supabase) { setLoading(false); setError('Ebook access is not configured yet.'); return }
    setLoading(true); setError('')
    const { data: ebookRows, error: ebookError } = await supabase.from('ebooks').select('*')
    if (ebookError) { setError('We could not load the ebook catalogue.'); setLoading(false); return }
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) { setError('We could not check your account.'); setLoading(false); return }
    const user = sessionData.session?.user
    setUserEmail(user?.email || null)
    if (user) {
      const { data: purchaseRows, error: purchaseError } = await supabase.from('purchases').select('*').eq('user_id', user.id)
      if (purchaseError) { setError('We could not load your purchased ebooks.'); setLoading(false); return }
      setOwnedIds((purchaseRows || []).map(ownedId).filter(Boolean))
    } else setOwnedIds([])
    setEbooks((ebookRows || []).map(row => normalizeEbook(row as Row)))
    setLoading(false)
  }

  useEffect(() => { void load(); if (!supabase) return; const { data: listener } = supabase.auth.onAuthStateChange(() => { void load() }); return () => listener.subscription.unsubscribe() }, [])

  const owned = useMemo(() => new Set(ownedIds), [ownedIds])
  const download = async (ebook: Ebook) => {
    if (!supabase || !owned.has(ebook.id)) return
    const path = text(ebook.raw, ['file_path', 'storage_path', 'filePath'], '')
    const bucket = text(ebook.raw, ['storage_bucket', 'bucket'], 'ebooks')
    if (!path) { setError('This ebook does not have a private file attached yet.'); return }
    setDownloadId(ebook.id); setError('')
    const { data, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(path, 300)
    if (signedError || !data?.signedUrl) setError('We could not prepare a secure download for this ebook.')
    else window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    setDownloadId(null)
  }

  return <><section className="page-intro"><div className="container"><span className="eyebrow">MillenaryHub library</span><h1>Useful ebooks.</h1><p>Browse practical digital resources and access the ebooks connected to your account.</p></div></section><section className="section ebooks-section"><div className="container"><div className="ebooks-toolbar"><div><span className="eyebrow">Catalogue</span><h2>Explore the library</h2></div><button className="refresh-button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Refresh</button></div>{!isSupabaseConfigured && <div className="ebook-state"><BookOpen size={23} /><h3>Library connection needs setup.</h3><p>Add the Supabase environment variables and restart the dev server.</p></div>}{loading && <div className="ebook-state"><LoaderCircle className="spin" size={23} /><p>Loading ebooks...</p></div>}{error && !loading && <div className="ebook-error" role="alert">{error}</div>}{!loading && !error && ebooks.length === 0 && <div className="ebook-state"><BookOpen size={23} /><h3>No ebooks available yet.</h3><p>New resources will appear here when they are published.</p></div>}{!loading && ebooks.length > 0 && <div className="ebook-grid">{ebooks.map(ebook => <article className="ebook-card" key={ebook.id}>{ebook.cover ? <img src={ebook.cover} alt={`${ebook.title} cover`} /> : <div className="ebook-cover"><BookOpen size={28} /></div>}<div className="ebook-card-body"><span className="eyebrow">{ebook.author}</span><h2>{ebook.title}</h2><p>{ebook.description}</p><div className="ebook-card-footer"><strong>{ebook.price}</strong>{owned.has(ebook.id) ? <button className="button button-ink ebook-download" onClick={() => void download(ebook)} disabled={downloadId !== null}>{downloadId === ebook.id ? <><LoaderCircle className="spin" size={15} /> Preparing</> : <><Download size={15} /> Download</>}</button> : userEmail ? <span className="ebook-locked">Not purchased</span> : <Link className="ebook-login" to="/profile"><LogIn size={15} /> Log in to access</Link>}</div></div></article>)}</div>}</div></section></>
}
