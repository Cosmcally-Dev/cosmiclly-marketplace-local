-- Add schedule column to advisor_details for persisting weekly availability
ALTER TABLE advisor_details
  ADD COLUMN IF NOT EXISTS schedule jsonb NULL;
