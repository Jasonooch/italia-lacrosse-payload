'use client'

import { useTheme } from '@payloadcms/ui'

export default function Icon() {
  const { theme } = useTheme()
  const iconSrc = theme === 'dark' ? '/logo-dark.png' : '/logo-lt.png'

  return (
    <img src={iconSrc} alt="IL" style={{ height: '20px', width: '20px', objectFit: 'contain' }} />
  )
}
