import { Checkbox } from "@trussworks/react-uswds";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { formatDiseaseDisplay } from "../utils";
import { tallyConceptsForSingleValueSetGroup } from "../utils";
import React, { ChangeEvent, useState } from "react";
import ConceptSelection from "./ConceptSelection";
import Drawer from "@/app/query/designSystem/drawer/Drawer";
import {
  ConceptOption,
  VsGrouping,
  getNameAuthorSystemFromVSGrouping,
} from "@/app/utils/valueSetTranslation";
import classNames from "classnames";

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
  const [curVsGrouping, setCurVsGrouping] = useState<VsGrouping>();
  const [curConcepts, setCurConcepts] = useState<ConceptOption[]>([]);

  const handleViewCodes = (vs: VsGrouping) => {
    setCurVsGrouping(vs);
    setCurConcepts(vs.items.map((i) => i.concepts).flat());
    setIsDrawerOpen(true);
  };

  const handleConceptsChange = (updatedConcepts: ConceptOption[]) => {
    setCurConcepts(updatedConcepts);
  };

  const handleSaveChanges = () => {
    Object.values(activeVsGroupings).map((groupedVS) => {
      if (
        groupedVS.valueSetName === curVsGrouping?.valueSetName &&
        curConcepts
      ) {
        const activeVsName = getNameAuthorSystemFromVSGrouping(curVsGrouping);
        const updatedVsGrouping = structuredClone(curVsGrouping);
        updatedVsGrouping.items = [
          // assuming that name / author / system identifies a unique value set,
          // the new items array will only differ by the concepts
          { ...curVsGrouping.items[0], concepts: curConcepts },
        ];

        handleVsNameLevelUpdate(activeVsName)(updatedVsGrouping);
      }
    });
    setIsDrawerOpen(false);
  };

  function handleBulkToggle(e: ChangeEvent<HTMLInputElement>) {
    const vsGrouping = activeVsGroupings[e.target.id];
    const handleVsGroupingLevelUpdate = handleVsNameLevelUpdate(
      getNameAuthorSystemFromVSGrouping(vsGrouping),
    );
    const updatedGrouping = structuredClone(vsGrouping);
    updatedGrouping.items.map((i) => {
      return i.concepts.map((c) => (c.include = e.target.checked));
    });
    handleVsGroupingLevelUpdate(updatedGrouping);
  }

  return (
    <div>
      {Object.values(activeVsGroupings).map((vs) => {
        const selectedCount = tallyConceptsForSingleValueSetGroup(vs, true);
        const totalCount = tallyConceptsForSingleValueSetGroup(vs, false);
        const isMinusState =
          selectedCount !== totalCount && selectedCount !== 0;
        const checked =
          !!selectedCount && selectedCount == totalCount && selectedCount > 0;
        const vsLabel = getNameAuthorSystemFromVSGrouping(vs);

        return (
          <div className={styles.accordionBodyExpanded} key={vsLabel}>
            <div className={styles.accordionExpandedInner}>
              <Checkbox
                name={`checkbox-${vs.valueSetName}`}
                className={classNames(
                  styles.valueSetTemplate__checkbox,
                  isMinusState
                    ? styles.valueSetTemplate__checkbox__partial
                    : "",
                )}
                label={checkboxLabel(vs.valueSetName, vs.author, vs.system)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleBulkToggle(e);
                }}
                id={vsLabel}
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
      {curConcepts && curVsGrouping && (
        <Drawer
          title={curVsGrouping.valueSetName}
          placeholder="Search by code or name"
          toastMessage="Valueset concepts have been successfully modified."
          toRender={
            <ConceptSelection
              concepts={curConcepts}
              onConceptsChange={handleConceptsChange}
            />
          }
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSave={handleSaveChanges}
          renderData={curConcepts}
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
