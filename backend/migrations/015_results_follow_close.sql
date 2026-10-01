-- A NULL results_at now means "release when the exam closes"; an admin can still
-- pick a later release time. Results may never be released before the exam closes.
UPDATE exams SET results_at = closes_at WHERE results_at IS NOT NULL AND closes_at IS NOT NULL AND results_at < closes_at;
DO $$
DECLARE existing record;
BEGIN
  FOR existing IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'exams'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%results_at%'
  LOOP
    EXECUTE format('ALTER TABLE exams DROP CONSTRAINT %I', existing.conname);
  END LOOP;
END $$;
ALTER TABLE exams ADD CONSTRAINT exams_results_after_close CHECK (results_at IS NULL OR closes_at IS NULL OR results_at >= closes_at);
