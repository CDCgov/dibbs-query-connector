CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    qc_role TEXT,
    first_name TEXT,
    last_name TEXT
);

CREATE TABLE IF NOT EXISTS usergroup (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usergroup_to_users (
    id TEXT PRIMARY KEY,
    user_id UUID,
    usergroup_id UUID,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (usergroup_id) REFERENCES usergroup(id)
);

CREATE TABLE IF NOT EXISTS usergroup_to_query (
    id TEXT PRIMARY KEY,
    query_id UUID,
    usergroup_id UUID,
    FOREIGN KEY (query_id) REFERENCES query(id),
    FOREIGN KEY (usergroup_id) REFERENCES usergroup(id)
);

-- Create indexes for ids and foreign keys
CREATE INDEX IF NOT EXISTS user_id_index ON users (id);
CREATE INDEX IF NOT EXISTS user_username_index ON users (username);

CREATE INDEX IF NOT EXISTS usergroup_id_index ON usergroup (id);

CREATE INDEX IF NOT EXISTS usergroup_to_users_id_index ON usergroup_to_users (id);
CREATE INDEX IF NOT EXISTS usergroup_to_users_user_id_index ON usergroup_to_users (user_id);
CREATE INDEX IF NOT EXISTS usergroup_to_users_usergroup_id_index ON usergroup_to_users (usergroup_id);

CREATE INDEX IF NOT EXISTS usergroup_to_query_id_index ON usergroup_to_query (id);
CREATE INDEX IF NOT EXISTS usergroup_to_query_query_id_index ON usergroup_to_query (query_id);
CREATE INDEX IF NOT EXISTS usergroup_to_query_usergroup_id_index ON usergroup_to_query (usergroup_id);
