ALTER TABLE users ADD COLUMN last_login_at timestamptz;
ALTER TABLE lessons ADD COLUMN notes_url text NOT NULL DEFAULT '';
ALTER TABLE exams ADD COLUMN target_question_count integer NOT NULL DEFAULT 0 CHECK (target_question_count BETWEEN 0 AND 500);
ALTER TABLE exams ADD COLUMN marks_per_question numeric(6,3) NOT NULL DEFAULT 1 CHECK (marks_per_question BETWEEN 0 AND 100);
ALTER TABLE schedules ADD COLUMN exam_id uuid REFERENCES exams(id) ON DELETE SET NULL;
ALTER TABLE schedules ADD COLUMN solve_lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL;
ALTER TABLE schedules ADD COLUMN lecture_lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL;
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'General' CHECK (category IN ('General','Exam','Class','Payment')),
  pinned boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX announcements_feed ON announcements(pinned DESC, published_at DESC) WHERE is_published;
