import envConfig from './envconfig.ts';
import Database from 'better-sqlite3';

const db = new Database(envConfig.processEnv.DB_PATH);

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS records_versioned (
    id INTEGER,
    data TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (id, version)
  )
`
).run();

export default db;
