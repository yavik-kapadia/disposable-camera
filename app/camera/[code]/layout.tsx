import type { Metadata } from "next";
import { supabase } from '@/lib/supabase';

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ code: string }> 
}): Promise<Metadata> {
  const { code } = await params;
  
  // Fetch event details server-side
  const { data: event } = await supabase
    .from('events')
    .select('name, description')
    .eq('access_code', code.toUpperCase())
    .single();

  const eventName = event?.name || 'Camera';
  const eventDescription = event?.description || `Take photos for ${eventName}`;

  return {
    title: `${eventName} - Camera`,
    description: eventDescription,
    manifest: `/camera/${code}/manifest.json`,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: eventName,
    },
    applicationName: eventName,
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  };
}

export default function CameraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

