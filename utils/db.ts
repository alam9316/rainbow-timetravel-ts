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

export default db;
