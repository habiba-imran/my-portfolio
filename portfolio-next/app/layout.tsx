import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { SoundProvider } from '@/context/SoundContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Habiba Imran | Software Engineer · AI & Full Stack',
  description: 'Software Engineer at Finova Solutions building AI voice platforms. CS student at Bahria University. Full stack + production AI systems.',
  openGraph: {
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SoundProvider>
            {children}
          </SoundProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
