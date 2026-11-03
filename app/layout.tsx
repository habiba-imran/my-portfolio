import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { SoundProvider } from "@/context/SoundContext";
import { VoiceSessionProvider } from "@/context/VoiceSessionContext";
import FloatingVoiceControls from "@/components/FloatingVoiceControls";

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://habiba-imran-portfolio.vercel.app"),
  title: "Habiba Imran | Software Engineer - AI & Full Stack",
  description:
    "Software engineer building full-stack products, backend APIs, and real-time AI voice systems. CS student at Bahria University.",
  openGraph: {
    title: "Habiba Imran | Software Engineer - AI & Full Stack",
    description:
      "Real-time voice AI, thoughtful web apps, and the systems behind them.",
    url: "https://habiba-imran-portfolio.vercel.app",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${onest.variable} ${onest.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <VoiceSessionProvider>
            <SoundProvider>{children}</SoundProvider>
            <FloatingVoiceControls />
          </VoiceSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
