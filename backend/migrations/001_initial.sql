CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile text NOT NULL UNIQUE CHECK (mobile ~ '^01[3-9][0-9]{8}$'),
  full_name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin','instructor')),
  status text NOT NULL DEFAULT 'otp_pending' CHECK (status IN ('otp_pending','awaiting_approval','active','rejected','suspended')),
  email text,
  institution text NOT NULL DEFAULT '',
  bmdc_number text NOT NULL DEFAULT '',
  interest text,
  profile jsonb NOT NULL DEFAULT '{}',
  mobile_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  device_id text NOT NULL,
  access_hash text NOT NULL UNIQUE,
  refresh_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  refresh_expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX sessions_one_active ON sessions(user_id) WHERE revoked_at IS NULL;
CREATE TABLE otp_challenges (
  user_id uuid NOT NULL REFERENCES users(id),
  purpose text NOT NULL CHECK (purpose IN ('registration','reset')),
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  expires_at timestamptz NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  PRIMARY KEY(user_id, purpose)
);
CREATE TABLE rate_buckets (
  key text PRIMARY KEY,
  hits integer NOT NULL DEFAULT 1,
  resets_at timestamptz NOT NULL
);
CREATE TABLE sms_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  payload text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sms_outbox_pending ON sms_outbox(next_attempt_at) WHERE status = 'pending';
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('FCPS','BCS','MBBS')),
  price_minor integer NOT NULL CHECK (price_minor >= 0),
  discount_minor integer CHECK (discount_minor >= 0 AND discount_minor <= price_minor),
  access_days integer NOT NULL DEFAULT 180 CHECK (access_days BETWEEN 1 AND 3650),
  is_published boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX courses_catalog ON courses(category) WHERE is_published;
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id),
  title text NOT NULL,
  src text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lessons_course ON lessons(course_id, position);
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  status text NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment','active','expired')),
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id),
  CHECK (status <> 'active' OR (starts_at IS NOT NULL AND expires_at > starts_at))
);
CREATE INDEX enrollments_course ON enrollments(course_id);
CREATE TABLE lesson_progress (
  user_id uuid NOT NULL REFERENCES users(id),
  lesson_id uuid NOT NULL REFERENCES lessons(id),
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(user_id, lesson_id)
);
CREATE TABLE schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id),
  scheduled_at timestamptz NOT NULL,
  exam text NOT NULL DEFAULT 'NO EXAM',
  solve_class text NOT NULL DEFAULT 'NO CLASS',
  lecture text NOT NULL DEFAULT 'NO CLASS'
);
CREATE INDEX schedules_course ON schedules(course_id, scheduled_at);
CREATE TABLE exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'practice' CHECK (type IN ('live','mock','practice')),
  question_type text NOT NULL DEFAULT 'sba' CHECK (question_type IN ('sba','mtf','mixed')),
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 1 AND 600),
  negative_marking numeric(6,3) NOT NULL DEFAULT 0.25 CHECK (negative_marking BETWEEN 0 AND 10),
  scheduled_at timestamptz NOT NULL,
  closes_at timestamptz,
  results_at timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  questions jsonb NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(questions) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (closes_at IS NULL OR closes_at > scheduled_at),
  CHECK (type = 'practice' OR closes_at IS NOT NULL),
  CHECK (type = 'practice' OR (results_at IS NOT NULL AND results_at >= closes_at))
);
CREATE INDEX exams_course ON exams(course_id, scheduled_at);
CREATE TABLE exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  exam_id uuid NOT NULL REFERENCES exams(id),
  paper jsonb NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  submitted_at timestamptz,
  result jsonb,
  UNIQUE(user_id, exam_id)
);
CREATE INDEX attempts_exam ON exam_attempts(exam_id);
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_minor integer NOT NULL CHECK (price_minor > 0),
  duration_days integer NOT NULL CHECK (duration_days BETWEEN 1 AND 3650),
  features jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  UNIQUE(user_id, plan_id)
);
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  plan_id uuid REFERENCES subscription_plans(id),
  amount_minor integer NOT NULL CHECK (amount_minor >= 0),
  currency text NOT NULL DEFAULT 'BDT' CHECK (currency = 'BDT'),
  method text NOT NULL CHECK (method IN ('bkash','nagad','rocket','card','manual')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  idempotency_key text NOT NULL,
  transaction_id text UNIQUE,
  invoice_no text NOT NULL UNIQUE,
  description text NOT NULL,
  billed_to jsonb NOT NULL,
  access_days integer NOT NULL CHECK (access_days > 0),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, idempotency_key),
  CHECK (status <> 'paid' OR (paid_at IS NOT NULL AND transaction_id IS NOT NULL))
);
CREATE INDEX payments_user ON payments(user_id, created_at DESC);
CREATE UNIQUE INDEX payments_pending_purchase ON payments(user_id, course_id, COALESCE(plan_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE status = 'pending';
CREATE TABLE complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  related_to text NOT NULL,
  batch_title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','solved')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX complaints_user ON complaints(user_id, created_at DESC);
CREATE TABLE complaint_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id),
  author_id uuid NOT NULL REFERENCES users(id),
  sender text NOT NULL CHECK (sender IN ('student','academy')),
  body text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX complaint_messages_thread ON complaint_messages(complaint_id, sent_at);
CREATE TABLE device_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  device_id text NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','resolved')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX device_requests_pending ON device_requests(user_id) WHERE status = 'pending_review';
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_log_created ON audit_log(created_at DESC);