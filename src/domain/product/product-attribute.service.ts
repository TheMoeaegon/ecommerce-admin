import db from '../../db/connection.ts';
import * as productAttributeRepository from './product-attribute.repository.ts';

import type { CreateProductAttributeDTO, CreateProductAttributeResponse, CreateProductAttributeValueDTO } from './product.types.ts';

export function buildAttributeValue(payload: CreateProductAttributeValueDTO, productAttributeId: number) {
  return {
    ...payload,
    priceAdjustment: String(payload.priceAdjustment),
    productAttributeId,
  };
}

export async function createAttribute(productId: number, payload: CreateProductAttributeDTO): Promise<CreateProductAttributeResponse> {
  const { values, ...attribute } = payload;

  return await db.transaction(async tx => {
    const created = await productAttributeRepository.insert({ ...attribute, productId }, tx);

    const createdValues = values.length > 0
      ? await productAttributeRepository.insertManyAttributeValue(
          values.map(value => buildAttributeValue(value, created.id)),
          tx
        )
      : [];

    return { ...created, values: createdValues };
  });
}
