-- Marks are now set once per question type on each exam: every SBA question carries sba_marks and every
-- MCQ (true/false) statement carries mtf_marks. Existing exams take the marks of their first question of each
-- type, falling back to the exam-wide default for its own type and then to the editor's usual defaults.
-- Question JSON is left as it is: papers students have already sat keep exactly the marks they were graded on.
ALTER TABLE exams ADD COLUMN sba_marks numeric(7,3);
ALTER TABLE exams ADD COLUMN mtf_marks numeric(7,3);
UPDATE exams SET
  sba_marks = COALESCE(
    (SELECT (question->>'marks')::numeric FROM jsonb_array_elements(questions) WITH ORDINALITY AS item(question, position)
      WHERE question->>'type' = 'sba' AND question->>'marks' IS NOT NULL ORDER BY position LIMIT 1),
    CASE WHEN question_type = 'sba' THEN NULLIF(marks_per_question, 0) END,
    2),
  mtf_marks = COALESCE(
    (SELECT (question->>'marks')::numeric FROM jsonb_array_elements(questions) WITH ORDINALITY AS item(question, position)
      WHERE question->>'type' = 'mtf' AND question->>'marks' IS NOT NULL ORDER BY position LIMIT 1),
    CASE WHEN question_type = 'mtf' THEN NULLIF(marks_per_question, 0) END,
    0.4);
ALTER TABLE exams ALTER COLUMN sba_marks SET DEFAULT 2;
ALTER TABLE exams ALTER COLUMN sba_marks SET NOT NULL;
ALTER TABLE exams ALTER COLUMN mtf_marks SET DEFAULT 0.4;
ALTER TABLE exams ALTER COLUMN mtf_marks SET NOT NULL;
ALTER TABLE exams ADD CONSTRAINT exams_type_marks_range CHECK (sba_marks > 0 AND sba_marks <= 100 AND mtf_marks > 0 AND mtf_marks <= 100);
