ALTER TABLE valuesets
ADD COLUMN dibbsConceptType text GENERATED ALWAYS AS (
    CASE
        WHEN type IN ('lotc', 'lrtc', 'ostc') THEN 'labs'
        WHEN type = 'mrtc' THEN 'medications'
        ELSE 'conditions'
    END
) STORED;