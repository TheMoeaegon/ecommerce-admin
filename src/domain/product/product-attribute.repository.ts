import db from '../../db/connection.ts';
import { productAttributeValues, productAttributes } from '../../db/schema.ts';
import { translateConstraintError } from '../../lib/db-error.ts';

import type { NewProductAttribute, NewProductAttributeValue, ProductAttribute, ProductAttributeValue } from './product.types.ts';
import type { DB } from '../../shared/types/index.ts';

export async function insert(attribute: NewProductAttribute, executor: DB = db): Promise<ProductAttribute> {
  try {
    const [created] = await executor.insert(productAttributes).values(attribute).returning();
    return created;
  } catch (err) {
    return translateConstraintError(err, {
      fk_product_attributes_product_id_products: { status: 'badRequest', message: `The product with id "${attribute.productId}" does not exist.` },
      product_attributes_product_id_name_unique: { status: 'conflict', message: `An attribute named "${attribute.name}" already exists for product "${attribute.productId}".` },
    });
  }
}

export async function insertManyAttributeValue(values: NewProductAttributeValue[], executor: DB = db): Promise<ProductAttributeValue[]> {
  try {
    return await executor.insert(productAttributeValues).values(values).returning();
  } catch (err) {
    const attributeId = values[0]?.productAttributeId;
    return translateConstraintError(err, {
      fk_product_attribute_values_attribute_id_product_attributes: { status: 'badRequest', message: `The attribute with id "${attributeId}" does not exist.` },
      product_attribute_values_attr_id_name_unique: { status: 'conflict', message: `One or more values already exist for attribute "${attributeId}".` },
    });
  }
}
