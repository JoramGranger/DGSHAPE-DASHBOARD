import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DGSHAPE Analytics | Executive Dashboard',
  description: 'Executive dashboard for dental machine performance analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}