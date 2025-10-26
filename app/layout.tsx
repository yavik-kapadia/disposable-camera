import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', isDark);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${cothamSans.variable} antialiased bg-white dark:bg-black transition-colors duration-200`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
