import { Router } from 'express';
import { healthRouter } from './health.route.ts';

const router = Router();

router.use(healthRouter);

export default router;
