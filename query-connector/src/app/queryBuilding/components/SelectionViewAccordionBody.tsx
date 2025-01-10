import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { formatDiseaseDisplay } from "../utils";
import { tallyConceptsForSingleValueSet } from "../utils";
import React, { ChangeEvent, useState } from "react";
import ConceptSelection from "./ConceptSelection";
import Drawer from "@/app/query/designSystem/drawer/Drawer";
import { Concept, DibbsValueSet } from "@/app/constants";
import Checkbox from "@/app/query/designSystem/checkbox/Checkbox";

type SelectionViewAccordionBodyProps = {
  id?: string;
  activeTypeValueSets: { [vsId: string]: DibbsValueSet };
  handleVsIdLevelUpdate: (vsId: string) => (vs: DibbsValueSet) => void;
};

/**
 * An accordion body fragment
 * @param param0 - params
 * @param param0.activeTypeValueSets - VsGroupings[] for display in this accordion
 * @param param0.handleVsIdLevelUpdate - curried state update function that
 * takes a VsName and generatesa ValueSet level update
 * @returns An accordion body component
 */
const SelectionViewAccordionBody: React.FC<SelectionViewAccordionBodyProps> = ({
  activeTypeValueSets,
  handleVsIdLevelUpdate,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasDrawerChange, setHasDrawerChange] = useState(false);
  const [curValueSet, setCurValueSet] = useState<DibbsValueSet>();
  const [curConcepts, setCurConcepts] = useState<Concept[]>([]);

  const handleViewCodes = (vs: DibbsValueSet) => {
    setCurValueSet(vs);
    setCurConcepts(vs.concepts.flat());
    setIsDrawerOpen(true);
  };

  const handleConceptsChange = (
    updatedConcepts: Concept[],
    updateBatchSave = true,
  ) => {
    if (curValueSet) {
      const activeVsId = curValueSet.valueSetId;
      curValueSet.concepts = updatedConcepts;

      if (updateBatchSave) {
        handleVsIdLevelUpdate(activeVsId)(curValueSet);
      }
      setCurConcepts(updatedConcepts);
      setHasDrawerChange(true);
    }
  };

  const handleSaveChanges = () => {
    Object.values(activeTypeValueSets).map((valueSet) => {
      if (valueSet.valueSetName === curValueSet?.valueSetName && curConcepts) {
        const activeVsId = curValueSet.valueSetId;
        const updatedValueSet = structuredClone(curValueSet);
        updatedValueSet.concepts = curConcepts;

        handleVsIdLevelUpdate(activeVsId)(updatedValueSet);
      }
    });
    setIsDrawerOpen(false);
  };

  function handleBulkToggle(
    e: ChangeEvent<HTMLInputElement>,
    isMinusState: boolean,
  ) {
    const activeVs = structuredClone(activeTypeValueSets[e.target.id]);
    const activeVsId = activeVs.valueSetId;
    const handleValueSetUpdate = handleVsIdLevelUpdate(activeVsId);

    const newConcepts = activeVs.concepts
      .map((c) => {
        return {
          ...c,
          include: isMinusState ? false : e.target.checked,
        };
      })
      .flat();

    handleValueSetUpdate({ ...activeVs, concepts: newConcepts });
  }

  return (
    <div>
      {Object.values(activeTypeValueSets).map((vs) => {
        const selectedCount = tallyConceptsForSingleValueSet(vs, true);
        const totalCount = tallyConceptsForSingleValueSet(vs, false);
        const isMinusState =
          selectedCount !== totalCount && selectedCount !== 0;
        const checked = selectedCount == totalCount && selectedCount > 0;
        const vsLabel = vs.valueSetId;

        return (
          <div className={styles.accordionBodyExpanded} key={vsLabel}>
            <div className={styles.accordionExpandedInner}>
              <Checkbox
                className={styles.valueSetTemplate__checkbox}
                label={checkboxLabel(vs.valueSetName, vs.author, vs.system)}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  handleBulkToggle(e, isMinusState);
                }}
                id={vsLabel}
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
                  handleViewCodes(vs);
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

const checkboxLabel = (name: string, author: string, system: string) => {
  return (
    <div className={styles.expandedContent}>
      <div className={styles.vsName}> {formatDiseaseDisplay(name)}</div>
      <div className={styles.vsDetails}>
        <div className="padding-right-2">{`Author: ${author}`}</div>
        <div>{`System: ${system.toLocaleLowerCase()}`}</div>
      </div>
    </div>
  );
};

export default SelectionViewAccordionBody;
