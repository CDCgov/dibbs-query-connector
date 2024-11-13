ALTER TABLE valuesets
ADD COLUMN dibbs_concept_type text GENERATED ALWAYS AS (
    CASE
        WHEN type IN ('lotc', 'lrtc', 'ostc') THEN 'labs'
        WHEN type = 'mrtc' THEN 'medications'
        ELSE 'conditions'
    END
) STORED;