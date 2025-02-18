export interface QCResponse<T> {
  items: T[] | null;
  totalItems: number;
}

export interface QCPagedResponse<T> extends QCResponse<T> {
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  prevPage: number;
  nextPage: number;
}
