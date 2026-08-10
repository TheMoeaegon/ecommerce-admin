import type { Request, Response } from 'express';

import { respond } from '../../../utils/response.ts';
import { AdminService } from './admins.service.ts';
import { retriveProfileResponseSchema } from './admin.schema.ts';

export class AdminController {
  static async retriveProfile(req: Request, res: Response) {
    const result = await AdminService.getProfile(req.user);

    return respond(res, retriveProfileResponseSchema, result);
  }
}
