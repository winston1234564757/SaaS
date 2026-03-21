    -- Publish all existing masters (is_published was defaulting to false,
    -- so most masters who completed onboarding are invisible in /explore)
    UPDATE master_profiles
    SET is_published = true
    WHERE is_published = false;
