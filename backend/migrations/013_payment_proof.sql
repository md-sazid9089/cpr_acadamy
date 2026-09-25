-- Payment proof a student submits in-app (transaction ID, the mobile it was sent
-- from, and an optional screenshot), replacing the old out-of-band WhatsApp step.
ALTER TABLE payments ADD COLUMN payer_mobile text;
ALTER TABLE payments ADD COLUMN screenshot_url text;
ALTER TABLE payments ADD COLUMN proof_submitted_at timestamptz;
