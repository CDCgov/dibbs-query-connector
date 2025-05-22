import { Concept } from "./concepts";

export type DibbsConceptType = "labs" | "conditions" | "medications";

export interface DibbsValueSet {
  valueSetId: string;
  valueSetVersion: string;
  valueSetName: string;
  valueSetExternalId?: string;
  author: string;
  system: string | "";
  ersdConceptType?: string;
  dibbsConceptType: DibbsConceptType;
  includeValueSet: boolean;
  concepts: Concept[];
  conditionId?: string;
  userCreated: boolean;
}
