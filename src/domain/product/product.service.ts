import { ensureSlugIsUnique, ensureSkuIsUnique, validateProductCreate } from './product.validation.ts';
import productRepository from './product.repository.ts';
import productMediaRepository from './product-media.repository.ts';
import mediaRepository from '../media/media.repository.ts';
import db from '../../db/connection.ts';
import { BadRequestError } from '../../shared/errors.ts';
import { deleteFileFromDisk, getImageUrlPath } from '../../utils/media.ts';

import type { AttachProductMediaResponse, CreateProductDTO, CreateProductResponse, NewProduct } from './product.types.ts';
import type { ProductMediaItem } from './product-media.types.ts';

export async function createProduct(payload: CreateProductDTO): Promise<CreateProductResponse> {
  validateProductCreate(payload);

  const existingBySlug = await productRepository.findBySlug(payload.slug);
  ensureSlugIsUnique(existingBySlug, payload.slug);

  if (payload.sku) {
    const existingBySku = await productRepository.findBySku(payload.sku);
    ensureSkuIsUnique(existingBySku, payload.sku);
  }

  const newProduct: NewProduct = {
    ...payload,
    price: String(payload.price),
    oldPrice: payload.oldPrice == undefined ? undefined : String(payload.oldPrice),
  };

  return await db.transaction(async tx => {
    const { categoryIds, tagIds } = payload;
    const product = await productRepository.insert(newProduct, tx);

    if (categoryIds.length > 0) {
      await productRepository.addCategories(product.id, categoryIds, tx);
    }

    if (tagIds.length > 0) {
      await productRepository.addTags(product.id, tagIds, tx);
    }

    return { ...product, categoryIds, tagIds };
  });
}

export async function addProductMedia(productId: number, files: Express.Multer.File[]): Promise<AttachProductMediaResponse> {
  if (files.length === 0) {
    throw new BadRequestError('media field is required');
  }

  const imageUrls = files.map(file => getImageUrlPath(file).imageUrl);

  try {
    return await db.transaction(async tx => {
      const mediaRows = await mediaRepository.createMany(
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
    for (const url of imageUrls) {
      deleteFileFromDisk(url);
    }
    throw err;
  }
}

const ProductService = { createProduct, addProductMedia };

export default ProductService;
