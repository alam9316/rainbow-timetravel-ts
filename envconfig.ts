import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  PORT: number;
}

const envConfig: { processEnv: EnvConfig } = {
  processEnv: {
    PORT: parseInt(process.env.PORT || '8000')
  }
};

export default envConfig;
