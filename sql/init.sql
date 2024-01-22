CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    PRIMARY KEY (username)
);

CREATE TABLE IF NOT EXISTS user_groups (
    username VARCHAR(255) NOT NULL,
    groupname VARCHAR(255) NOT NULL,
    FOREIGN KEY (username) REFERENCES users(username)
);

CREATE TABLE sessions (
    id VARCHAR(255) NOT NULL,
    session_data TEXT,
    expiry BIGINT DEFAULT 0,
    PRIMARY KEY (id)
);
