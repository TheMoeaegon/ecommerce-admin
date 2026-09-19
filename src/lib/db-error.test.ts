import { BadRequestError, ConflictError } from '../shared/errors.ts';
import { translateConstraintError } from './db-error.ts';

const constraints = {
  products_slug_unique: { status: 'conflict', message: 'Slug already exists.' },
  products_price_non_negative: { status: 'badRequest', message: 'Price cannot be negative.' },
} as const;

const pgError = (code: string, constraint?: string) => ({
  code,
  constraint,
  detail: `detail for ${constraint ?? code}`,
  message: `violates ${constraint ?? 'something'}`,
});

describe('translateConstraintError', () => {
  it('throws a ConflictError for a mapped unique constraint', () => {
    expect(() => translateConstraintError(pgError('23505', 'products_slug_unique'), constraints)).toThrow(ConflictError);
  });

  it('uses the mapped message', () => {
    expect(() => translateConstraintError(pgError('23505', 'products_slug_unique'), constraints)).toThrow('Slug already exists.');
  });

  it('throws a BadRequestError for a mapped check constraint', () => {
    expect(() => translateConstraintError(pgError('23514', 'products_price_non_negative'), constraints)).toThrow(BadRequestError);
  });

  it('rethrows a pg error without a constraint name untouched', () => {
    const unnamed = pgError('23505', undefined);
    try {
      translateConstraintError(unnamed, constraints);
    } catch (err) {
      expect(err).toBe(unnamed);
    }
  });

  it('rethrows unmapped non-pg errors untouched', () => {
    const generic = new Error('boom');
    try {
      translateConstraintError(generic, constraints);
    } catch (err) {
      expect(err).toBe(generic);
    }
  });

  it('rethrows unmapped pg constraint errors untouched', () => {
    const unmapped = pgError('23503', 'some_unknown_constraint');
    try {
      translateConstraintError(unmapped, constraints);
    } catch (err) {
      expect(err).toBe(unmapped);
    }
  });
});
