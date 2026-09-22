import type { Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';

import { respond } from '../../../utils/response.ts';
import { AdminService } from './admins.service.ts';
import { retriveProfileResponseSchema } from './admin.schema.ts';

export class AdminController {
  static async retriveProfile(req: Request, res: Response) {
    const result = await AdminService.getProfile(req.user);

    return respond(res, retriveProfileResponseSchema, result);
  }

  static async updateProfileImage(req: Request, res: Response) {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const file = files?.image?.[0];

    await AdminService.updateProfileImage(file, req.user, fromNodeHeaders(req.headers));

    return res.status(204).send();
  }

  static async removeProfileImage(req: Request, res: Response) {
    await AdminService.removeProfileImage(req.user, fromNodeHeaders(req.headers));

    return res.status(204).send();
  }
}
