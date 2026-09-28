import type { Request, Response } from 'express';

export class CategoryController {
  static async listPublicCategories(req: Request, res: Response) {}

  static async retrievePublicCategory(req: Request, res: Response) {}

  static async listAdminCategories(req: Request, res: Response) {}

  static async retrieveAdminCategory(req: Request, res: Response) {}

  static async createCategory(req: Request, res: Response) {}

  static async updateCategory(req: Request, res: Response) {}

  static async softDeleteCategory(req: Request, res: Response) {}
}
