-- Site media managed from the admin Upload page: the home page hero posters, the Gallery page's hero photo,
-- and the Gallery page's events (each event is one card that opens a carousel of its photos).

CREATE TABLE hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hero_slides_position ON hero_slides(position) WHERE is_published;

CREATE TABLE gallery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gallery_event_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES gallery_events(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_cover boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gallery_event_photos_event ON gallery_event_photos(event_id, position);

-- Small site-wide values that are not rows of their own (the Gallery page's hero photo).
CREATE TABLE site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The posters the home page showed before this table existed, so the page looks the same after the upgrade.
INSERT INTO hero_slides(image_url, title, position) VALUES
  ('/assets/carousel/posterd.jpeg', 'FCPS Part-1 & Residency combined batch', 0),
  ('/assets/carousel/posterc.jpeg', 'Residency March 2027 long batch', 1),
  ('/assets/carousel/posterb.jpeg', 'Residency regular and exam batches', 2),
  ('/assets/carousel/postera.jpeg', 'CPR Medical Academy, Chattogram', 3),
  ('/assets/carousel/postere.jpeg', 'Why CPR: academy, library and bookshop', 4),
  ('/assets/carousel/posterf.jpeg', 'Success stories', 5);

-- Each existing gallery section becomes an event with copies of its published photos. The original rows stay
-- in gallery_photos untouched; the Success Collage keeps using them there.
INSERT INTO gallery_events(name, position, is_published)
  SELECT section, (row_number() OVER (ORDER BY min(created_at), section) - 1)::int, true
  FROM gallery_photos WHERE section <> 'Success Collage' AND is_published GROUP BY section;
INSERT INTO gallery_event_photos(event_id, image_url, position)
  SELECT e.id, p.image_url, (row_number() OVER (PARTITION BY e.id ORDER BY p.position, p.id) - 1)::int
  FROM gallery_photos p JOIN gallery_events e ON e.name = p.section
  WHERE p.section <> 'Success Collage' AND p.is_published;
UPDATE gallery_event_photos SET is_cover = true WHERE position = 0;
