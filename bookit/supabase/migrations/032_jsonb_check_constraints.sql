-- Migration 032: CHECK constraints on pricing_rules and working_hours JSONB
-- Prevents storing arrays, strings, or other non-object JSON in these columns.

-- pricing_rules must be a JSON object (all rule keys are optional)
ALTER TABLE master_profiles
  ADD CONSTRAINT chk_pricing_rules_is_object
    CHECK (pricing_rules IS NULL OR jsonb_typeof(pricing_rules) = 'object');

-- working_hours must be an object with required numeric buffer_time_minutes and array breaks
ALTER TABLE master_profiles
  ADD CONSTRAINT chk_working_hours_shape
    CHECK (
      working_hours IS NULL
      OR (
        jsonb_typeof(working_hours) = 'object'
        AND jsonb_typeof(working_hours -> 'buffer_time_minutes') = 'number'
        AND jsonb_typeof(working_hours -> 'breaks') = 'array'
      )
    );
