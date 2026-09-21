-- Photos shown on the public Gallery page, grouped by an admin-chosen section
-- label (e.g. "Convocation", "Campus Life") rather than a fixed enum, so new
-- sections can be created just by typing a new name when uploading a photo.
CREATE TABLE gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL,
  caption text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gallery_photos_section ON gallery_photos(section, position) WHERE is_published;
