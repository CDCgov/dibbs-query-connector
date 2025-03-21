import { DibbsValueSet } from "./valuesets";
import { UserGroupMembership } from "./users";

export interface CustomUserQuery {
  query_id: string;
  query_name: string;
  conditions_list?: string[];
  valuesets: DibbsValueSet[];
  userGroupMemberships?: UserGroupMembership[];
}
