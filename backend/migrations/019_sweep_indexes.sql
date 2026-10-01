-- The worker sweeps these tables every 10 seconds; without an index each sweep scanned the whole table.
CREATE INDEX sessions_refresh_expiry ON sessions(refresh_expires_at);
CREATE INDEX exam_attempts_unsubmitted ON exam_attempts(ends_at) WHERE submitted_at IS NULL;
CREATE INDEX enrollments_active_expiry ON enrollments(expires_at) WHERE status = 'active';
CREATE INDEX sms_outbox_finished ON sms_outbox(created_at) WHERE status <> 'pending';
CREATE INDEX email_outbox_finished ON email_outbox(created_at) WHERE status <> 'pending';
