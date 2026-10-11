-- Student reviews shown on the home page ("শিক্ষার্থীদের বিশ্বাসের গল্প!"), managed on the admin Reviews page.
-- Separate from instructor_reviews, which students write on course pages.
CREATE TABLE home_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  quote text NOT NULL,
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  position integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX home_reviews_position ON home_reviews(position) WHERE is_published;

-- The four reviews the home page showed before this table existed.
INSERT INTO home_reviews(name, role, quote, position) VALUES
  ('Nazmul Hasan', 'Student, BCS Health', '৪০ দিনের প্রিপারেশন নিয়েছিলাম। প্রশ্ন কমন পড়ার চেয়ে বেশি জরুরি কনসেপ্ট ক্লিয়ার থাকা। CPR এর প্রশ্নব্যাংক এবং নিয়মিত মক টেস্টের সল্ভ ক্লাস আমাকে কনফিডেন্স দিয়েছিল।', 0),
  ('Tasmiah B. Mimi', 'Student, FCPS Part-1', 'লেকচারগুলো এতটাই তথ্যবহুল ছিল যে বই পড়ার অতিরিক্ত চাপ নিতে হয়নি। বিশেষ করে আইটেম অ্যানালাইসিস এবং উইকলি টেস্ট আমার দুর্বল জায়গাগুলো চিহ্নিত করতে সাহায্য করেছে।', 1),
  ('জান্নাতুল ফেরদৌস নদীয়া', 'Student, Residency', 'রেসিডেন্সি ভর্তি পরীক্ষায় চান্স পাওয়া আমার জন্য স্বপ্ন ছিল। CPR এর সুপরিকল্পিত রুটিন এবং মেন্টরদের সার্বক্ষণিক গাইডলাইন ছাড়া এটা কখনোই সম্ভব হতো না। অসংখ্য ধন্যবাদ CPR টিমকে।', 2),
  ('Syeda Fatema Alam', 'Student, FCPS & BCS', 'সবচেয়ে ইতিবাচক ব্যাপার হচ্ছে তাদের পরীক্ষা নেওয়ার পদ্ধতি। নিয়মিত পরীক্ষা দেওয়ার কারণে মূল পরীক্ষার ভয় একেবারেই কেটে গিয়েছিল। সবার জন্য শুভকামনা।', 3);
