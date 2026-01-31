'use client'

import { useTheme } from '@payloadcms/ui'

export default function Logo() {
  const { theme } = useTheme()
  const logoSrc = theme === 'dark' ? '/logo-dark.png' : '/logo-lt.png'

  return <img src={logoSrc} alt="Italia Lacrosse" style={{ maxHeight: '120px', width: 'auto' }} />
}
