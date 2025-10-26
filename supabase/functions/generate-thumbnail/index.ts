import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

// Thumbnail generation using ImageMagick
async function generateThumbnail(imageBytes: Uint8Array, mimeType: string): Promise<Blob> {
  let tempInput: string | null = null;
  let tempOutput: string | null = null;
  
  try {
    console.log(`Processing ${imageBytes.length} bytes with ImageMagick...`);
    
    // Create temporary files
    tempInput = await Deno.makeTempFile({ suffix: '.jpg' });
    tempOutput = await Deno.makeTempFile({ suffix: '.webp' });
    
    // Write input image to temp file
    await Deno.writeFile(tempInput, imageBytes);
    
    // Use ImageMagick convert command to resize and convert to WebP
    // -resize 400x400> means resize to fit within 400x400, don't enlarge
    // -quality 70 sets WebP quality
    const command = new Deno.Command("convert", {
      args: [
        tempInput,
        "-resize", "400x400>",  // Resize to fit within 400x400, don't upscale
        "-quality", "70",        // WebP quality
        tempOutput
      ],
    });
    
    const { success, stderr } = await command.output();
    
    if (!success) {
      const errorText = new TextDecoder().decode(stderr);
      throw new Error(`ImageMagick conversion failed: ${errorText}`);
    }
    
    // Read the output file
    const resizedBytes = await Deno.readFile(tempOutput);
    
    console.log(`Thumbnail generated: ${resizedBytes.length} bytes (${Math.round(resizedBytes.length / imageBytes.length * 100)}% of original)`);
    
    // Cleanup temp files
    await Deno.remove(tempInput);
    await Deno.remove(tempOutput);
    tempInput = null;
    tempOutput = null;
    
    return new Blob([resizedBytes], { type: 'image/webp' });
    
  } catch (error) {
    console.error('ImageMagick thumbnail generation failed:', error);
    
    // Cleanup on error
    try {
      if (tempInput) await Deno.remove(tempInput);
      if (tempOutput) await Deno.remove(tempOutput);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}

