import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { toNodeHandler } from 'better-auth/node';

import { env } from '../env.ts';
import router from './routes/index.ts';
import { auth, httpLogger } from './lib/index.ts';
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

app.all('/api/v1/auth/{*any}', toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(httpLogger);
app.use('/api/v1', router);

app.use(notFoundHandler);

app.use(errorHandler);

export { app };
export default app;
