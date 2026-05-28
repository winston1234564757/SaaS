-- Masters need to see ALL their reviews (including unpublished) in the dashboard.
-- The existing "Published reviews are public" policy only allows SELECT where is_published = true,
-- so unpublished reviews are invisible to the browser client. This adds a master-scoped SELECT
-- and the missing UPDATE policy so togglePublish works.

-- Masters can read all of their own reviews (published or not)
CREATE POLICY "Masters can read all their reviews"
    ON reviews FOR SELECT
    USING (master_id = auth.uid());

-- Masters can toggle is_published on their own reviews
CREATE POLICY "Masters can update their reviews"
    ON reviews FOR UPDATE
    USING (master_id = auth.uid())
    WITH CHECK (master_id = auth.uid());
