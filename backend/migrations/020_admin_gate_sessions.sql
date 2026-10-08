-- Which staff access key an administrator's session was opened under (a fingerprint, never the key).
-- Changing ADMIN_GATE_KEY ends every admin session stamped with the old one; NULL (sessions from
-- before the key existed) counts as old.
ALTER TABLE sessions ADD COLUMN admin_gate text;
