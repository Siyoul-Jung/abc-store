import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  icons: {
    icon: '/insta_logo.png',
    apple: '/insta_logo.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  )
}
