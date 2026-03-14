BEGIN TRANSACTION;

CREATE TABLE groups_v1 (
  token TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  content TEXT NOT NULL
);

INSERT INTO groups_v1 (token, version, content) SELECT token, 0, content FROM groups;

DROP TABLE groups;

ALTER TABLE groups_v1 RENAME TO groups;

COMMIT;
