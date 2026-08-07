import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased">
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
