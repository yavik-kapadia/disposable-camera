-- Add thumbnail_path column to images table
ALTER TABLE images
ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN images.thumbnail_path IS 'Path to WebP thumbnail for faster gallery loading';

-- Create index on thumbnail_path for faster queries
CREATE INDEX IF NOT EXISTS idx_images_thumbnail_path ON images(thumbnail_path);

