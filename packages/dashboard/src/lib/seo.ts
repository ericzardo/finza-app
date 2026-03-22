/**
 * Utilitário de SEO para manipulação dinâmica de metadados por rota.
 * Padrão da skill finza-copywriter.
 */

import env from "@env"

interface PageMetaOptions {
  title: string
  description: string
  ogImage?: string
  canonical?: string
  noindex?: boolean
  ogType?: 'website' | 'article'
}

const BASE_TITLE = 'Finza'
const DEFAULT_OG_IMAGE = `${env.APP_URL}/og-image.png`

function setMeta(name: string, content: string, property = false) {
  const attr = property ? 'property' : 'name'
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Define metadados da página de forma imperativa.
 * Usar nos `beforeLoad` ou `loader` das rotas TanStack Router.
 *
 * @example
 * // Em uma rota:
 * beforeLoad: () => { setPageMeta({ title: 'Finza', description: '...' }) }
 */
export function setPageMeta({
  title,
  description,
  ogImage = DEFAULT_OG_IMAGE,
  canonical,
  noindex = false,
  ogType = 'website',
}: PageMetaOptions) {
  document.title = title

  // Meta básicos
  setMeta('description', description)
  if (noindex) setMeta('robots', 'noindex, nofollow')

  // Open Graph
  setMeta('og:title', title, true)
  setMeta('og:description', description, true)
  setMeta('og:image', ogImage, true)
  setMeta('og:type', ogType, true)
  setMeta('og:site_name', BASE_TITLE, true)

  // Twitter Card
  setMeta('twitter:card', 'summary_large_image')
  setMeta('twitter:title', title)
  setMeta('twitter:description', description)
  setMeta('twitter:image', ogImage)

  // Canonical
  if (canonical) {
    setLink('canonical', canonical)
  } else {
    setLink('canonical', `${env.APP_URL}${window.location.pathname}`)
  }
}
