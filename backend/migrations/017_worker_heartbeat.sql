-- One row the background worker touches every cycle, so /api/ready can tell when it has stopped.
CREATE TABLE worker_heartbeat (
  id integer PRIMARY KEY CHECK (id = 1),
  beat_at timestamptz NOT NULL DEFAULT now()
);
