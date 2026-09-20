ALTER TABLE exam_attempts ADD CONSTRAINT exam_attempt_result_score_bounds CHECK (
  result IS NULL OR (
    (result->>'score')::numeric >= 0 AND
    (result->>'score')::numeric <= (result->>'totalMarks')::numeric
  )
);
