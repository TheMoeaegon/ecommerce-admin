import env from '../env.ts';
import app from './server.ts';

import { logger } from './lib/logger.ts';

app.listen(env.PORT, env.HOST, () => {
  logger.info(`Server running at http://${env.HOST}:${env.PORT}`);
});
