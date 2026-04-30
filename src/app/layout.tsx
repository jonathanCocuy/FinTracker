import "./globals.css";
import { Metadata } from 'next';
import ThemeProvider from '@/src/components/theme-provider';
import { Inter } from "next/font/google";
import { cn } from "@/src/lib/utils";
import { I18nProvider } from "@/src/lib/i18n";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'FinTracker',
  description: 'Track your finances',
};

export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {

  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body className={`${inter.className} antialiased relative`}>
        {/* ThemeProvider is used to provide the theme to the children */}
        <ThemeProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
