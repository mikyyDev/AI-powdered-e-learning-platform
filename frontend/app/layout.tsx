import './globals.css'
import type { Metadata } from 'next'
import Navbar from '@/components/ui/Navbar'
import { AuthProvider } from '@/context/AuthContext'
import ChatPanel from '@/components/ai/ChatPanel'

export const metadata: Metadata = {
  title: 'ET Learning Platform',
  description: 'AI-powered learning platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <ChatPanel />
        </AuthProvider>
      </body>
    </html>
  )
}