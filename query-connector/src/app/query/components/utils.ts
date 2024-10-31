import { GroupedValueSet } from "./customizeQuery/customizeQueryUtils";

/**
 * Utility function to count the number of labs / meds / conditions that we display
 * on the customize query page
 * @param obj a grouped ValueSet dictionary that we render as an individual accordion
 * @returns A count of the number of items in each of the DibbsConceptTypes
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
