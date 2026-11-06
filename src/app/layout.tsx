import "./globals.css";
import { Metadata } from 'next';
import ThemeProvider from '@/src/components/theme-provider';
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/src/lib/utils";
import { I18nProvider } from "@/src/lib/i18n";
import { AuthListener } from "@/src/components/auth/auth-listener"
import { Toaster } from "@/src/components/ui/sonner";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['300', '400', '600', '700'], variable: '--font-jakarta' });

export const metadata: Metadata = {
  title: 'FlowX',
  description: 'Track your finances',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FlowX',
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {

  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable, jakarta.variable)}>
      <head>
        <meta name="theme-color" content="#09090b" />
      </head>
      <body suppressHydrationWarning className={`${inter.className} antialiased relative`}>
        {/* ThemeProvider is used to provide the theme to the children */}
        <AuthListener />
        <ThemeProvider>
          <I18nProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
