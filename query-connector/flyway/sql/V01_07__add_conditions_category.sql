-- 1. Add the new 'category' column to the condition table
ALTER TABLE conditions
ADD COLUMN category VARCHAR(255);

-- 2. Create a staging table to hold the CSV data
CREATE TABLE IF NOT EXISTS category_data (
    condition_name TEXT,
    condition_code TEXT,
    category TEXT
);

-- 3. Load the CSV data into the staging table
COPY category_data (condition_name, condition_code, category)
FROM '/tmp/Conditions_and_Categories_20241024.csv'
DELIMITER ','
CSV HEADER;

-- 4. Update the condition table with the category from the staging table
UPDATE conditions
SET category = category_data.category
FROM category_data
WHERE conditions.id = category_data.condition_code;

-- 5. Add hardcoded categories from DIBBs-specific additions
UPDATE conditions
SET category = 'Birth Defects and Infant Disorders'
WHERE conditions.name = 'Newborn Screening';

UPDATE conditions
SET category = 'Cancer'
WHERE conditions.name = 'Cancer (Leukemia)';

-- 6. Drop the staging table after the join
DROP TABLE category_data;
