LOCK TABLE exams, exam_attempts IN ACCESS EXCLUSIVE MODE;
ALTER TABLE exams ALTER COLUMN negative_marking DROP DEFAULT;
ALTER TABLE exams DROP CONSTRAINT exams_negative_marking_check;
ALTER TABLE exams ALTER COLUMN negative_marking TYPE numeric(7,3);
UPDATE exams SET negative_marking = CASE WHEN negative_marking = 0.25 THEN 0 ELSE negative_marking * 100 END;
ALTER TABLE exams ALTER COLUMN negative_marking SET DEFAULT 0;
ALTER TABLE exams ADD CONSTRAINT exams_negative_marking_check CHECK (negative_marking BETWEEN 0 AND 1000);
ALTER TABLE exams ADD COLUMN pass_mark numeric(6,3) NOT NULL DEFAULT 70 CHECK (pass_mark BETWEEN 0 AND 100);
UPDATE exam_attempts SET paper = paper || jsonb_build_object(
  'negativeMarking', CASE WHEN COALESCE((paper->>'negativeMarking')::numeric, 0) = 0.25 THEN 0 ELSE COALESCE((paper->>'negativeMarking')::numeric, 0) * 100 END,
  'passMark', 70
);