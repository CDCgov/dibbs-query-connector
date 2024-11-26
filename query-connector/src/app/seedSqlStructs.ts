export type ValuesetStruct = {
  id: string;
  oid: string;
  version: string;
  name: string;
  author: string;
  type: string;
  dibbs_concept_type: string;
};

export type ConceptStruct = {
  id: string;
  code: string;
  code_system: string;
  display: string;
  version: string;
};

export type ValuesetToConceptStruct = {
  id: string;
  valueset_id: string;
  concept_id: string;
};

export type ConditionStruct = {
  id: string;
  system: string;
  name: string;
  version: string;
  category: string;
};

export type ConditionToValueSetStruct = {
  id: string;
  condition_id: string;
  valueset_id: string;
  source: string;
};

export type CategoryStruct = {
  condition_name: string;
  condition_code: string;
  category: string;
};

export type dbInsertStruct =
  | ValuesetStruct
  | ConceptStruct
  | ValuesetToConceptStruct
  | ConditionStruct
  | ConditionToValueSetStruct
  | CategoryStruct;

export const insertValueSetSql = `
INSERT INTO valuesets
    VALUES($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT(id)
    DO UPDATE SET
      id = EXCLUDED.id,
      oid = EXCLUDED.oid,
      version = EXCLUDED.version,
      name = EXCLUDED.name,
      author = EXCLUDED.author,
      type = EXCLUDED.type,
      dibbs_concept_type = EXCLUDED.dibbs_concept_type
    RETURNING id;
`;

export const insertConceptSql = `
INSERT INTO concepts
  VALUES($1,$2,$3,$4,$5,$6)
  ON CONFLICT(id)
  DO UPDATE SET
    id = EXCLUDED.id,
    code = EXCLUDED.code,
    code_system = EXCLUDED.code_system,
    display = EXCLUDED.display,
    gem_formatted_code = EXCLUDED.gem_formatted_code,
    version = EXCLUDED.version
  RETURNING id;
`;

export const insertValuesetToConceptSql = `
  INSERT INTO valueset_to_concept
  VALUES($1,$2,$3)
  ON CONFLICT(id)
  DO UPDATE SET
    id = EXCLUDED.id,
    valueset_id = EXCLUDED.valueset_id,
    concept_id = EXCLUDED.concept_id
  RETURNING valueset_id, concept_id;
`;

export const insertConditionSql = `
INSERT INTO conditions
  VALUES($1,$2,$3,$4,$5)
  ON CONFLICT(id)
  DO UPDATE SET
    id = EXCLUDED.id,
    system = EXCLUDED.system,
    name = EXCLUDED.name,
    version = EXCLUDED.version,
    category = EXCLUDED.category
  RETURNING id;
`;

export const insertConditionToValuesetSql = `
INSERT INTO condition_to_valueset
  VALUES($1,$2,$3,$4)
  ON CONFLICT(id)
  DO UPDATE SET
    id = EXCLUDED.id,
    condition_id = EXCLUDED.condition_id,
    valueset_id = EXCLUDED.valueset_id,
    source = EXCLUDED.source
  RETURNING id;
`;

export const insertCategorySql = `
INSERT INTO category_data
  VALUES($1,$2,$3)
  ON CONFLICT(condition_code)
  DO UPDATE SET
    condition_name = EXCLUDED.condition_name,
    condition_code = EXCLUDED.condition_code,
    category = EXCLUDED.category
  RETURNING condition_code;
`;

export const insertDefaultQueryLogicSql = `
-- Select data from the TCR that will be used to create default queries
WITH tcr_data AS (
    SELECT
        conditions.id AS condition_id,
        conditions.name AS condition_name,
        condition_to_valueset.valueset_id AS valueset_id,
        valuesets.oid as valueset_oid
    FROM conditions
    JOIN condition_to_valueset
        ON conditions.id = condition_to_valueset.condition_id
    join valuesets
    	on condition_to_valueset.valueset_id = valuesets.id
), 
-- Insert data into the query table
inserted_queries AS (
    INSERT INTO query (id, query_name, author, date_created, date_last_modified, time_window_number, time_window_unit)
    SELECT 
        uuid_generate_v4() AS id,
        condition_name AS query_name,
        'DIBBs' AS author,
        NOW() AS date_created,
        NOW() AS date_last_modified,
        1 AS time_window_number,
        'day' AS time_window_unit
    FROM tcr_data
    GROUP BY condition_name
    RETURNING id, query_name
),
-- Join the inserted_queries and tcr_data tables to create data for the query_to_valueset table
joined_data_for_qtv AS( 
	select
		inserted_queries.id as query_id,
		tcr_data.valueset_id as valueset_id,
		tcr_data.valueset_oid as valueset_oid
	from inserted_queries
	join tcr_data on inserted_queries.query_name = tcr_data.condition_name
),
-- Insert data into the query_to_valueset table
qic_data AS(
insert into query_to_valueset (id, query_id, valueset_id, valueset_oid)
select
	uuid_generate_v4() AS id,
	query_id,
	valueset_id,
	valueset_oid
from joined_data_for_qtv
returning id, valueset_id
)
-- Insert data into the query_included_concepts table
insert into query_included_concepts (id, query_by_valueset_id, concept_id, include)
select
	uuid_generate_v4() AS id,
	qic_data.id as query_by_valueset_id,
	vtc.concept_id as concept_id,
	TRUE
from qic_data
join valueset_to_concept vtc 
on qic_data.valueset_id = vtc.valueset_id;
`;

export const updateErsdCategorySql = `
UPDATE conditions
SET category = category_data.category
FROM category_data
WHERE conditions.id = category_data.condition_code;
`;

export const updateNewbornScreeningCategorySql = `
UPDATE conditions
SET category = 'Birth Defects and Infant Disorders'
WHERE conditions.name = 'Newborn Screening';
`;

export const updatedCancerCategorySql = `
UPDATE conditions
SET category = 'Cancer'
WHERE conditions.name = 'Cancer (Leukemia)';
`;
