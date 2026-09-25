-- Admins can now create their own course categories alongside FCPS/BCS/MBBS,
-- so the fixed list gives way to a length bound.
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_category_check;
ALTER TABLE courses ADD CONSTRAINT courses_category_length CHECK (char_length(category) BETWEEN 1 AND 60);
