import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, Check, LogOut, LoaderCircle, UserRound } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../supabaseClient'
import { readStorage, writeStorage } from '../lib/storage'

type ProfileRecord = { id: string; display_name: string | null; email: string | null; avatar_url: string | null; interests: string[] | null }
type AuthMode = 'login' | 'signup'

const interestOptions = ['Money', 'Business', 'AI', 'Technology', 'Learning', 'Trading', 'Productivity', 'Digital Skills']

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, string> } | null>(null)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [interests, setInterests] = useState<string[]>(() => readStorage('mh-interests', []))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    let mounted = true
    const load = async () => {
      const { data, error: sessionError } = await supabase!.auth.getSession()
      if (sessionError) setError(sessionError.message)
      if (!mounted) return
      const currentUser = data.session?.user
      setUser(currentUser ? { id: currentUser.id, email: currentUser.email, user_metadata: currentUser.user_metadata as Record<string, string> } : null)
      if (currentUser) await loadProfile(currentUser.id)
      setLoading(false)
    }
    const loadProfile = async (userId: string) => {
      const { data, error: profileError } = await supabase!.from('profiles').select('id, display_name, email, avatar_url, interests').eq('id', userId).maybeSingle()
      if (profileError) { setError('We could not load your profile.'); return }
      if (data) { setProfile(data as ProfileRecord); setInterests(data.interests || []) }
    }
    void load()
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user
      setUser(currentUser ? { id: currentUser.id, email: currentUser.email, user_metadata: currentUser.user_metadata as Record<string, string> } : null)
      if (currentUser) void loadProfile(currentUser.id)
      else { setProfile(null); setInterests(readStorage('mh-interests', [])) }
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  const authenticate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setAuthLoading(true); setError(''); setMessage('')
    const result = authMode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password })
    if (result.error) setError(result.error.message)
    else setMessage(authMode === 'signup' ? 'Check your email to confirm your account.' : 'Welcome back.')
    setAuthLoading(false)
  }

  const googleLogin = async () => {
    if (!supabase) return
    setAuthLoading(true); setError('')
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/profile' } })
    if (authError) { setError(authError.message); setAuthLoading(false) }
  }

  const saveProfile = async () => {
    if (!user || !supabase) return
    setSaving(true); setError(''); setMessage('')
    const displayName = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'MillenaryHub member'
    const { data, error: profileError } = await supabase.from('profiles').upsert({ id: user.id, display_name: displayName, email: user.email || null, avatar_url: user.user_metadata?.avatar_url || null, interests, updated_at: new Date().toISOString() }).select('id, display_name, email, avatar_url, interests').single()
    if (profileError) setError('We could not save your profile. Check that the Supabase tables and policies are installed.')
    else { setProfile(data as ProfileRecord); writeStorage('mh-interests', interests); setMessage('Your interests are saved.') }
    setSaving(false)
  }

  const logout = async () => { if (!supabase) return; setError(''); const { error: logoutError } = await supabase.auth.signOut(); if (logoutError) setError('We could not sign you out. Please try again.') }
  const toggleInterest = (interest: string) => setInterests(current => current.includes(interest) ? current.filter(item => item !== interest) : [...current, interest])
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Curious builder'

  if (loading) return <ProfileFrame><div className="profile-state"><LoaderCircle className="spin" /><span>Loading your profile...</span></div></ProfileFrame>
  if (!isSupabaseConfigured) return <ProfileFrame><div className="profile-state"><UserRound size={24} /><h2>Profile connection needs setup.</h2><p>Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your local environment, then restart the dev server.</p></div></ProfileFrame>
  if (!user) return <ProfileFrame><div className="profile-layout profile-auth-layout"><div className="profile-card"><div className="profile-avatar"><UserRound /></div><span className="eyebrow">Your local profile</span><h2>Curious builder</h2><p>Sign in to save your interests and connect your MillenaryHub profile across devices.</p></div><div className="auth-panel"><span className="eyebrow">{authMode === 'login' ? 'Welcome back' : 'Start here'}</span><h2>{authMode === 'login' ? 'Log in to MillenaryHub' : 'Create your profile'}</h2><form onSubmit={authenticate}><label className="field"><span>Email</span><input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" /></label><label className="field"><span>Password</span><input type="password" minLength={6} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 6 characters" /></label><button className="button button-ink" disabled={authLoading}>{authLoading ? <><LoaderCircle className="spin" size={16} /> Working...</> : authMode === 'login' ? 'Log in' : 'Sign up'} <ArrowRight size={16} /></button></form><button className="google-button" onClick={googleLogin} disabled={authLoading}>Continue with Google</button><button className="auth-switch" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}</button>{message && <p className="profile-success" role="status">{message}</p>}{error && <p className="profile-error" role="alert">{error}</p>}</div></div></ProfileFrame>
  return <ProfileFrame><div className="profile-layout"><div className="profile-card"><div className="profile-avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : <span>{displayName.slice(0, 1).toUpperCase()}</span>}</div><span className="eyebrow">Supabase profile</span><h2>{displayName}</h2><p>{user.email}</p><div className="profile-stats"><span><strong>✓</strong> Connected</span><span><strong>{interests.length}</strong> Interests</span></div><button className="profile-logout" onClick={logout}><LogOut size={15} /> Log out</button></div><div className="interest-selector"><span className="eyebrow">Personalize your shelf</span><h2>What are you interested in?</h2><p>Pick as many as you like. Your choices are saved to your private profile.</p><div className="interest-options">{interestOptions.map(item => <button key={item} className={interests.includes(item) ? 'selected' : ''} onClick={() => toggleInterest(item)}>{interests.includes(item) && <Check size={16} />}{item}</button>)}</div><button className="button button-ink" onClick={saveProfile} disabled={saving}>{saving ? <><LoaderCircle className="spin" size={16} /> Saving...</> : 'Save interests'} <ArrowRight size={16} /></button>{message && <p className="profile-success" role="status">{message}</p>}{error && <p className="profile-error" role="alert">{error}</p>}</div></div></ProfileFrame>
}

function ProfileFrame({ children }: { children: React.ReactNode }) { return <><section className="page-intro"><div className="container"><span className="eyebrow">Your corner of the hub</span><h1>Make it yours.</h1><p>Choose interests and keep your useful discoveries connected to you.</p></div></section><section className="section"><div className="container">{children}</div></section></> }
