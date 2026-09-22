import { Router } from 'express';

import { requireAuth } from '../../../middleware/auth.ts';
import { AdminController } from './admins.controller.ts';
import { createUploadMiddleware } from '../../../utils/media.ts';

export const adminRouter = Router();

adminRouter.get('/profiles', AdminController.retriveProfile);
adminRouter.post('/profiles/images', createUploadMiddleware('profile-images', [{ name: 'image', maxCount: 1 }]), AdminController.updateProfileImage);
adminRouter.delete('/profiles/images', AdminController.removeProfileImage);
