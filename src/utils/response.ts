type PaginatedRow = { total: number };

type PaginatedResponse<T extends PaginatedRow> = {
  data: Omit<T, 'total'>[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export function preparePaginatedResponse<T extends PaginatedRow>(
  result: T[],
  page: number,
  limit: number
): PaginatedResponse<T> {
  const total = result[0]?.total ?? 0;
  return {
    data: result.map(({ total: _, ...rest }) => rest as Omit<T, 'total'>),
    meta: {
      page,
      pageSize: limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
