import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import React, { ChangeEvent, useEffect, useState } from "react";
import ConceptSelection from "./ConceptSelection";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import Highlighter from "react-highlight-words";
import {
  FilterableConcept,
  FilterableValueSet,
  VALUESET_DRAWER_SEARCH_PLACEHOLDER,
  filterConcepts,
  filterValueSet,
} from "./utils";
import { Button, Tooltip } from "@trussworks/react-uswds";
import TooltipWrapper, {
  TooltipWrapperProps,
} from "@/app/ui/designSystem/Tooltip";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { Concept } from "@/app/models/entities/concepts";
import ValueSetBulkToggle from "./ValueSetBulkToggle";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

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
      const filteredConcepts = filterConcepts(tableSearchFilter, curValueSet);
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

    const affectedCount = valueSetToUpdate.concepts.filter(
      (c) => c.render,
    ).length;

    showToastConfirmation({
      body: `${affectedCount} code(s) successfully ${
        includeStatus ? "added" : "removed"
      }`,
      variant: "success",
      hideProgressBar: true,
    });
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

      const filteredConcepts = filterConcepts(
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

        const checkboxToRender = (
          <ValueSetBulkToggle
            dibbsVs={dibbsVs}
            selectedCount={selectedCount}
            totalCount={totalCount}
            tableSearchFilter={tableSearchFilter}
            areItemsFiltered={areItemsFiltered}
            handleBulkToggle={handleBulkToggle}
            handleViewCodes={handleViewCodes}
          />
        );
        return (
          <div
            className={styles.accordionBodyExpanded}
            key={dibbsVs.valueSetId}
            data-testid={`container-${dibbsVs.valueSetId}`}
            onClick={() => {
              handleViewCodes(dibbsVs);
            }}
          >
            <div className={styles.accordionExpandedInner}>
              <div className={styles.valueSetTemplate__checkboxWrapper}>
                <div className={styles.valueSetTemplate__checkboxWrapper}>
                  {areItemsFiltered ? (
                    <Tooltip<TooltipWrapperProps>
                      label={`This will only change these ${
                        dibbsVs.concepts.filter((c) => c.render).length
                      } code(s)`}
                      asCustom={TooltipWrapper}
                      position="left"
                    >
                      {checkboxToRender}
                    </Tooltip>
                  ) : (
                    checkboxToRender
                  )}
                </div>
              </div>

              <div className={styles.accordionBodyExpanded__right}>
                <div
                  className={styles.displayCount}
                  data-testid={`displayCount-${dibbsVs.valueSetId}`}
                >
                  {selectedCount} / {totalCount}
                </div>
                <Button
                  type={"button"}
                  secondary
                  data-testid={`viewCodes-${dibbsVs.valueSetId}`}
                  className={styles.viewCodesBtn}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    handleViewCodes(dibbsVs);
                  }}
                >
                  View codes
                </Button>
              </div>
            </div>
          </div>
        );
      })}
      <Drawer
        title={
          <Highlighter
            highlightClassName="searchHighlight"
            searchWords={[tableSearchFilter]}
            autoEscape={true}
            textToHighlight={curValueSet?.valueSetName ?? ""}
          />
        }
        subtitle={
          tableSearchFilter ? `Pre-filtered by "${tableSearchFilter}"` : ""
        }
        placeholder={VALUESET_DRAWER_SEARCH_PLACEHOLDER}
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

export default ConceptTypeAccordionBody;
