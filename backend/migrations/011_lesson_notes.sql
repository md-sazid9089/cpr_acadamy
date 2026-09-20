-- A student's personal notes for a lesson. One note per (user, lesson);
-- writing again overwrites it rather than creating a new row.
CREATE TABLE lesson_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  lesson_id uuid NOT NULL REFERENCES lessons(id),
  content text NOT NULL DEFAULT '' CHECK (char_length(content) <= 20000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
CREATE INDEX lesson_notes_user ON lesson_notes(user_id, lesson_id);
