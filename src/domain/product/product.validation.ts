import { BadRequestError, ConflictError } from '../../shared/errors.ts';

import type { CreateProductDTO } from './product.types.ts';

export function ensureSlugIsUnique(existing: { id: number } | undefined, requestedSlug: string): void {
  if (existing) {
    throw new ConflictError(`A product with slug "${requestedSlug}" already exists.`);
  }
}

export function ensureSkuIsUnique(existing: { id: number } | undefined, requestedSku: string | null): void {
  if (requestedSku && existing) {
    throw new ConflictError(`A product with SKU "${requestedSku}" already exists.`);
  }
}

export function validateProductCreate(payload: CreateProductDTO): void {
  if (payload.price < 0) {
    throw new BadRequestError('Price must be zero or greater.');
  }

  if (payload.published && payload.price <= 0) {
    throw new BadRequestError('A product with a price of 0 cannot be published.');
  }

  if (payload.availableFrom && payload.availableTo && payload.availableTo <= payload.availableFrom) {
    throw new BadRequestError('availableTo must be after availableFrom.');
  }
}
