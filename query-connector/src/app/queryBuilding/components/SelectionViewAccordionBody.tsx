import { Checkbox } from "@trussworks/react-uswds";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { ConditionToConceptTypeToValueSetGroupingMap } from "../utils";
import { formatDiseaseDisplay } from "../utils";
import { tallyConceptsForSingleValueSet } from "../utils";
import React, { Dispatch, SetStateAction, useState } from "react";
import ConceptSelection from "./ConceptSelection";
import Drawer from "@/app/query/designSystem/drawer/Drawer";
import {
  ConceptOption,
  VsGrouping,
  getNameAuthorSystemFromVSGrouping,
} from "@/app/utils/valueSetTranslation";
import { DibbsConceptType } from "@/app/constants";

type SelectionViewAccordionBodyProps = {
  id?: string;
  activeVsGroupings: { [vsNameAuthorSystem: string]: VsGrouping };
  handleVsNameLevelUpdate: (vsName: string) => (val: VsGrouping) => void;
};

/**
 * An accordion body fragment
 * @param param0 - params
 * @param param0.activeVsGroupings - VsGroupings[] for display in this accordion
 * @param param0.setSelectedValueSets
 * @param param0.conditionId
 * @returns An accordion body component
 */
const SelectionViewAccordionBody: React.FC<SelectionViewAccordionBodyProps> = ({
  activeVsGroupings,
  handleVsNameLevelUpdate,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeVsGrouping, setActiveVsGrouping] = useState<VsGrouping>();
  const [curConcepts, setCurConcepts] = useState<ConceptOption[]>();

  const handleViewCodes = (vs: VsGrouping) => {
    setActiveVsGrouping(vs);
    setCurConcepts(vs.items.map((i) => i.concepts).flat());
    setIsDrawerOpen(true);
  };

  const handleConceptsChange = (updatedConcepts: ConceptOption[]) => {
    setCurConcepts(updatedConcepts);
  };

  const handleSaveChanges = () => {
    Object.values(activeVsGroupings).map((groupedVS) => {
      if (
        groupedVS.valueSetName === activeVsGrouping?.valueSetName &&
        curConcepts
      ) {
        const activeVsName =
          getNameAuthorSystemFromVSGrouping(activeVsGrouping);
        const updatedVsGrouping = structuredClone(activeVsGrouping);
        updatedVsGrouping.items = [
          { ...activeVsGrouping.items[0], concepts: curConcepts },
        ];

        console.log(updatedVsGrouping);
        handleVsNameLevelUpdate(activeVsName)(updatedVsGrouping);
      }
    });
    setIsDrawerOpen(false);
  };

  return (
    <div>
      {Object.values(activeVsGroupings).map((vs) => {
        const selectedCount = tallyConceptsForSingleValueSet(vs, true);
        const totalCount = tallyConceptsForSingleValueSet(vs, false);
        const checked = vs.items[0].includeValueSet || selectedCount > 0;

        return (
          <div
            className={styles.accordionBodyExpanded}
            key={`${vs.valueSetName}`}
          >
            <div className={styles.accordionExpandedInner}>
              <Checkbox
                name={`checkbox-${vs.valueSetName}`}
                className={styles.valueSetTemplate__checkbox}
                label={checkboxLabel(vs.valueSetName, vs.author, vs.system)}
                onChange={(e) => {
                  e.stopPropagation();
                }}
                id={`${vs.valueSetName}`}
                checked={checked}
              />
            </div>
            <div className={styles.accordionBodyExpanded__right}>
              <div className={styles.displayCount}>
                {selectedCount}/{totalCount}
              </div>
              <div
                className={styles.viewCodesBtn}
                role="button"
                onClick={() => handleViewCodes(vs)}
              >
                View Codes
              </div>
            </div>
          </div>
        );
      })}
      {curConcepts && activeVsGrouping && (
        <Drawer
          title={activeVsGrouping.valueSetName}
          placeholder="Search by code or name"
          toastMessage="Valueset concepts have been successfully modified."
          codes={
            <ConceptSelection
              concepts={curConcepts}
              onConceptsChange={handleConceptsChange}
            />
          }
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSave={handleSaveChanges}
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
