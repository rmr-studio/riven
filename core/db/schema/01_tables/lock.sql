CREATE TABLE shedlock
(
    name       VARCHAR(64) PRIMARY KEY,
    lock_until TIMESTAMP    NOT NULL,
    locked_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    locked_by  VARCHAR(255) NOT NULL
);
