import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import React, { ChangeEvent, useState } from "react";
import ConceptSelection from "./ConceptSelection";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { Concept, DibbsValueSet } from "@/app/shared/constants";
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";
import Highlighter from "react-highlight-words";

type ConceptTypeAccordionBodyProps = {
  activeValueSets: { [vsId: string]: DibbsValueSet };
  handleVsIdLevelUpdate: (
    vsId: string,
  ) => (dibbsValueSets: DibbsValueSet) => void;
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
 * @returns An accordion body component
 */
const ConceptTypeAccordionBody: React.FC<ConceptTypeAccordionBodyProps> = ({
  activeValueSets,
  handleVsIdLevelUpdate,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [curValueSet, setCurValueSet] = useState<DibbsValueSet>();
  const [curConcepts, setCurConcepts] = useState<ConceptDisplay[]>([]);

  const handleViewCodes = (vs: DibbsValueSet) => {
    setCurValueSet(vs);
    setCurConcepts(
      vs.concepts.map((c) => {
        return { ...c, render: true };
      }),
    );

    setIsDrawerOpen(true);
  };

  const handleConceptsChange = (
    updatedConcepts: ConceptDisplay[],
    updateBatchSave = true,
  ) => {
    if (curValueSet) {
      const shouldIncludeValueSet = updatedConcepts
        .map((c) => c.include)
        .some(Boolean);
      curValueSet.includeValueSet = shouldIncludeValueSet;
      curValueSet.concepts = updatedConcepts.map((c) => {
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
    const includeStatus = e.target.checked;

    const valueSetToUpdate = activeValueSets[valueSetToUpdateId];
    const handleValueSetLevelUpdate = handleVsIdLevelUpdate(valueSetToUpdateId);
    valueSetToUpdate.includeValueSet = includeStatus;
    valueSetToUpdate.concepts.map((c) => {
      c.include = isMinusState ? false : includeStatus;
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
    setIsDrawerOpen(false);
  };

  function handleValueSetSearch(searchFilter: string) {
    if (curValueSet) {
      const filteredConcepts = filterValueSetConcepts(
        searchFilter,
        curValueSet,
      );

      setCurConcepts(filteredConcepts);
    }
  }

  return (
    <div>
      {Object.values(activeValueSets).map((dibbsVs) => {
        const conceptsToRender = dibbsVs.concepts;
        const selectedCount = conceptsToRender.filter((c) => c.include).length;
        const totalCount = conceptsToRender.length;

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
                label={checkboxLabel(dibbsVs)}
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
        title={curValueSet?.valueSetName ?? ""}
        placeholder="Search by code or name"
        toastMessage="Valueset concepts have been successfully modified."
        toRender={
          <ConceptSelection
            concepts={curConcepts}
            onConceptsChange={handleConceptsChange}
            searchFilter={drawerSearchFilter}
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

const checkboxLabel = (dibbsVs: DibbsValueSet) => {
  return (
    <div className={styles.expandedContent}>
      <div className={styles.vsName}> {dibbsVs.valueSetName}</div>
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
 * @returns - a transformed list of concepts to display
 */
export function filterValueSetConcepts(
  searchFilter: string,
  selectedValueSet: DibbsValueSet,
) {
  const newConcepts = structuredClone(selectedValueSet.concepts);
  const casedSearchFilter = searchFilter.toLocaleLowerCase();
  return newConcepts.map((concept) => {
    let toRender = false;
    if (
      concept.code.toLocaleLowerCase().includes(casedSearchFilter) ||
      concept.display.toLocaleLowerCase().includes(casedSearchFilter)
    ) {
      toRender = true;
    }

    return { ...concept, render: toRender };
  });
}

export default ConceptTypeAccordionBody;
