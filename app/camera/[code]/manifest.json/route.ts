import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  
  try {
    // Fetch event details
    const { data: event, error } = await supabase
      .from('events')
      .select('id, name, description, is_active')
      .eq('access_code', code.toUpperCase())
      .single();

    if (error || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const startUrl = `/camera/${code.toUpperCase()}`;

    // Generate dynamic manifest for this specific event
    const manifest = {
      name: `${event.name} - Camera`,
      short_name: event.name,
      description: event.description || `Take photos for ${event.name}`,
      start_url: startUrl,
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#f97316',
      orientation: 'portrait',
      scope: startUrl,
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/manifest-icon-192.maskable.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable',
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/manifest-icon-512.maskable.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
      categories: ['photo', 'social'],
      shortcuts: [
        {
          name: 'Take Photo',
          short_name: 'Camera',
          description: `Take photos for ${event.name}`,
          url: startUrl,
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
            },
          ],
        },
      ],
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Manifest generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate manifest' },
      { status: 500 }
    );
  }
}

