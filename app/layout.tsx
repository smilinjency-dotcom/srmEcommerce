import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | SRMStore",
    default: "SRMStore — Shop smarter, live better",
  },
  description:
    "Discover a curated collection of premium products — from everyday essentials to hard-to-find favourites — delivered right to your door.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "SRMStore",
    title: "SRMStore — Shop smarter, live better",
    description:
      "Discover a curated collection of premium products — from everyday essentials to hard-to-find favourites — delivered right to your door.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SRMStore — Shop smarter, live better",
    description:
      "Discover a curated collection of premium products — from everyday essentials to hard-to-find favourites — delivered right to your door.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
