import { auth } from '../../../lib/auth.ts';
import { BadRequestError } from '../../../shared/errors.ts';
import { deleteFileFromDisk, getImageUrlPath } from '../../../utils/media.ts';
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

  static async updateProfileImage(file: Express.Multer.File | undefined, user: Express.Request['user'], headers: Headers) {
    if (!file) {
      throw new BadRequestError('image field is required');
    }

    const { imageUrl } = getImageUrlPath(file);

    try {
      await auth.api.updateUser({
        headers,
        body: {
          image: imageUrl,
        },
      });
    } catch (err) {
      deleteFileFromDisk(imageUrl);
      throw err;
    }

    if (user?.image && user.image !== imageUrl) {
      deleteFileFromDisk(user.image);
    }
  }

  static async removeProfileImage(user: Express.Request['user'], headers: Headers) {
    if (!user?.image) {
      return;
    }

    await auth.api.updateUser({
      headers,
      body: {
        image: null,
      },
    });

    deleteFileFromDisk(user.image);
  }
}
