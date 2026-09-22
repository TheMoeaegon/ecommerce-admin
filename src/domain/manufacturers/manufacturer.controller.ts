import type { Request, Response } from 'express';

export class ManufacturerController {
  static async listPublicManufacturers(req: Request, res: Response) {}

  static async retrievePublicManufacturer(req: Request, res: Response) {}

  static async listAdminManufacturers(req: Request, res: Response) {}

  static async retrieveAdminManufacturer(req: Request, res: Response) {}

  static async createManufacturer(req: Request, res: Response) {}

  static async updateManufacturer(req: Request, res: Response) {}

  static async softDeleteManufacturer(req: Request, res: Response) {}
}