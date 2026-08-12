import { Router } from 'express';

import { adminRouter } from './admins/admins.routes.ts';

export const userRouter = Router();

userRouter.use('/admins', adminRouter);
// userRouter.use('/customers');
