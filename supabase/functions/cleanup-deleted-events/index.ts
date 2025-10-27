/**
 * Supabase Edge Function: Cleanup Deleted Events
 * 
 * Permanently deletes events that were soft-deleted more than 14 days ago.
 * Images cascade delete automatically due to ON DELETE CASCADE constraint.
 * 
 * To deploy:
 * supabase functions deploy cleanup-deleted-events
 * 
 * To test:
 * curl -X POST https://your-project.supabase.co/functions/v1/cleanup-deleted-events \
 *   -H "Authorization: Bearer YOUR_ANON_KEY"
 * 
 * To schedule (run daily at 2 AM UTC):
 * 1. Go to Supabase Dashboard → Database → Cron Jobs
 * 2. Create new cron job:
 *    Schedule: 0 2 * * *
 *    SQL: SELECT net.http_post(
 *           url := 'https://your-project.supabase.co/functions/v1/cleanup-deleted-events',
 *           headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
 *         );
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get events that should be permanently deleted
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14);

    const { data: eventsToDelete, error: fetchError } = await supabase
      .from('events')
      .select('id, name, deleted_at')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate.toISOString());

    if (fetchError) throw fetchError;

    if (!eventsToDelete || eventsToDelete.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No events to delete',
          deleted_count: 0,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${eventsToDelete.length} events to delete:`, eventsToDelete);

    // Delete events (images will cascade delete automatically)
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .not('deleted_at', 'is', null)
      .lt('deleted_at', cutoffDate.toISOString());

    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully deleted ${eventsToDelete.length} event(s)`,
        deleted_count: eventsToDelete.length,
        events: eventsToDelete.map(e => ({ id: e.id, name: e.name, deleted_at: e.deleted_at })),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error cleaning up deleted events:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

