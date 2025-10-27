-- Simple cron job to cleanup deleted events (no pg_net required!)
-- This runs the cleanup directly in SQL, no Edge Function needed

-- Schedule the cleanup to run daily at midnight
SELECT cron.schedule(
  'cleanup-deleted-events-daily',
  '0 0 * * *', -- Daily at midnight UTC
  $$
  -- Delete events that have been soft-deleted for more than 14 days
  DELETE FROM events
  WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '14 days';
  $$
);

-- To check if the cron job was created successfully:
-- SELECT * FROM cron.job;

-- To unschedule (if you need to):
-- SELECT cron.unschedule('cleanup-deleted-events-daily');

-- To see cron job history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

