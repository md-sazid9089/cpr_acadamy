-- A bank/bKash reference identifies one real payment whatever its letter case, and a rejected invoice must
-- not keep the reference locked: references are stored upper-case and unique among payments that are not failed.
ALTER TABLE payments DROP CONSTRAINT payments_transaction_id_key;
UPDATE payments SET transaction_id = upper(btrim(transaction_id)) WHERE transaction_id IS NOT NULL;
CREATE UNIQUE INDEX payments_transaction_id_live ON payments (transaction_id) WHERE transaction_id IS NOT NULL AND status <> 'failed';
