import { Router } from 'express';

import { AdminController } from './admins.controller.ts';

export const adminRouter = Router();

adminRouter.get('/profiles', AdminController.retriveProfile);
