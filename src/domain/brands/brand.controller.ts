import type { Request, Response } from 'express';

export class BrandController {
  static async listPublicBrands(req: Request, res: Response) {}

  static async retrievePublicBrand(req: Request, res: Response) {}

  static async listAdminBrands(req: Request, res: Response) {}

  static async retrieveAdminBrand(req: Request, res: Response) {}

  static async createBrand(req: Request, res: Response) {}

  static async updateBrand(req: Request, res: Response) {}

  static async softDeleteBrand(req: Request, res: Response) {}
}
