import db from '../../db/connection.ts';
import { BadRequestError, NotFoundError } from '../../shared/errors.ts';
import { deleteFileFromDisk, getImageUrlPath } from '../../utils/media.ts';
import mediaService from '../media/media.service.ts';
import productMediaRepository from './product-media.repository.ts';

import type { ProductMediaItem, ProductMedia, ProductMediaWithMedia } from './product-media.types.ts';
import type { AttachProductMediaResponse, UpdateProductMediaDTO } from './product.types.ts';
import type { DB } from '../../shared/types/index.ts';

export async function setMediaForProduct(productId: number, items: ProductMediaItem[], executor: DB = db): Promise<ProductMedia[]> {
  return await productMediaRepository.setMediaForProduct(productId, items, executor);
}

export async function addMediaToProduct(productId: number, files: Express.Multer.File[]): Promise<AttachProductMediaResponse> {
  if (files.length === 0) {
    throw new BadRequestError('media field is required');
  }

  const imageUrls = files.map(file => getImageUrlPath(file).imageUrl);

  try {
    return await db.transaction(async tx => {
      const mediaRows = await mediaService.createMany(
        imageUrls.map(url => ({ url })),
        tx
      );

      const items: ProductMediaItem[] = mediaRows.map(media => ({
        mediaId: media.id,
        productId,
      }));

      return await productMediaRepository.addMediaToProduct(productId, items, tx);
    });
  } catch (err) {
    try {
      for (const url of imageUrls) {
        deleteFileFromDisk(url);
      }
    } catch (error) {
      console.error(`Failed to delete file from disk: url`, error);
      // TODO: implement postgres queue for background job and cleanup
    }
    throw err;
  }
}

export async function removeMediaFromProduct(productId: number, mediaId: number): Promise<void> {
  let mediaUrl: string | undefined;

  await db.transaction(async tx => {
    const productMedia = await getMediaByProduct(productId, mediaId, tx);

    if (!productMedia) {
      throw new NotFoundError(`Product media not found for product id "${productId}" and media id "${mediaId}".`);
    }

    mediaUrl = productMedia.url;

    await productMediaRepository.removeMediaFromProduct(productId, [mediaId], tx);
    await mediaService.deleteMedia([mediaId], tx);
  });

  if (mediaUrl) {
    try {
      deleteFileFromDisk(mediaUrl);
    } catch (error) {
      console.error(`Failed to delete file from disk: ${mediaUrl}`, error);
      // TODO: implement postgres queue for background job and cleanup
    }
  }
}

export async function getMediaByProduct(productId: number, mediaId: number, executor: DB = db): Promise<ProductMediaWithMedia> {
  return await productMediaRepository.getMediaByProduct(productId, mediaId, executor);
}

export async function getAllMediaByProduct(productId: number, executor: DB = db): Promise<ProductMediaWithMedia[]> {
  return await productMediaRepository.getAllMediaByProduct(productId, executor);
}

export async function updateProductMedia(productId: number, mediaId: number, patch: UpdateProductMediaDTO): Promise<ProductMediaWithMedia> {
  const { altText, title, displayOrder } = patch;

  return await db.transaction(async tx => {
    const existing = await getMediaByProduct(productId, mediaId, tx);
    if (!existing) {
      throw new NotFoundError(`Product media not found for product "${productId}" and media "${mediaId}".`);
    }

    const mediaPatch = {
      ...(altText !== undefined && { altText }),
      ...(title !== undefined && { title }),
    };

    if (Object.keys(mediaPatch).length > 0) {
      await mediaService.update(mediaId, mediaPatch, tx);
    }

    if (displayOrder != undefined) {
      await productMediaRepository.updateDisplayOrder(productId, mediaId, displayOrder, tx);
    }

    return await getMediaByProduct(productId, mediaId, tx);
  });
}

const ProductMediaService = {
  setMediaForProduct,
  addMediaToProduct,
  removeMediaFromProduct,
  getMediaByProduct,
  updateProductMedia,
};

export default ProductMediaService;
