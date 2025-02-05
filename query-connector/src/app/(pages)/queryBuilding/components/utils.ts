import {
  DibbsValueSet,
  DibbsConceptType,
  Concept,
} from "@/app/shared/constants";
import { ConceptTypeToDibbsVsMap } from "@/app/utils/valueSetTranslation";
import { EMPTY_CONCEPT_TYPE } from "../utils";

export const CONDITION_DRAWER_SEARCH_PLACEHOLDER =
  "Search condition or category";
export const VALUESET_SELECTION_SEARCH_PLACEHOLDER =
  "Search labs, medications, conditions";
export const VALUESET_DRAWER_SEARCH_PLACEHOLDER = "Search by code or name";

type ValueSetWithRender = {
  render: boolean;
  concepts: FilterableConcept[];
};

export type FilterableConcept = Concept & {
  render: boolean;
};

export type FilterableValueSet = Omit<DibbsValueSet, "concepts"> &
  ValueSetWithRender;

/**
 * Helper function for search to filter out valuesets against a search param
 * @param searchFilter - search string
 * @param selectedValueSet - the active valueset displayed in the drawer
 * @param matchOnValueSetName - optional boolean to match the search filter on
 * the valueset name
 * @returns - a transformed list of concepts to display
 */
export function filterConcepts(
  searchFilter: string,
  selectedValueSet: FilterableValueSet | DibbsValueSet,
  matchOnValueSetName = true,
) {
  const casedSearchFilter = searchFilter.toLocaleLowerCase();
  const valueSetNameMatch =
    matchOnValueSetName &&
    selectedValueSet.valueSetName
      .toLocaleLowerCase()
      .includes(casedSearchFilter);

  const newConcepts = structuredClone(selectedValueSet.concepts);
  return newConcepts.map((concept) => {
    // if render has been set to false by a previous filter action (ie at the
    // valueset level, skip this concept)
    if (
      !matchOnValueSetName &&
      "render" in concept &&
      concept.render === false
    ) {
      return concept;
    }

    let toRender =
      valueSetNameMatch ||
      concept.code.toLocaleLowerCase().includes(casedSearchFilter) ||
      concept.display.toLocaleLowerCase().includes(casedSearchFilter);

    return { ...concept, render: toRender };
  });
}

/**
 * A helper function to filter a v
 * @param searchFilter - the search string to filter against
 * @param vs - the valueset to filter
 * @returns a valueset with the appropriate render flags set for itself/its concepts
 */
export function filterValueSet(searchFilter: string, vs: DibbsValueSet) {
  let vsNameMatch = vs.valueSetName.toLocaleLowerCase().includes(searchFilter);
  const conceptMatches = filterConcepts(searchFilter, vs);
  const curValueSet = {
    ...vs,
    render:
      // render a valueset if there's a match on the name or if there's a match
      // on any of its concepts
      vsNameMatch || conceptMatches.map((c) => c.render).some(Boolean),
  } as FilterableValueSet;
  curValueSet.concepts = conceptMatches;
  return curValueSet;
}

/**
 * Function to filter valuesets at the lab/meds/condition level
 * @param vsTypeLevelOptions - option to be filtered
 * @param searchFilter - search string
 * @returns a map of labs / conditions / meds to filtered concept types
 */
export function filterVsTypeOptions(
  vsTypeLevelOptions: ConceptTypeToDibbsVsMap,
  searchFilter: string,
) {
  const casedSearchFilter = searchFilter.toLocaleLowerCase();
  const filteredValueSets: {
    [conceptType in DibbsConceptType]: {
      [vsId: string]: FilterableValueSet;
    };
  } = structuredClone(EMPTY_CONCEPT_TYPE);

  Object.entries(vsTypeLevelOptions).forEach(([vsType, vsDict]) => {
    const curVsType = vsType as DibbsConceptType;
    Object.entries(vsDict).forEach(([vsId, vs]) => {
      // initialize the filterable concepts and value sets
      const curValueSet = filterValueSet(casedSearchFilter, vs);
      filteredValueSets[curVsType][vsId] = curValueSet;
    });
  });

  return filteredValueSets;
}
