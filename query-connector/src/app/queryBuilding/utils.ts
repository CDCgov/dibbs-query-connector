export type ConditionIdToNameMap = {
  [conditionId: string]: string;
};

export type CategoryToConditionArrayMap = {
  [categoryName: string]: ConditionIdToNameMap[];
};
export type ConditionDetails = {
  name: string;
  include: boolean;
};
export type ConditionDetailsMap = {
  [conditionId: string]: ConditionDetails;
};

export type CategoryNameToConditionDetailsMap = {
  [categoryName: string]: ConditionDetailsMap;
};
