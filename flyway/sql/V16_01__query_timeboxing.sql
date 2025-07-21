CREATE TABLE IF NOT EXISTS query_timeboxing (
    id UUID DEFAULT uuid_generate_v4 (),
    time_window_start TIMESTAMP, 
    time_window_end TIMESTAMP,
    concept_type VARCHAR(80),
    query_id UUID,
    FOREIGN KEY (query_id) REFERENCES query(id),
    -- each query <> concept_type relationship is unique
    UNIQUE (query_id, concept_type));

CREATE INDEX IF NOT EXISTS query_timeboxing_id_index ON query_timeboxing (id);
