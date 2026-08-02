import { Router } from 'express';

import { healthRouter } from './health.route.ts';
import { openapiRouter } from './openapi.route.ts';
import '../shared/docs/index.ts'; // import docs

const router = Router();

router.use(healthRouter);
router.use(openapiRouter);

export default router;
