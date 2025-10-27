import Sidebar from '@/components/Sidebar'
import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Atlas | Autonomous Assistant',
  description: 'A local, secure, and continuous autonomous agent.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </head>
      <body className={`${outfit.variable} antialiased`}>
        <div className="container mx-auto max-w-[1400px] h-screen flex p-8 gap-8">
          <Sidebar />
          <main className="flex-grow flex flex-col glass overflow-hidden relative shadow-[0_0_50px_rgba(0,242,254,0.03)] border-t border-l border-white/5">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
