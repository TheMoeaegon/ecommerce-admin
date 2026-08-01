import express, { type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from '../env.ts';
import router from './routes/index.ts';
import { httpLogger } from './lib/logger.ts';
import { notFoundHandler, errorHandler } from './middleware/index.ts';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);
app.use('/api/v1', router);

app.use(notFoundHandler);

app.use(errorHandler);

export { app };
export default app;
