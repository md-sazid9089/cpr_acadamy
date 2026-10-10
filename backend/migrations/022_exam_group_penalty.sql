-- Group penalty: for every full group of N wrong answers of one question type, cut X% of the paper's total marks.
-- SBA and MCQ (true/false, counted per statement) each have their own rule; a group size of 0 turns that rule off.
-- It is added on top of the per-answer negative marking, and the score still never goes below 0.
ALTER TABLE exams ADD COLUMN sba_group_size integer NOT NULL DEFAULT 0;
ALTER TABLE exams ADD COLUMN sba_group_penalty numeric(6,3) NOT NULL DEFAULT 0;
ALTER TABLE exams ADD COLUMN mtf_group_size integer NOT NULL DEFAULT 0;
ALTER TABLE exams ADD COLUMN mtf_group_penalty numeric(6,3) NOT NULL DEFAULT 0;
ALTER TABLE exams ADD CONSTRAINT exams_group_penalty_range CHECK (
  sba_group_size BETWEEN 0 AND 500 AND mtf_group_size BETWEEN 0 AND 500
  AND sba_group_penalty BETWEEN 0 AND 100 AND mtf_group_penalty BETWEEN 0 AND 100);
