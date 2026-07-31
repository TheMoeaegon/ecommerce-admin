import express, { type Request, type Response } from 'express';
import { httpLogger, logger } from './lib/logger.ts';

const app = express();

app.use(express.json());
app.use(httpLogger);

// health check endpoint
app.get('/api/v1/health', (req, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'route not found',
    path: req.url,
  });
});

export { app };
export default app;
