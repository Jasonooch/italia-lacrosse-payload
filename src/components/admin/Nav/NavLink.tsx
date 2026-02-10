'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@payloadcms/ui'
import type { StaticLabel } from 'payload'
import { collectionIcons } from './icons'
import type { LucideIcon } from 'lucide-react'
import './nav-overrides.css'

const baseClass = 'nav'

function translateLabel(label: StaticLabel, language: string): string {
  if (typeof label === 'string') return label
  return label[language] ?? label.en ?? Object.values(label)[0] ?? ''
}

export const NavLink: React.FC<{
  exact?: boolean
  href: string
  id: string
  label: StaticLabel
  slug: string
}> = ({ exact, href, id, label, slug }) => {
  const pathname = usePathname()
  const { i18n } = useTranslation()
  const Icon: LucideIcon | undefined = collectionIcons[slug]

  const isActive = exact
    ? pathname === href
    : pathname.startsWith(href) && [undefined, '/'].includes(pathname[href.length])
  const translatedLabel = translateLabel(label, i18n.language)

  const Label = (
    <>
      {Icon && <Icon size={16} style={{ flexShrink: 0 }} />}
      <span className={`${baseClass}__link-label`}>{translatedLabel}</span>
    </>
  )

  const linkStyle = { gap: '0.75rem' }
  const className = `${baseClass}__link${isActive ? ` ${baseClass}__link--active` : ''}`

  if (pathname === href) {
    return (
      <div className={className} id={id} style={linkStyle}>
        {Label}
      </div>
    )
  }

  return (
    <Link className={className} href={href} id={id} prefetch={false} style={linkStyle}>
      {Label}
    </Link>
  )
}
