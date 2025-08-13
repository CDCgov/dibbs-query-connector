export type ValuesetStruct = {
  id: string;
  oid: string;
  version: string;
  name: string;
  author: string;
  type: string;
  dibbs_concept_type: string;
  user_created: string;
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

export type QueryDataStruct = {
  query_name: string;
  query_data: string;
  conditions_list: string;
  author: string;
  date_created: string;
  date_last_modified: string;
  time_window_number: string;
  time_window_unit: string;
};

export type dbInsertStruct =
  | ValuesetStruct
  | ConceptStruct
  | ValuesetToConceptStruct
  | ConditionStruct
  | ConditionToValueSetStruct
  | CategoryStruct
  | QueryDataStruct;

export const insertValueSetSql = `
INSERT INTO valuesets
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)
    ON CONFLICT(id)
    DO UPDATE SET
      id = EXCLUDED.id,
      oid = EXCLUDED.oid,
      version = EXCLUDED.version,
      name = EXCLUDED.name,
      author = EXCLUDED.author,
      type = EXCLUDED.type,
      dibbs_concept_type = EXCLUDED.dibbs_concept_type,
      user_created = EXCLUDED.user_created
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
export const insertDemoQueryLogicSql = `
-- Insert data into the query table
INSERT INTO query (query_name, query_data, conditions_list, author, date_created, date_last_modified, time_window_number, time_window_unit)
VALUES ($1, $2, $3,$4, $5, $6, $7, $8);
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
