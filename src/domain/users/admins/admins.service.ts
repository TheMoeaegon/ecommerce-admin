import { auth } from '../../../lib/auth.ts';

import type { RetriveProfileResponse } from './admin.types.ts';

export class AdminService {
  static async getProfile(user: Express.Request['user']): Promise<RetriveProfileResponse> {
    const adminProfile: RetriveProfileResponse = {
      email: user?.email ?? '',
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      username: user?.username ?? '',
      id: user?.id ?? '',
      image: user?.image ?? '',
      name: user?.name ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      role: user?.role ?? '',
      emailVerified: user?.emailVerified ?? false,
    };

    return adminProfile;
  }
}
