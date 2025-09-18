export type ValuesetStruct = {
  id: string;
  oid: string;
  version: string;
  name: string;
  author: string;
  type: string;
  dibbsConceptType: string;
  userCreated: string;
};

export type ConceptStruct = {
  id: string;
  code: string;
  codeSystem: string;
  display: string;
  version: string;
};

export type ValuesetToConceptStruct = {
  id: string;
  valuesetId: string;
  conceptId: string;
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
  conditionId: string;
  valuesetId: string;
  source: string;
};

export type CategoryStruct = {
  conditionName: string;
  conditionCode: string;
  category: string;
};

export type QueryDataStruct = {
  queryName: string;
  queryData: string;
  conditionsList: string;
  author: string;
  dateCreated: string;
  dateLastModified: string;
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
  VALUES($1,$2,$3,$4)
  ON CONFLICT(id)
  DO UPDATE SET
    id = EXCLUDED.id,
    code = EXCLUDED.code,
    code_system = EXCLUDED.code_system,
    display = EXCLUDED.display
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

export const getValueSetsByConditionIdsSql = `
    SELECT c.display, c.code_system, c.code, vs.name as valueset_name, vs.id as valueset_id, vs.oid as valueset_external_id, vs.version, vs.author as author, vs.type, vs.dibbs_concept_type as dibbs_concept_type, vs.user_created as user_created, ctvs.condition_id
    FROM valuesets vs 
    LEFT JOIN condition_to_valueset ctvs on vs.id = ctvs.valueset_id 
    LEFT JOIN valueset_to_concept vstc on vs.id = vstc.valueset_id
    LEFT JOIN concepts c on vstc.concept_id = c.id
    WHERE ctvs.condition_id IN (
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
INSERT INTO query (query_name, query_data, conditions_list, author, date_created, date_last_modified)
VALUES ($1, $2, $3,$4, $5, $6);
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
