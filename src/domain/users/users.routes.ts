import { Router } from 'express';

import { adminRouter } from './admins/admins.routes.ts';
import { createUploadMiddleware } from '../../utils/multer.ts';

export const userRouter = Router();

userRouter.use('/admins', adminRouter);
userRouter.post('/uploads', createUploadMiddleware('products', [{ name: 'thumbnail', maxCount: 1 }]), (req, res) => {
  console.log(req.files);
  res.end();
});
// userRouter.use('/customers');
