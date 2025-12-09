import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OPAS | Autonomous Agent Platform',
  description: 'Multi-domain autonomous agent with real tool execution and human-in-the-loop safety.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} ${mono.variable}`}>
      <head />
      <body className="antialiased overflow-hidden font-sans">
        {children}
      </body>
    </html>
  )
}
