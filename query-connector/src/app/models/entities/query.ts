import { DibbsValueSet } from "./valuesets";

export interface CustomUserQuery {
  query_id: string;
  query_name: string;
  conditions_list?: string[];
  valuesets: DibbsValueSet[];
}
