import { GroupedValueSet } from "./customizeQuery/customizeQueryUtils";

/**
 *
 */
export const countDibbsConceptTypeToVsMapItems = (obj: {
  [vsNameAuthorSystem: string]: GroupedValueSet;
}) => {
  return Object.values(obj).reduce((runningSum, gvs) => {
    gvs.items.forEach((vs) => {
      runningSum += vs.concepts.length;
    });
    return runningSum;
  }, 0);
};
