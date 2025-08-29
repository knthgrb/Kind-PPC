import * as React from "react";

export function usePagination<T>(items: T[], pageSize = 8) {
  const [page, setPage] = React.useState(1);

  const totalPages = Math.ceil(items.length / pageSize);
  const from = (page - 1) * pageSize;
  const rows = items.slice(from, from + pageSize);

  return { page, setPage, pageSize, totalPages, rows };
}
