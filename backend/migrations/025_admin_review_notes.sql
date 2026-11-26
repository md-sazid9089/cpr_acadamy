-- Admin decisions on registrations and payments kept their comment only in the audit log.
-- Store it on the record itself so an admin can read it again afterwards.
ALTER TABLE users
  ADD COLUMN status_decided_by uuid REFERENCES users(id),
  ADD COLUMN status_decided_at timestamptz,
  ADD COLUMN status_note text;

ALTER TABLE payments
  ADD COLUMN admin_review_note text,
  ADD COLUMN admin_reviewed_by uuid REFERENCES users(id),
  ADD COLUMN admin_reviewed_at timestamptz;
