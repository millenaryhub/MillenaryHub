import { ChangeEvent, DragEvent, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Download, FileAudio, LoaderCircle, Upload, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const ACCEPTED_TYPES = '.mp3,.wav,.flac,.m4a,.ogg,.opus,.aiff,.aac'
const MAX_SIZE = 100 * 1024 * 1024

type Results = { vocalsUrl: string; instrumentalUrl: string }

export default function VocalRemoverPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<Results | null>(null)
  const [error, setError] = useState('')

  const chooseFile = (candidate: File | undefined) => {
    setError('')
    setResults(null)
    if (!candidate) return
    if (!candidate.type.startsWith('audio/') && !ACCEPTED_TYPES.split(',').some(extension => candidate.name.toLowerCase().endsWith(extension.slice(1)))) { setError('Please choose an MP3, WAV, FLAC or another supported audio file.'); return }
    if (candidate.size > MAX_SIZE) { setError('That file is too large. The maximum size is 100 MB.'); return }
    setFile(candidate)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]) }
  const onInput = (event: ChangeEvent<HTMLInputElement>) => chooseFile(event.target.files?.[0])
  const removeFile = () => { setFile(null); setResults(null); setError(''); if (inputRef.current) inputRef.current.value = '' }

  const separate = async () => {
    if (!file || processing) return
    setProcessing(true); setProgress(8); setError(''); setResults(null)
    const progressTimer = window.setInterval(() => setProgress(current => Math.min(current + 7, 88)), 700)
    try {
      const body = new FormData(); body.append('file', file)
      const response = await fetch(`${API_BASE_URL}/api/vocal-remover/separate`, { method: 'POST', body })
      const data = await response.json().catch(() => ({})) as Results & { detail?: string }
      if (!response.ok) throw new Error(data.detail || 'We could not separate that audio. Please try again.')
      setProgress(100); setResults({ vocalsUrl: `${API_BASE_URL}${data.vocalsUrl}`, instrumentalUrl: `${API_BASE_URL}${data.instrumentalUrl}` })
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'The vocal remover backend is unavailable.') } finally { window.clearInterval(progressTimer); setProcessing(false) }
  }

  return <><section className="page-intro"><div className="container"><Link className="back-link" to="/media"><ArrowLeft size={15} /> Back to Media</Link><span className="eyebrow">Media tools</span><h1>Free Vocal Remover</h1><p>Separate vocals from an audio track locally using an open-source source-separation model.</p></div></section><section className="section vocal-section"><div className="container vocal-container"><div className={`upload-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>{file ? <div className="selected-file"><span className="file-icon"><FileAudio size={25} /></span><div><strong>{file.name}</strong><span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span></div><button className="remove-file" onClick={removeFile} aria-label="Remove selected file"><X size={18} /></button></div> : <><span className="upload-icon"><Upload size={25} /></span><h2>Drop your audio here</h2><p>MP3, WAV, FLAC and other supported formats up to 100 MB.</p><button className="button button-ink" onClick={() => inputRef.current?.click()}>Browse Files</button><input ref={inputRef} hidden type="file" accept={ACCEPTED_TYPES} onChange={onInput} /></>}</div>{error && <div className="vocal-error" role="alert">{error}</div>}{file && !results && <div className="separate-action"><button className="button button-coral" onClick={separate} disabled={processing}>{processing ? <><LoaderCircle className="spin" size={17} /> Separating...</> : <>Separate Audio <ArrowRight size={17} /></>}</button>{processing && <div className="progress-wrap"><div className="progress-label"><span>Processing with Demucs</span><span>{progress}%</span></div><div className="progress-track"><i style={{ width: `${progress}%` }} /></div></div>}</div>}{results && <div className="vocal-results"><div className="results-heading"><span className="eyebrow">Separation complete</span><h2>Your stems are ready.</h2><p>Download the parts you need. Temporary files are cleaned up automatically.</p></div><div className="stem-grid"><a className="stem-card" href={results.vocalsUrl} download><span className="stem-icon stem-vocals"><MicIcon /></span><strong>Vocals</strong><span>Download WAV <Download size={16} /></span></a><a className="stem-card" href={results.instrumentalUrl} download><span className="stem-icon stem-instrumental"><WaveIcon /></span><strong>Instrumental</strong><span>Download WAV <Download size={16} /></span></a></div><button className="text-link vocal-again" onClick={removeFile}>Separate another file <ArrowRight size={16} /></button></div>}<div className="vocal-note"><Check size={17} /><span>Your audio is processed by the local FastAPI backend and is not permanently stored by this app.</span></div></div></section></>
}
function MicIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm6 9a6 6 0 0 1-12 0M12 18v3m-4 0h8" /></svg> }
function WaveIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h2m2-4v8m4-11v14m4-10v6m4-3v-2m2 2h1" /></svg> }
