import { Router } from 'express';

import { requireAuth } from '../../../middleware/auth.ts';
import { AdminController } from './admins.controller.ts';

export const adminRouter = Router();

adminRouter.get('/profiles', requireAuth, AdminController.retriveProfile);
