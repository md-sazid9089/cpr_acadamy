CREATE TABLE chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id),
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX chapters_course ON chapters(course_id, position);
ALTER TABLE lessons ADD COLUMN chapter_id uuid REFERENCES chapters(id) ON DELETE SET NULL;
CREATE INDEX lessons_chapter ON lessons(chapter_id, position);
