import express from 'express';
import envConfig from './envconfig.ts';

const app = express();
app.use(express.json());

const PORT = envConfig.processEnv.PORT;

// Health check
app.all('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
