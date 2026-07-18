import React from 'react'
import './globals.css'
import { ThemeProvider } from '@/components/dashboard/theme-provider'

export const metadata = {
  title: 'Italia Lacrosse Dashboard',
  description: 'Staff dashboard for Italia Lacrosse',
  icons: { icon: '/logo-lt.png' },
}

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: next-themes sets the class attribute on this
    // element via an inline script before React hydrates, to avoid a flash
    // of the wrong theme. That intentional pre-hydration mutation is what
    // this suppresses — nothing else on <html> should rely on it.
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
