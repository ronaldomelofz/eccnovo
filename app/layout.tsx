import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ECC Alimento do Amor',
  description: 'Site oficial do ECC Alimento do Amor — Encontros de Casais com Cristo. Galeria de fotos e agenda dos encontros.',
  keywords: ['ECC', 'Alimento do Amor', 'Encontros de Casais', 'Cristo'],
  openGraph: {
    title: 'ECC Alimento do Amor',
    description: 'Encontros de Casais com Cristo — 57º ECC 2023',
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: '/FOTOS/logo.jpeg', width: 400, height: 533, alt: 'Logo ECC Alimento do Amor' }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/FOTOS/logo.jpeg" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
