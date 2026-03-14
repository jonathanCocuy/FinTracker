import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ weight: "600", subsets: ["latin"] });

export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
