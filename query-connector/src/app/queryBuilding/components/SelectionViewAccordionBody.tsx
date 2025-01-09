import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import React, { ChangeEvent, useState } from "react";
import ConceptSelection from "./ConceptSelection";
import Drawer from "@/app/query/designSystem/drawer/Drawer";
import { ConceptOption } from "@/app/utils/valueSetTranslation";
import { DibbsValueSet } from "@/app/constants";
import Checkbox from "@/app/query/designSystem/checkbox/Checkbox";

type ConceptTypeAccordionBodyProps = {
  activeValueSets: { [vsId: string]: DibbsValueSet };
  handleVsIdLevelUpdate: (
    vsId: string,
  ) => (dibbsValueSets: DibbsValueSet) => void;
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
  const [hasDrawerChange, setHasDrawerChange] = useState(false);
  const [curValueSet, setCurValueSet] = useState<DibbsValueSet>();
  const [curConcepts, setCurConcepts] = useState<ConceptOption[]>([]);

  const handleViewCodes = (vs: DibbsValueSet) => {
    setCurValueSet(vs);
    setCurConcepts(vs.concepts);
    setIsDrawerOpen(true);
  };

  const handleConceptsChange = (
    updatedConcepts: ConceptOption[],
    updateBatchSave = true,
  ) => {
    if (curValueSet) {
      const shouldIncludeValueSet = updatedConcepts
        .map((c) => c.include)
        .some(Boolean);
      curValueSet.includeValueSet = shouldIncludeValueSet;
      curValueSet.concepts = updatedConcepts;

      if (updateBatchSave) {
        handleVsIdLevelUpdate(curValueSet.valueSetId)(curValueSet);
      }

      setCurConcepts(updatedConcepts);
      setHasDrawerChange(true);
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
              />
            </div>
            <div className={styles.accordionBodyExpanded__right}>
              <div className={styles.displayCount}>
                {selectedCount}/{totalCount}
              </div>
              <div
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
      {curConcepts && curValueSet && (
        <Drawer
          title={curValueSet.valueSetName}
          placeholder="Search by code or name"
          toastMessage="Valueset concepts have been successfully modified."
          toRender={
            <ConceptSelection
              concepts={curConcepts}
              onConceptsChange={handleConceptsChange}
            />
          }
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false), setHasDrawerChange(false);
          }}
          onSave={handleSaveChanges}
          hasChanges={hasDrawerChange}
        />
      )}
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

export default ConceptTypeAccordionBody;
