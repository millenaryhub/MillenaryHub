import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { articles } from '../data/articles'
import { guideDetails } from '../data/content'

const siteUrl = 'https://millenaryhub.pages.dev'
const siteName = 'MillenaryHub'
const defaultImage = `${siteUrl}/og-image.svg`

type SeoConfig = { title: string; description: string; type?: 'website' | 'article'; image?: string; noindex?: boolean }

const staticSeo: Record<string, SeoConfig> = {
  '/': { title: 'MillenaryHub | Learn, Build & Earn', description: 'MillenaryHub helps curious people learn, build and earn with practical digital tools, business guides, ebooks, AI resources and website services.' },
  '/explore': { title: 'Explore Practical Ideas, Tools and Resources | MillenaryHub', description: 'Explore useful articles, business ideas, AI resources, practical tools and learning materials from MillenaryHub.' },
  '/tools': { title: 'Free Business, Money and Productivity Tools | MillenaryHub', description: 'Use free calculators and practical tools for savings, profit, trading risk, ebook pricing and business ideas.' },
  '/learn': { title: 'Practical Learning Guides for Business and Digital Skills | MillenaryHub', description: 'Read practical guides about starting a digital business, using AI tools and building your first freelance offer.' },
  '/resources': { title: 'Useful Digital Resources and Tools | MillenaryHub', description: 'Find carefully selected resources for productivity, design, coding, education, business and digital work.' },
  '/ebooks': { title: 'Business, Money and Digital Skills Ebooks | MillenaryHub', description: 'Browse the MillenaryHub ebook categories. New practical ebooks about money, business, digital skills and creative work are coming soon.' },
  '/blog': { title: 'MillenaryHub Journal | Business, Digital Products and AI', description: 'Read practical articles about online income, entrepreneurship, digital products, ebooks, AI tools, freelancing and financial habits.' },
  '/media': { title: 'Audio Tools for Content You Own | MillenaryHub', description: 'Explore MillenaryHub audio tools for content you created, own or have permission to process.' },
  '/audio-downloader': { title: 'Free Audio Downloader for Permitted Content | MillenaryHub', description: 'Search and prepare permitted audio from content you own or have permission to download.' },
  '/vocal-remover': { title: 'Vocal Remover and Audio Stem Tool | MillenaryHub', description: 'Separate vocals and instrumental audio locally with MillenaryHub’s vocal remover tool.' },
  '/website-portfolio': { title: 'Website Design and Development in Uganda | MillenaryHub', description: 'Explore affordable website design and professional website development in Uganda for small businesses, growing brands and ambitious teams.' },
  '/about': { title: 'About MillenaryHub | Learn, Build & Earn', description: 'Learn what MillenaryHub offers: practical knowledge, digital tools, business resources, ebooks and website creation services.' },
  '/contact': { title: 'Contact MillenaryHub', description: 'Contact MillenaryHub about digital products, learning resources, website design services and collaboration.' },
  '/privacy': { title: 'Privacy Policy | MillenaryHub', description: 'Read the MillenaryHub privacy information and how browser preferences and product data are handled.' },
  '/terms': { title: 'Terms | MillenaryHub', description: 'Read the MillenaryHub terms and general conditions for using this website.' },
}

const upsertMeta = (selector: string, attribute: string, key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.appendChild(element) }
  element.content = content
}

const upsertLink = (rel: string, href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) { element = document.createElement('link'); element.rel = rel; document.head.appendChild(element) }
  element.href = href
}

const upsertJsonLd = (data: object) => {
  let element = document.head.querySelector<HTMLScriptElement>('script[data-millenary-seo]')
  if (!element) { element = document.createElement('script'); element.type = 'application/ld+json'; element.dataset.millenarySeo = 'true'; document.head.appendChild(element) }
  element.textContent = JSON.stringify(data)
}

export default function Seo() {
  const location = useLocation()
  useEffect(() => {
    const pathname = location.pathname.replace(/\/$/, '') || '/'
    const canonicalPath = pathname === '/website-creation' ? '/website-portfolio' : pathname
    const article = canonicalPath.startsWith('/blog/') ? articles.find(item => item.href === canonicalPath) : undefined
    const guide = canonicalPath.startsWith('/learn/') ? guideDetails.find(item => `/learn/${item.id}` === canonicalPath) : undefined
    const config = article
      ? { title: `${article.title} | MillenaryHub`, description: article.intro, type: 'article' as const, image: article.image }
      : guide
        ? { title: `${guide.title} | MillenaryHub Learning Guide`, description: guide.summary }
        : staticSeo[canonicalPath] || { title: 'MillenaryHub | Learn, Build & Earn', description: 'Practical digital tools, business guides, resources and website services from MillenaryHub.' }
      const canonical = `${siteUrl}${canonicalPath}`
    const breadcrumbs = [{ '@type': 'ListItem', position: 1, name: 'MillenaryHub', item: siteUrl }]
    if (pathname !== '/') breadcrumbs.push({ '@type': 'ListItem', position: 2, name: config.title.replace(' | MillenaryHub', '').replace(' | MillenaryHub Learning Guide', ''), item: canonical })
    const graph: object[] = [
      { '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: siteName, url: siteUrl, email: 'millenaryhub@gmail.com', sameAs: ['https://wa.me/256704393765'] },
      { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: siteName, url: siteUrl, publisher: { '@id': `${siteUrl}/#organization` }, potentialAction: { '@type': 'SearchAction', target: `${siteUrl}/explore?query={search_term_string}`, 'query-input': 'required name=search_term_string' } },
      { '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical, name: config.title, description: config.description, isPartOf: { '@id': `${siteUrl}/#website` }, about: { '@id': `${siteUrl}/#organization` } },
      { '@type': 'BreadcrumbList', itemListElement: breadcrumbs },
    ]
    if (article) graph.push({ '@type': 'Article', headline: article.title, description: article.description, datePublished: article.date, author: { '@type': 'Organization', name: siteName }, publisher: { '@id': `${siteUrl}/#organization` }, mainEntityOfPage: canonical, image: article.image || defaultImage })
    if (pathname === '/website-portfolio') graph.push({ '@type': 'Service', serviceType: 'Website design and development', name: 'MillenaryHub Website Portfolio', provider: { '@id': `${siteUrl}/#organization` }, areaServed: ['Uganda', 'Worldwide'], description: config.description, offers: [{ '@type': 'Offer', price: '300', priceCurrency: 'USD', name: 'Starter website package' }, { '@type': 'Offer', price: '600', priceCurrency: 'USD', name: 'Business website package' }, { '@type': 'Offer', price: '1000', priceCurrency: 'USD', name: 'Professional website package' }] })
    document.title = config.title
    upsertMeta('meta[name="description"]', 'name', 'description', config.description)
    upsertMeta('meta[name="robots"]', 'name', 'robots', config.noindex ? 'noindex,follow' : 'index,follow')
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', config.title)
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', config.description)
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', config.type || 'website')
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
    upsertMeta('meta[property="og:site_name"]', 'property', 'og:site_name', siteName)
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', config.image || defaultImage)
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', config.title)
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', config.description)
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', config.image || defaultImage)
    upsertLink('canonical', canonical)
    upsertJsonLd({ '@context': 'https://schema.org', '@graph': graph })
  }, [location.pathname])
  return null
}
