import { Router } from 'express';

import '../shared/docs/index.ts'; // import docs

import { healthRouter } from './health.route.ts';
import { openapiRouter } from './openapi.route.ts';
import { rolePermissionRouter } from '../domain/roles/index.ts';
import { requireAuth } from '../middleware/auth.ts';

const router = Router();

router.use(healthRouter);
router.use(openapiRouter);

router.use('/roles', requireAuth, rolePermissionRouter);

export default router;
