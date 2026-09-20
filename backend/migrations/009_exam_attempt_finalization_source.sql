-- Distinguishes a genuine /submit finalization (auto_finalized=false) from one
-- performed without a confirmed final answer snapshot -- the expiry sweep, a
-- passive result-view finalize, or a /submit call that itself arrived after
-- the deadline. Existing submitted attempts predate this distinction and are
-- treated as genuine (default false) rather than retroactively flagged.
ALTER TABLE exam_attempts ADD COLUMN auto_finalized boolean NOT NULL DEFAULT false;
