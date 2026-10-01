-- Which exam tab (client) wrote an attempt last. A retry from that same tab is
-- accepted even when its version is stale (the response to its previous save was
-- lost); a write from any other tab with a stale version is still rejected.
ALTER TABLE exam_attempts ADD COLUMN last_client text;
