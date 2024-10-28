-- Insert hardcoded values for Social Determinants of Health
INSERT INTO valuesets VALUES('17_20241028','17','20241028','Social Determinants of Health','DIBBs','lrtc');

-- Add SDOH concepts related to housing
INSERT INTO concepts VALUES('1_71802-3','71802-3','http://loinc.org','Housing status','','2024-10');

-- These 3 are already in the data
-- INSERT INTO concepts VALUES('1_11350-6','11350-6','http://loinc.org','History of Sexual behavior Narrative','','2024-10'); 
-- INSERT INTO concepts VALUES('1_82810-3','82810-3','http://loinc.org','Pregnancy status','','2024-10'); --already in the data
-- INSERT INTO concepts VALUES('1_83317-8','83317-8','http://loinc.org','Sexual activity with anonymous partner in the past year','','2024-10');

-- Add SDOH as valueset belonging to SDOH condition
INSERT INTO condition_to_valueset VALUES('1530','1','17_20241028','DIBBs');

-- Add SDOH "labs" valueset to concept mappings
INSERT INTO valueset_to_concept VALUES('45507','17_20241028','1_71802-3');
INSERT INTO valueset_to_concept VALUES('45508','17_20241028','1_11350-6');
INSERT INTO valueset_to_concept VALUES('45509','17_20241028','1_82810-3');
INSERT INTO valueset_to_concept VALUES('45510','17_20241028','1_83317-8');

-- Insert relevant query data
-- Map the new valueset to the SDOH query & get the newly created id
WITH inserted AS (
    INSERT INTO query_to_valueset (id, query_id, valueset_id, valueset_oid)
    VALUES (
        uuid_generate_v4(), 
        (SELECT id FROM query WHERE query_name = 'Social Determinants of Health'), 
        '17_20241028', 
        '17'
    )
    RETURNING id
)
-- Insert the concepts from the valueset into the query_included_concepts table
INSERT INTO query_included_concepts (id, query_by_valueset_id, concept_id, include)
SELECT 
    uuid_generate_v4(), 
    (SELECT id FROM inserted), 
    concept_id, 
    true
FROM valueset_to_concept
WHERE valueset_id = '17_20241028';
