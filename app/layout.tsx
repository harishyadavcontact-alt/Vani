import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vani',
  description: 'Production-grade X audio client for focused listening.',
  applicationName: 'Vani',
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
