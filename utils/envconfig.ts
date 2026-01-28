import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: number;
  DB_PATH: string;
}

const envConfig: { processEnv: EnvConfig } = {
  processEnv: {
    PORT: parseInt(process.env.PORT || '8000'),
    DB_PATH: process.env.DB_PATH || 'timetravel.db'
  }
};

export default envConfig;
