import db from '../../db/connection.ts';
import { and, eq, inArray } from 'drizzle-orm';
import { attributeCombinationValues, attributeCombinations, productAttributeValues, productAttributes } from '../../db/schema.ts';
import { translateConstraintError } from '../../lib/db-error.ts';

import type {
  AttributeCombination,
  AttributeCombinationValue,
  NewAttributeCombination,
  NewProductAttribute,
  NewProductAttributeValue,
  ProductAttribute,
  ProductAttributeValue,
} from './product.types.ts';
import type { DB } from '../../shared/types/index.ts';

export interface AttributeValueWithAttribute {
  attributeId: number;
  attributeName: string;
  valueName: string;
  priceAdjustment: string;
}

export async function findValuesWithAttributes(productId: number, ids: number[], executor: DB = db): Promise<AttributeValueWithAttribute[]> {
  return await executor
    .select({
      attributeId: productAttributes.id,
      attributeName: productAttributes.name,
      valueName: productAttributeValues.name,
      priceAdjustment: productAttributeValues.priceAdjustment,
    })
    .from(productAttributeValues)
    .innerJoin(productAttributes, eq(productAttributeValues.productAttributeId, productAttributes.id))
    .where(and(inArray(productAttributeValues.id, ids), eq(productAttributes.productId, productId)))
    .orderBy(productAttributes.displayOrder, productAttributes.id, productAttributeValues.displayOrder, productAttributeValues.id);
}

export async function clearDefaultCombination(productId: number, executor: DB = db): Promise<void> {
  await executor
    .update(attributeCombinations)
    .set({ isDefault: false })
    .where(and(eq(attributeCombinations.productId, productId), eq(attributeCombinations.isDefault, true)));
}

export async function insert(attribute: NewProductAttribute, executor: DB = db): Promise<ProductAttribute> {
  try {
    const [created] = await executor.insert(productAttributes).values(attribute).returning({
      id: productAttributes.id,
      productId: productAttributes.productId,
      name: productAttributes.name,
      description: productAttributes.description,
      controlType: productAttributes.controlType,
      displayOrder: productAttributes.displayOrder,
      createdAt: productAttributes.createdAt,
      updatedAt: productAttributes.updatedAt,
    });
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
    return await executor.insert(productAttributeValues).values(values).returning({
      id: productAttributeValues.id,
      productAttributeId: productAttributeValues.productAttributeId,
      name: productAttributeValues.name,
      priceAdjustment: productAttributeValues.priceAdjustment,
      displayOrder: productAttributeValues.displayOrder,
      createdAt: productAttributeValues.createdAt,
      updatedAt: productAttributeValues.updatedAt,
    });
  } catch (err) {
    const attributeId = values[0]?.productAttributeId;
    return translateConstraintError(err, {
      fk_product_attribute_values_attribute_id_product_attributes: { status: 'badRequest', message: `The attribute with id "${attributeId}" does not exist.` },
      product_attribute_values_attr_id_name_unique: { status: 'conflict', message: `One or more values already exist for attribute "${attributeId}".` },
    });
  }
}

export async function insertAttributeCombination(combination: NewAttributeCombination, executor: DB = db): Promise<AttributeCombination> {
  try {
    const [created] = await executor.insert(attributeCombinations).values(combination).returning({
      id: attributeCombinations.id,
      productId: attributeCombinations.productId,
      valueSignature: attributeCombinations.valueSignature,
      sku: attributeCombinations.sku,
      availability: attributeCombinations.availability,
      isDefault: attributeCombinations.isDefault,
      overridePrice: attributeCombinations.overridePrice,
      createdAt: attributeCombinations.createdAt,
      updatedAt: attributeCombinations.updatedAt,
    });
    return created;
  } catch (err) {
    return translateConstraintError(err, {
      fk_attribute_combinations_product_id_products: { status: 'badRequest', message: `The product with id "${combination.productId}" does not exist.` },
      attribute_combinations_product_id_signature_unique: {
        status: 'conflict',
        message: `A combination with the same values ("${combination.valueSignature}") already exists for product "${combination.productId}".`,
      },
      attribute_combinations_product_id_sku_unique: { status: 'conflict', message: `A combination with SKU "${combination.sku}" already exists for product "${combination.productId}".` },
      attribute_combinations_one_default_per_product: {
        status: 'conflict',
        message: `Could not assign the default combination for product "${combination.productId}" because another default was set concurrently. Please retry.`,
      },
    });
  }
}

export async function insertAttributeCombinationValues(combinationId: number, valueIds: number[], executor: DB = db): Promise<AttributeCombinationValue[]> {
  try {
    return await executor
      .insert(attributeCombinationValues)
      .values(valueIds.map(productAttributeValueId => ({ attributeCombinationId: combinationId, productAttributeValueId })))
      .returning({
        attributeCombinationId: attributeCombinationValues.attributeCombinationId,
        productAttributeValueId: attributeCombinationValues.productAttributeValueId,
      });
  } catch (err) {
    return translateConstraintError(err, {
      fk_attribute_combination_values_combination_id: { status: 'badRequest', message: `The combination with id "${combinationId}" does not exist.` },
      fk_attribute_combination_values_value_id: { status: 'badRequest', message: `One or more attribute values do not exist: ${valueIds.join(', ')}.` },
      attribute_combination_values_pkey: { status: 'conflict', message: `One or more values are already part of combination "${combinationId}": ${valueIds.join(', ')}.` },
    });
  }
}
