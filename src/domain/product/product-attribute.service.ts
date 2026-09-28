import db from '../../db/connection.ts';
import { BadRequestError, ErrorCode, NotFoundError } from '../../shared/errors.ts';
import * as productAttributeRepository from './product-attribute.repository.ts';
import * as productRepository from './product.repository.ts';
import type { AttributeValueWithAttribute } from './product-attribute.repository.ts';

import type {
  ComputeAttributeCombinationPriceResponse,
  CreateAttributeCombinationDTO,
  CreateAttributeCombinationResponse,
  CreateProductAttributeDTO,
  CreateProductAttributeResponse,
  CreateProductAttributeValueDTO,
} from './product.types.ts';

export function buildValueSignature(rows: Array<AttributeValueWithAttribute>): string {
  return rows.map(row => `${row.attributeName}: ${row.valueName}`).join(', ');
}

function assertAllValuesExist(rows: Array<AttributeValueWithAttribute>, valueIds: number[]): void {
  const requested = [...new Set(valueIds)];

  if (rows.length === requested.length) {
    return;
  }

  throw new BadRequestError(`One or more attribute values do not exist: ${requested.join(', ')}.`);
}

function assertOneValuePerAttribute(rows: Array<AttributeValueWithAttribute>): void {
  const attributeIds = new Set<number>();
  for (const row of rows) {
    if (attributeIds.has(row.attributeId)) {
      throw new BadRequestError(`Only one value per attribute is allowed; attribute "${row.attributeName}" has more than one value.`, ErrorCode.VALIDATION_ERROR);
    }
    attributeIds.add(row.attributeId);
  }
}

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

    const createdValues =
      values.length > 0
        ? await productAttributeRepository.insertManyAttributeValue(
            values.map(value => buildAttributeValue(value, created.id)),
            tx
          )
        : [];

    return { ...created, values: createdValues };
  });
}

export async function computeAttributeCombinationPrice(productId: number, valueIds: number[]): Promise<ComputeAttributeCombinationPriceResponse> {
  if (valueIds.length === 0) {
    throw new BadRequestError('At least one attribute value is required to compute a combination price.', ErrorCode.VALIDATION_ERROR);
  }

  const basePriceRow = await productRepository.findBasePrice(productId);
  if (basePriceRow === undefined) {
    throw new NotFoundError(`The product with id "${productId}" does not exist.`);
  }

  const valueRows = await productAttributeRepository.findValuesWithAttributes(productId, valueIds);
  assertAllValuesExist(valueRows, valueIds);
  assertOneValuePerAttribute(valueRows);

  const adjustmentsTotal = valueRows.reduce((sum, row) => sum + Number(row.priceAdjustment), 0);
  const basePrice = Number(basePriceRow);
  const computedPrice = Math.round((basePrice + adjustmentsTotal) * 100) / 100;

  return {
    basePrice,
    computedPrice,
    values: valueRows.map(row => ({
      attributeName: row.attributeName,
      name: row.valueName,
      priceAdjustment: Number(row.priceAdjustment),
    })),
  };
}

export async function createAttributeCombination(productId: number, payload: CreateAttributeCombinationDTO): Promise<CreateAttributeCombinationResponse> {
  const { values, computedPrice, overridePrice, ...combination } = payload;

  if (values.length === 0) {
    throw new BadRequestError('At least one attribute value is required to create an attribute combination.', ErrorCode.VALIDATION_ERROR);
  }

  if (computedPrice == undefined && overridePrice == undefined) {
    throw new BadRequestError('At least one price is required', ErrorCode.VALIDATION_ERROR);
  }

  return await db.transaction(async tx => {
    if (!(await productRepository.existsById(productId, tx))) {
      throw new BadRequestError(`The product with id "${productId}" does not exist.`);
    }

    const valueRows = await productAttributeRepository.findValuesWithAttributes(productId, values, tx);
    assertAllValuesExist(valueRows, values);
    assertOneValuePerAttribute(valueRows);
    const valueSignature = buildValueSignature(valueRows);

    if (combination.isDefault) {
      await productAttributeRepository.clearDefaultCombination(productId, tx);
    }

    const created = await productAttributeRepository.insertAttributeCombination(
      {
        ...combination,
        productId,
        valueSignature,
        overridePrice: overridePrice == undefined ? undefined : String(overridePrice),
      },
      tx
    );

    await productAttributeRepository.insertAttributeCombinationValues(created.id, values, tx);

    const { valueSignature: storedSignature, ...combinationWithoutSignature } = created;
    return {
      ...combinationWithoutSignature,
      values: storedSignature,
      computedPrice: overridePrice != undefined ? null : (computedPrice ?? null),
    };
  });
}
