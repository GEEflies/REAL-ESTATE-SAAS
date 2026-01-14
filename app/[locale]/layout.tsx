import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server'; // Correct import for Next.js 14+
import { Navbar } from '@/components/Navbar'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Aurix | AI Real Estate Photo Editor',
  description: 'Enhance photos & remove objects in seconds with AI-powered real estate photo editing.',
  keywords: ['real estate', 'photo editing', 'AI', 'HDR', 'property photos'],
  authors: [{ name: 'Aurix' }],
  icons: {
    icon: '/aurix-logo.png',
    apple: '/aurix-logo.png',
  },
  openGraph: {
    title: 'Aurix | AI Real Estate Photo Editor',
    description: 'Enhance photos & remove objects in seconds with AI-powered real estate photo editing.',
    type: 'website',
    images: [
      {
        url: '/aurix-logo.png',
        width: 1200,
        height: 630,
        alt: 'Aurix Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aurix | AI Real Estate Photo Editor',
    description: 'Enhance photos & remove objects in seconds with AI-powered real estate photo editing.',
    images: ['/aurix-logo.png'],
  },
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  const messages = await getMessages();

  const content = (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
          <Toaster
            position="top-right"
            richColors
            closeButton
          />
        </NextIntlClientProvider>
      </body>
    </html>
  )

  // Only use ClerkProvider if credentials are available
  if (hasClerkKey) {
    return <ClerkProvider>{content}</ClerkProvider>
  }

  return content
}
