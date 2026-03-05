import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vani',
  description: 'listen to the universe..'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
