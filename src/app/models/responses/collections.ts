export interface QCResponse<T> {
  items: T[];
  totalItems: number;
}

export interface QCPagedResponse<T> extends QCResponse<T> {
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  prevPage: number;
  nextPage: number;
}

export interface ValueSetFilterParams {
  pageIndex: number;
  pageSize: number;
  textSearch?: string;
  category?: string;
  codeSystem?: string;
  creatorNames?: string[];
}
