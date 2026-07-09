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

export interface AuditLogFilterParams {
  pageIndex: number;
  pageSize: number;
  author?: string;
  actionType?: string;
  textSearch?: string;
  // action types whose UI label matches textSearch, so searches on
  // human-readable action labels still hit the raw action_type column
  searchedActionTypes?: string[];
  startDate?: string;
  endDate?: string;
}
