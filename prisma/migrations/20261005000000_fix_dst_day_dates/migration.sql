-- One-off data fix: Sydney DST began on 2026-10-04, and zonedMidnightUtc used
-- the UTC-midnight offset, so that day's DailyResult rows were stored at
-- 13:00Z instead of 14:00Z (local midnight, +10:00). They read as Oct 3 23:00
-- and broke every streak. No-op if the data doesn't match.
UPDATE "DailyResult"
SET "date" = '2026-10-03T14:00:00Z'
WHERE "date" = '2026-10-03T13:00:00Z'
  AND NOT EXISTS (
    SELECT 1 FROM "DailyResult" d2
    WHERE d2."friendId" = "DailyResult"."friendId"
      AND d2."date" = '2026-10-03T14:00:00Z'
  );
