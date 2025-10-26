import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import sharp from 'https://esm.sh/sharp@0.33.0';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageId, filePath, eventId } = await req.json();

    if (!imageId || !filePath || !eventId) {
      throw new Error('Missing required parameters: imageId, filePath, eventId');
    }

    console.log(`Processing thumbnail for image ${imageId}: ${filePath}`);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the original image
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('event-images')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download image: ${downloadError?.message}`);
    }

    console.log(`Downloaded image: ${fileData.size} bytes`);

    // Convert blob to array buffer for processing
    const arrayBuffer = await fileData.arrayBuffer();
    const imageBytes = new Uint8Array(arrayBuffer);

    // Generate thumbnail using canvas (via browser APIs in Deno)
    const thumbnail = await generateThumbnail(imageBytes, fileData.type);

    // Generate thumbnail path
    const thumbnailPath = filePath.replace(/^([^/]+\/)/, '$1thumb_').replace(/\.(jpg|jpeg|png)$/i, '.webp');

    console.log(`Uploading thumbnail to: ${thumbnailPath}`);

    // Upload thumbnail
    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(thumbnailPath, thumbnail, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload thumbnail: ${uploadError.message}`);
    }

    // Update database with thumbnail path
    const { error: updateError } = await supabase
      .from('images')
      .update({ thumbnail_path: thumbnailPath })
      .eq('id', imageId);

    if (updateError) {
      throw new Error(`Failed to update database: ${updateError.message}`);
    }

    console.log(`Successfully generated thumbnail for image ${imageId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        thumbnailPath,
        message: 'Thumbnail generated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Thumbnail generation using Sharp library
async function generateThumbnail(imageBytes: Uint8Array, mimeType: string): Promise<Blob> {
  try {
    console.log(`Processing ${imageBytes.length} bytes with Sharp...`);
    
    // Use Sharp to resize and convert to WebP
    const resizedBuffer = await sharp(imageBytes)
      .resize(400, 400, { 
        fit: 'inside',           // Maintain aspect ratio, fit within 400x400
        withoutEnlargement: true // Don't upscale smaller images
      })
      .webp({ 
        quality: 70,             // Good balance of size vs quality
        effort: 4                // Compression effort (0-6, higher = smaller file)
      })
      .toBuffer();
    
    console.log(`Thumbnail generated: ${resizedBuffer.length} bytes (${Math.round(resizedBuffer.length / imageBytes.length * 100)}% of original)`);
    
    return new Blob([resizedBuffer], { type: 'image/webp' });
    
  } catch (error) {
    console.error('Sharp thumbnail generation failed:', error);
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}

