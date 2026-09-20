-- Per-course allowed ranges for a "mixed" exam's negativeMarking/passMark.
-- Defaults are fully permissive (matching the exam-level CHECK bounds) so
-- this is opt-in: no existing course/exam is affected until an admin
-- narrows the range.
ALTER TABLE courses ADD COLUMN mixed_negative_marking_min numeric(7,3) NOT NULL DEFAULT 0 CHECK (mixed_negative_marking_min BETWEEN 0 AND 1000);
ALTER TABLE courses ADD COLUMN mixed_negative_marking_max numeric(7,3) NOT NULL DEFAULT 1000 CHECK (mixed_negative_marking_max BETWEEN 0 AND 1000);
ALTER TABLE courses ADD COLUMN mixed_pass_mark_min numeric(6,3) NOT NULL DEFAULT 0 CHECK (mixed_pass_mark_min BETWEEN 0 AND 100);
ALTER TABLE courses ADD COLUMN mixed_pass_mark_max numeric(6,3) NOT NULL DEFAULT 100 CHECK (mixed_pass_mark_max BETWEEN 0 AND 100);
ALTER TABLE courses ADD CONSTRAINT courses_mixed_negative_marking_range CHECK (mixed_negative_marking_min <= mixed_negative_marking_max);
ALTER TABLE courses ADD CONSTRAINT courses_mixed_pass_mark_range CHECK (mixed_pass_mark_min <= mixed_pass_mark_max);
