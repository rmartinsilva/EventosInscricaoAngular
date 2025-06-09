export interface PaginatedMeta {
  total: number;
  is_first_page: boolean;
  is_last_page: boolean;
  current_page: number;
  next_page: number | null;
  previous_page: number | null;
  total_pages: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
} 