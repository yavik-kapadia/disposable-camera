-- Enable pg_net extension for HTTP requests from database
-- Required for cron jobs that call Edge Functions

-- Enable the pg_net extension (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres, anon, authenticated, service_role;

-- Note: After running this, you can set up cron jobs to call Edge Functions
-- Example cron job SQL (run in Supabase SQL Editor > Cron Jobs):
-- 
-- SELECT cron.schedule(
--   'cleanup-deleted-events-daily',
--   '0 0 * * *', -- Daily at midnight
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-deleted-events',
--     headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
--   ) AS request_id;
--   $$
-- );

