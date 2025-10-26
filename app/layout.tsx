import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const cothamSans = localFont({
  src: "./fonts/Cotham Sans Regular.otf",
  variable: "--font-cotham-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Disposable Camera - Event Photo Sharing",
  description: "Share and collect photos from your events with a virtual disposable camera",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cothamSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
