import { GeistSans } from 'geist/font/sans'
import "./globals.css";
import { Metadata } from 'next';
import ThemeProvider from '@/src/components/theme-provider';
import { Geist } from "next/font/google";
import { cn } from "@/src/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Fin Tracker',
  description: 'Track your finances',
};

export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {

  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${GeistSans.className} antialiased`}>
        {/* ThemeProvider is used to provide the theme to the children */}
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
