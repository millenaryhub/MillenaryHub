import { useState } from 'react'
import { BookOpen, BriefcaseBusiness, Compass, Lightbulb, Palette, WalletCards } from 'lucide-react'

const ebookCategories = [
  { title: 'Money & Personal Finance', examples: 'Budgeting, saving, debt basics and responsible investing', icon: WalletCards },
  { title: 'Business & Entrepreneurship', examples: 'Business ideas, customer research, pricing and simple operations', icon: BriefcaseBusiness },
  { title: 'Digital Skills & Freelancing', examples: 'Websites, design, writing, AI workflows and freelance offers', icon: Compass },
  { title: 'Personal Growth & Learning', examples: 'Study systems, confidence, habits and practical career skills', icon: Lightbulb },
  { title: 'Creative Work', examples: 'Content creation, visual design, storytelling and publishing', icon: Palette },
]

export default function EbooksPage() {
  const [activeCategory, setActiveCategory] = useState(ebookCategories[0].title)
  const selectedCategory = ebookCategories.find(category => category.title === activeCategory) || ebookCategories[0]
  const SelectedIcon = selectedCategory.icon
  return <><section className="page-intro"><div className="container"><span className="eyebrow">MillenaryHub library</span><h1>Useful ebooks.</h1><p>Choose a category to explore. No ebooks are published yet, so the catalogue stays intentionally blank until the first resources are ready.</p></div></section><section className="section ebooks-section"><div className="container"><div className="ebooks-toolbar"><div><span className="eyebrow">Coming soon</span><h2>Choose a category</h2></div></div><div className="ebook-category-tabs" role="tablist" aria-label="Ebook categories">{ebookCategories.map(({ title, icon: Icon }) => <button role="tab" aria-selected={activeCategory === title} className={activeCategory === title ? 'active' : ''} key={title} onClick={() => setActiveCategory(title)}><Icon size={17} /><span>{title}</span></button>)}</div><div className="ebook-category-panel"><span className="ebook-category-icon"><SelectedIcon size={23} /></span><span className="eyebrow">{selectedCategory.title}</span><h2>No ebooks in this category yet.</h2><p>{selectedCategory.examples}. New resources will appear here after they have been researched, written and prepared for publication.</p><span className="ebook-category-status">Catalogue empty</span></div><div className="ebook-state"><BookOpen size={23} /><h3>The library is being curated.</h3><p>Check back later for practical, original ebooks from MillenaryHub.</p></div></div></section></>
}
