import { FormEvent, useEffect, useState } from 'react'
import { ArrowRight, Check, Code2, Layers3, LayoutTemplate, Mail, MapPin, Menu, MessageCircle, MousePointer2, Send, Sparkles, Smartphone, X, Zap } from 'lucide-react'

type PackageId = 'starter' | 'business' | 'professional'

type WebsitePackage = {
  id: PackageId
  name: string
  price: string
  level: string
  description: string
  features: string[]
  accent: string
}

const packages: WebsitePackage[] = [
  { id: 'starter', name: 'Starter', price: '$300', level: 'A clear first step', description: 'A polished, focused presence for a local business or new idea.', accent: 'mint', features: ['Up to 3 pages', 'Responsive design', 'Contact / WhatsApp CTA', 'Basic SEO setup', 'Fast deployment'] },
  { id: 'business', name: 'Business', price: '$600', level: 'Built to grow', description: 'A custom digital home with more room for your services and story.', accent: 'coral', features: ['Up to 7 pages', 'Custom animations', 'Contact forms + analytics', 'WhatsApp + social integration', '2 revision rounds'] },
  { id: 'professional', name: 'Professional', price: '$1,000', level: 'The full experience', description: 'An immersive, premium website for ambitious brands and teams.', accent: 'violet', features: ['Up to 12 pages', 'Premium UI / UX', 'Interactive and 3D elements', 'Lead capture + SEO foundations', '3 revision rounds'] },
]

const demoLabels: Record<PackageId, { eyebrow: string; title: string; copy: string }> = {
  starter: { eyebrow: 'Luma Studio / Local creative', title: 'Make your everyday brighter.', copy: 'A warm, confident home for a business people can trust.' },
  business: { eyebrow: 'Northline & Co. / Growth studio', title: 'Built for the next move.', copy: 'A sharper digital headquarters for a team with momentum.' },
  professional: { eyebrow: 'Astra / 09 / Future culture', title: 'Imagine what is possible.', copy: 'An immersive experience for brands that want to be remembered.' },
}

export default function WebsiteCreationPage() {
  const [selectedPackage, setSelectedPackage] = useState('Business')
    const [submitted, setSubmitted] = useState<boolean>(false)
  const [activeDemo, setActiveDemo] = useState<PackageId | null>(null)

  useEffect(() => {
    document.body.classList.toggle('modal-open', activeDemo !== null)
    return () => document.body.classList.remove('modal-open')
  }, [activeDemo])

  const scrollToRequest = (packageName?: string) => {
    setActiveDemo(null)
    if (packageName) setSelectedPackage(packageName)
    document.getElementById('website-request')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const submitRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries())
    const body = Object.entries(values).map(([label, value]) => `${label}: ${value}`).join('\n\n')
    const subject = encodeURIComponent(`Website Portfolio request from ${values.name || 'a new client'}`)
    window.location.href = `mailto:millenaryhub@gmail.com?subject=${subject}&body=${encodeURIComponent(body)}`
    setSubmitted(true)
  }

  return <div className="website-page">
    <section className="website-hero">
      <div className="website-hero-grid">
        <div className="website-hero-copy website-reveal">
          <span className="website-kicker"><i /> MillenaryHub / Website Portfolio</span>
          <h1>WE BUILD WEBSITES THAT MAKE <em>BUSINESSES STAND OUT.</em></h1>
          <p>Affordable website design and professional website development for small businesses, growing brands and ambitious teams.</p>
          <div className="website-hero-actions"><button className="website-button website-button-bright" onClick={() => document.getElementById('website-packages')?.scrollIntoView({ behavior: 'smooth' })}>View Packages <ArrowRight size={17} /></button><button className="website-button website-button-ghost" onClick={() => scrollToRequest()}>Request a Website <Send size={16} /></button></div>
          <div className="website-proof-line"><span><Zap size={15} /> Fast by default</span><span><Smartphone size={15} /> Built for every screen</span></div>
        </div>
        <div className="website-hero-stage website-reveal website-delay-1" aria-label="Animated website interface preview"><div className="website-stage-glow" /><div className="website-browser website-browser-back"><div className="website-browser-bar"><i /><i /><i /></div><div className="website-back-lines"><span /><span /><span /><b /></div></div><div className="website-browser website-browser-front"><div className="website-browser-bar"><i /><i /><i /><strong>millenary.studio</strong></div><div className="website-preview-nav"><b>MS</b><span /><span /><span /></div><div className="website-preview-hero"><small>YOUR NEXT CHAPTER</small><strong>Make it<br /><em>visible.</em></strong><button>Explore <ArrowRight size={12} /></button></div><div className="website-preview-cards"><i /><i /><i /></div></div><span className="website-floating website-floating-top"><Code2 size={15} /> Clean code</span><span className="website-floating website-floating-bottom"><span className="website-live-dot" /> Online / Ready</span></div>
      </div>
      <div className="website-scroll-cue"><span>Scroll to explore</span><ArrowRight size={16} /></div>
    </section>

    <section className="website-section website-intro-section"><div className="website-container website-intro-grid"><div><span className="website-label">A website with a job to do</span><h2>Your website should do more than <em>exist.</em></h2></div><p>We combine strategy, design and thoughtful development to create digital homes that work hard for your business.</p></div></section>

    <section className="website-section website-packages-section" id="website-packages"><div className="website-container"><div className="website-section-heading"><div><span className="website-label">Choose your level</span><h2>See the difference<br /><em>in motion.</em></h2></div><p>Every package is responsive, purposeful and paired with a living preview of what your website could become.</p></div><div className="website-package-grid">{packages.map((item, index) => <div className="website-package-column" key={item.id}><article className={`website-package website-package-${item.accent} ${item.id === 'business' ? 'website-package-featured' : ''}`}>{item.id === 'business' && <span className="website-popular">Most Popular</span>}<div className="website-package-top"><span className="website-package-index">0{index + 1}</span><span className="website-package-icon">{item.id === 'starter' ? <LayoutTemplate size={19} /> : item.id === 'business' ? <Layers3 size={19} /> : <Sparkles size={19} />}</span></div><div className="website-package-heading"><h3>{item.name}</h3><span>{item.level}</span></div><strong className="website-price">{item.price}</strong><p>{item.description}</p><ul>{item.features.map(feature => <li key={feature}><Check size={14} />{feature}</li>)}</ul><button className="website-package-cta" onClick={() => scrollToRequest(item.name)}>Choose {item.name} <ArrowRight size={16} /></button></article><div className="website-demo-wrap"><div className="website-demo-tag"><span><i /> Live sample</span><button onClick={() => setActiveDemo(item.id)} aria-label={`Open ${item.name} demo`}><MousePointer2 size={13} /> Expand</button></div><DemoPreview id={item.id} /></div></div>)}</div></div></section>

    <section className="website-section website-process-section"><div className="website-container"><div className="website-section-heading"><div><span className="website-label">A clear path</span><h2>From first thought<br />to <em>live.</em></h2></div><p>Good work feels calmer when everyone knows what happens next.</p></div><div className="website-process-grid">{[['01', 'Tell us what you need'], ['02', 'We design your website'], ['03', 'We build and refine it'], ['04', 'Your website goes live']].map(([number, title]) => <div className="website-process-step" key={number}><span>{number}</span><h3>{title}</h3><p>Focused collaboration, clear feedback and a useful next step.</p></div>)}</div></div></section>

    <section className="website-section website-request-section" id="website-request"><div className="website-container website-request-grid"><div><span className="website-label">Start the conversation</span><h2>Let’s make<br /><em>something useful.</em></h2><p>Share the shape of your idea. This form is a starting point, not a commitment.</p><div className="website-request-note"><MapPin size={17} /><span>MillenaryHub<br /><b>Learn. Build. Earn.</b></span></div></div>{submitted ? <div className="website-request-success"><Check size={28} /><span className="website-label">Request received</span><h3>That’s a strong start.</h3><p>Your email app should now have the full brief ready to send. We’ll review it and get back to you with the next useful step.</p><button className="website-button website-button-dark" onClick={() => setSubmitted(false)}>Send another request</button></div> : <div><form className="website-request-form" onSubmit={submitRequest}><div className="website-form-row"><label><span>Name</span><input required name="name" placeholder="Your name" /></label><label><span>Email</span><input required type="email" name="email" placeholder="you@example.com" /></label></div><div className="website-form-row"><label><span>WhatsApp / Phone</span><input required name="phone" placeholder="+256 ..." /></label><label><span>Business / Brand name</span><input required name="brand" placeholder="Your brand" /></label></div><div className="website-form-row"><label><span>Package interested in</span><select name="package" value={selectedPackage} onChange={event => setSelectedPackage(event.target.value)}><option>Starter</option><option>Business</option><option>Professional</option><option>Not sure yet</option></select></label><label><span>Type of website</span><select required name="type"><option value="">Choose a direction</option><option>Business website</option><option>Landing page</option><option>Portfolio</option><option>Online store</option><option>Other</option></select></label></div><label><span>What do you need?</span><textarea required name="description" rows={5} placeholder="Tell us about your audience, goals and the kind of experience you have in mind..." /></label><button className="website-button website-button-dark" type="submit">Send Website Request <Send size={16} /></button></form><div className="website-direct-contact"><a aria-label="Email MillenaryHub" title="Email MillenaryHub" href="mailto:millenaryhub@gmail.com"><Mail size={18} /><span><small>Email MillenaryHub</small>millenaryhub@gmail.com</span></a><a aria-label="Chat with MillenaryHub on WhatsApp" title="Chat with MillenaryHub on WhatsApp" href="https://wa.me/256704393765" target="_blank" rel="noreferrer"><MessageCircle size={18} /><span><small>Chat on WhatsApp</small>+256 704 393 765</span></a></div></div>}</div></section>
    {activeDemo && <div className="website-demo-modal" role="dialog" aria-modal="true" aria-label={`${demoLabels[activeDemo].eyebrow} website demo`}><button className="website-modal-close" onClick={() => setActiveDemo(null)} aria-label="Close website demo"><X size={22} /></button><div className="website-modal-content"><div className="website-modal-kicker"><span>Interactive direction / {packages.find(item => item.id === activeDemo)?.name}</span><button onClick={() => scrollToRequest(packages.find(item => item.id === activeDemo)?.name)}>Build something like this <ArrowRight size={15} /></button></div><DemoPreview id={activeDemo} expanded /></div></div>}
  </div>
}

function DemoPreview({ id, expanded = false }: { id: PackageId; expanded?: boolean }) {
  const label = demoLabels[id]
  return <div className={`website-demo-preview website-demo-${id} ${expanded ? 'website-demo-expanded' : ''}`}><div className="website-demo-scan" /><div className="website-demo-nav"><strong>{label.eyebrow.split(' ')[0]}</strong><span /><span /><span /><button aria-label="Demo menu"><Menu size={expanded ? 16 : 13} /></button></div><div className="website-demo-copy"><small>{id === 'starter' ? 'CREATIVE / LOCAL / HUMAN' : id === 'business' ? 'STRATEGY / SYSTEMS / GROWTH' : 'DIGITAL / CULTURE / FUTURE'}</small><h3>{label.title}</h3><p>{label.copy}</p><button>{id === 'starter' ? 'See the work' : id === 'business' ? 'Explore the studio' : 'Enter experience'} <ArrowRight size={14} /></button></div>{id === 'starter' && <><div className="website-demo-sun" /><div className="website-demo-services"><i /><i /><i /></div></>}{id === 'business' && <><div className="website-demo-orbit"><i /><i /><i /></div><div className="website-demo-stats"><b>+84%</b><span>momentum</span></div></>}{id === 'professional' && <><div className="website-demo-gridlines" /><div className="website-demo-planet" /><div className="website-demo-cards"><i /><i /><i /></div></>}{expanded && <div className="website-demo-page-sections"><section><span>01 / What we do</span><h4>{id === 'starter' ? 'Good work, made human.' : id === 'business' ? 'A system that moves with you.' : 'A new dimension for your brand.'}</h4><p>Thoughtful design, useful structure and a digital experience shaped around real people.</p></section><section><span>02 / The details</span><div className="website-demo-detail-grid"><i /><i /><i /></div><p>Responsive layouts, clear content and moments that reward attention.</p></section><section><span>03 / Start a conversation</span><h4>Let’s build what comes next.</h4><button>Get in touch <ArrowRight size={14} /></button></section></div>}</div>
}
