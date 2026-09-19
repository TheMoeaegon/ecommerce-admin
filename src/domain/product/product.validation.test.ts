import { BadRequestError, ConflictError } from '../../shared/errors.ts';
import { ensureSlugIsUnique, ensureSkuIsUnique, validateProductCreate } from './product.validation.ts';

import type { CreateProductDTO } from './product.types.ts';

const basePayload: CreateProductDTO = {
  name: 'T-Shirt',
  slug: 't-shirt',
  price: 25,
  published: true,
  ratingEnabled: true,
  allowReviews: true,
  availability: 'IN_STOCK',
  showOnHomepage: false,
  isNew: false,
  displayOrder: 0,
};

describe('validateProductCreate', () => {
  it('returns nothing when all requirements are met', () => {
    expect(() => validateProductCreate(basePayload)).not.toThrow();
  });

  it('rejects a negative price', () => {
    expect(() => validateProductCreate({ ...basePayload, price: -1 })).toThrow(BadRequestError);
  });

  it('rejects publishing a product with a zero price', () => {
    expect(() => validateProductCreate({ ...basePayload, price: 0 })).toThrow(BadRequestError);
  });

  it('allows a zero-price draft', () => {
    expect(() => validateProductCreate({ ...basePayload, published: false, price: 0 })).not.toThrow();
  });

  it('rejects availableTo before availableFrom', () => {
    expect(() => validateProductCreate({ ...basePayload, availableFrom: new Date('2026-01-02'), availableTo: new Date('2026-01-01') })).toThrow(BadRequestError);
  });

  it('rejects availableTo equal to availableFrom', () => {
    const date = new Date('2026-01-01');

    expect(() => validateProductCreate({ ...basePayload, availableFrom: date, availableTo: date })).toThrow(BadRequestError);
  });

  it('accepts availableTo after availableFrom', () => {
    expect(() => validateProductCreate({ ...basePayload, availableFrom: new Date('2026-01-01'), availableTo: new Date('2026-01-02') })).not.toThrow();
  });

  it('accepts when only one of the availability dates is set', () => {
    expect(() => validateProductCreate({ ...basePayload, availableFrom: new Date('2026-01-01') })).not.toThrow();
    expect(() => validateProductCreate({ ...basePayload, availableTo: new Date('2026-01-02') })).not.toThrow();
  });
});

describe('ensureSlugIsUnique', () => {
  it('throws conflict when a product with the slug already exists', () => {
    expect(() => ensureSlugIsUnique({ id: 1 }, 't-shirt')).toThrow(ConflictError);
  });

  it('returns nothing when the slug is free', () => {
    expect(() => ensureSlugIsUnique(undefined, 't-shirt')).not.toThrow();
  });
});

describe('ensureSkuIsUnique', () => {
  it('throws conflict when the sku is provided and already exists', () => {
    expect(() => ensureSkuIsUnique({ id: 1 }, 'TS-001')).toThrow(ConflictError);
  });

  it('returns nothing when the sku is free', () => {
    expect(() => ensureSkuIsUnique(undefined, 'TS-001')).not.toThrow();
  });

  it('returns nothing when no sku is provided even if the row exists', () => {
    expect(() => ensureSkuIsUnique({ id: 1 }, null)).not.toThrow();
  });
});
