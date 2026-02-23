import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OnePrint",
  description: "Self-Service Printing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
               if (typeof window !== 'undefined' && typeof window.ethereum === 'undefined') {
                 window.ethereum = {
                   isMetaMask: false,
                   request: async () => {},
                   on: () => {},
                   removeListener: () => {},
                   selectedAddress: null
                 };
               }
             `,
          }}
        />
      </body>
    </html>
  );
}
