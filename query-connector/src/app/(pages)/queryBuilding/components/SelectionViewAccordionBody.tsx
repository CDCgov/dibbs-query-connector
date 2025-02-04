import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import React, { ChangeEvent, useEffect, useState } from "react";
import ConceptSelection from "./ConceptSelection";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { Concept, DibbsValueSet } from "@/app/shared/constants";
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";
import {
  FilterableConcept,
  FilterableValueSet,
  filterValueSet,
} from "./SelectionTable";
import Highlighter from "react-highlight-words";

type ConceptTypeAccordionBodyProps = {
  activeValueSets: { [vsId: string]: FilterableValueSet };
  handleVsIdLevelUpdate: (
    vsId: string,
  ) => (dibbsValueSets: DibbsValueSet) => void;
  tableSearchFilter?: string;
};

export type ConceptDisplay = Concept & {
  render: boolean;
};

/**
 * An accordion body fragment
 * @param param0 - params
 * @param param0.activeValueSets - Valuesets for display in this accordion
 * @param param0.handleVsIdLevelUpdate - curried state update function that
 * takes a valueset ID and generates a ValueSet level update
 * @param param0.tableSearchFilter - the search string from the selection table
 * @returns An accordion body component
 */
const ConceptTypeAccordionBody: React.FC<ConceptTypeAccordionBodyProps> = ({
  activeValueSets,
  handleVsIdLevelUpdate,
  tableSearchFilter = "",
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [curValueSet, setCurValueSet] = useState<DibbsValueSet>();
  const [curConcepts, setCurConcepts] = useState<FilterableConcept[]>([]);
  const [drawerSearchFilter, setDrawerSearchFilter] = useState<string>("");
  const areItemsFiltered = tableSearchFilter !== "";

  useEffect(() => {
    if (curValueSet) {
      const filteredConcepts = filterConceptsBySearchFilter(
        tableSearchFilter,
        curValueSet,
      );
      setCurConcepts(filteredConcepts);
    }
  }, [tableSearchFilter, curValueSet]);

  const handleViewCodes = (vs: FilterableValueSet) => {
    setCurValueSet(vs);
    setCurConcepts(
      vs.concepts.map((c) => {
        return { ...c, render: c.render ?? true };
      }),
    );

    setIsDrawerOpen(true);
  };

  const handleConceptsChange = (
    updatedConcepts: FilterableConcept[],
    updateBatchSave = true,
  ) => {
    if (curValueSet) {
      const shouldIncludeValueSet = updatedConcepts
        .map((c) => c.include)
        .some(Boolean);
      curValueSet.includeValueSet = shouldIncludeValueSet;
      curValueSet.concepts = updatedConcepts.map((c) => {
        // the state update doesn't need the extra .render method
        return { display: c.display, code: c.code, include: c.include };
      });

      if (updateBatchSave) {
        handleVsIdLevelUpdate(curValueSet.valueSetId)(curValueSet);
      }
      setCurConcepts(updatedConcepts);
    }
  };

  function handleBulkToggle(
    e: ChangeEvent<HTMLInputElement>,
    isMinusState: boolean,
  ) {
    const valueSetToUpdateId = e.target.id;
    const includeStatus = e.target.checked || isMinusState;

    const valueSetToUpdate = activeValueSets[valueSetToUpdateId];
    const handleValueSetLevelUpdate = handleVsIdLevelUpdate(valueSetToUpdateId);
    valueSetToUpdate.includeValueSet = includeStatus;
    valueSetToUpdate.concepts.map((c) => {
      if (c.render) {
        c.include = isMinusState ? false : includeStatus;
      }
      return c;
    });

    handleValueSetLevelUpdate(valueSetToUpdate);
  }

  const handleSaveChanges = () => {
    Object.entries(activeValueSets).map(([vsId, dibbsVs]) => {
      if (dibbsVs.valueSetName === curValueSet?.valueSetName && curConcepts) {
        const shouldIncludeValueSet = curConcepts
          .map((c) => c.include)
          .some(Boolean);

        dibbsVs.concepts = curConcepts;
        dibbsVs.includeValueSet = shouldIncludeValueSet;

        handleVsIdLevelUpdate(vsId)(dibbsVs);
      }
    });
  };

  function handleValueSetSearch(drawerSearchFilter: string) {
    if (curValueSet) {
      // first filter by whatever search filter we've set at the valueset level
      const valueSetFilteredConcepts = filterValueSet(
        tableSearchFilter,
        curValueSet,
      );

      const filteredConcepts = filterConceptsBySearchFilter(
        drawerSearchFilter,
        // and use that subset to display anything within the drawer
        valueSetFilteredConcepts,
        false,
      );

      setCurConcepts(filteredConcepts);
      setDrawerSearchFilter(drawerSearchFilter);
    }
  }

  return (
    <div>
      {Object.values(activeValueSets).map((dibbsVs) => {
        if (areItemsFiltered && !dibbsVs.render) return;
        const conceptsToRender = dibbsVs.concepts;
        const selectedCount = conceptsToRender.filter(
          (c) => c.include && c.render,
        ).length;
        const totalCount = conceptsToRender.filter((c) => c.render).length;

        const isMinusState =
          selectedCount !== totalCount && selectedCount !== 0;
        const checked = selectedCount == totalCount && selectedCount > 0;

        return (
          <div
            className={styles.accordionBodyExpanded}
            key={dibbsVs.valueSetId}
            data-testid={`container-${dibbsVs.valueSetId}`}
          >
            <div className={styles.accordionExpandedInner}>
              <Checkbox
                className={styles.valueSetTemplate__checkbox}
                label={checkboxLabel(
                  dibbsVs,
                  tableSearchFilter,
                  areItemsFiltered,
                )}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  handleBulkToggle(e, isMinusState);
                }}
                id={dibbsVs.valueSetId}
                checked={checked}
                isMinusState={isMinusState}
                data-testid={`selectValueset-${dibbsVs.valueSetId}`}
              />
            </div>
            <div className={styles.accordionBodyExpanded__right}>
              <div className={styles.displayCount}>
                {selectedCount}/{totalCount}
              </div>
              <div
                data-testid={`viewCodes-${dibbsVs.valueSetId}`}
                className={styles.viewCodesBtn}
                role="button"
                onClick={() => {
                  handleViewCodes(dibbsVs);
                }}
              >
                View Codes
              </div>
            </div>
          </div>
        );
      })}
      <Drawer
        title={
          <Highlighter
            highlightClassName="bg-yellow"
            searchWords={[tableSearchFilter]}
            autoEscape={true}
            textToHighlight={curValueSet?.valueSetName ?? ""}
          />
        }
        subtitle={
          tableSearchFilter ? `Pre-filtered by "${tableSearchFilter}"` : ""
        }
        placeholder="Search by code or name"
        toastMessage="Valueset concepts have been successfully modified."
        toRender={
          <ConceptSelection
            concepts={curConcepts}
            onConceptsChange={handleConceptsChange}
            searchFilter={[drawerSearchFilter, tableSearchFilter]}
          />
        }
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setCurValueSet(undefined);
          setDrawerSearchFilter("");
        }}
        onSave={handleSaveChanges}
        onSearch={handleValueSetSearch}
      />
    </div>
  );
};

const checkboxLabel = (
  dibbsVs: FilterableValueSet,
  searchFilter = "",
  isFilteredItem = false,
) => {
  const SUMMARIZE_CODE_RENDER_LIMIT = 5;
  const codesToRender = dibbsVs.concepts.filter((c) => c.render);
  return (
    <div className={styles.expandedContent}>
      <div className={styles.vsName}>
        <Highlighter
          highlightClassName="bg-yellow"
          searchWords={[searchFilter]}
          autoEscape={true}
          textToHighlight={dibbsVs.valueSetName}
        />
      </div>
      {isFilteredItem && (
        <strong>
          Includes:{" "}
          {codesToRender.length < SUMMARIZE_CODE_RENDER_LIMIT ? (
            // render the individual code matches
            <Highlighter
              highlightClassName="bg-yellow"
              searchWords={[searchFilter]}
              autoEscape={true}
              textToHighlight={codesToRender.map((c) => c.code).join(", ")}
            />
          ) : (
            //  past this many matches, don't render the individual codes in favor of a
            // "this many matches" string
            <span className="bg-yellow">{`${dibbsVs.concepts.length} codes`}</span>
          )}
        </strong>
      )}

      <div className={styles.vsDetails}>
        <div className="padding-right-2">{`Author: ${dibbsVs.author}`}</div>
        <div>{`System: ${dibbsVs.system.toLocaleLowerCase()}`}</div>
      </div>
    </div>
  );
};

/**
 * Helper function for search to filter out valuesets against a search param
 * @param searchFilter - search string
 * @param selectedValueSet - the active valueset displayed in the drawer
 * @param matchOnValueSetName - optional boolean to match the search filter on
 * the valueset name
 * @returns - a transformed list of concepts to display
 */
export function filterConceptsBySearchFilter(
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
    if ("render" in concept && concept.render === false) {
      return concept;
    }

    let toRender =
      valueSetNameMatch ||
      concept.code.toLocaleLowerCase().includes(casedSearchFilter) ||
      concept.display.toLocaleLowerCase().includes(casedSearchFilter);

    return { ...concept, render: toRender };
  });
}

export default ConceptTypeAccordionBody;
