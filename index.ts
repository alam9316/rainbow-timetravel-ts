import express from 'express';
import envConfig from './utils/envconfig.ts';
import recordsRouter from './api/records.ts';
import recordsRouterV2 from './api/recordsV2.ts';

const app = express();
app.use(express.json());

const PORT = envConfig.processEnv.PORT;

// Health check
app.all('/api/v1/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Records routes
app.use('/api/v1/records', recordsRouter);
app.use('/api/v2/records', recordsRouterV2);

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
