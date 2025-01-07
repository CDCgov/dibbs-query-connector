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
import { DibbsValueSet } from "@/app/constants";
import Checkbox from "@/app/query/designSystem/checkbox/Checkbox";

type SelectionViewAccordionBodyProps = {
  id?: string;
  activeVsGroupings: { [vsNameAuthorSystem: string]: VsGrouping };
  handleVsNameLevelUpdate: (
    vsName: string,
  ) => (vsGrouping: VsGrouping) => (dibbsValueSets: DibbsValueSet[]) => void;
};

/**
 * An accordion body fragment
 * @param param0 - params
 * @param param0.activeVsGroupings - VsGroupings[] for display in this accordion
 * @param param0.handleVsNameLevelUpdate - curried state update function that
 * takes a VsName and generatesa ValueSet level update
 * @returns An accordion body component
 */
const SelectionViewAccordionBody: React.FC<SelectionViewAccordionBodyProps> = ({
  activeVsGroupings,
  handleVsNameLevelUpdate,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [hasDrawerChange, setHasDrawerChange] = useState(false);
  const [curVsGrouping, setCurVsGrouping] = useState<VsGrouping>();
  const [curConcepts, setCurConcepts] = useState<ConceptOption[]>([]);

  const handleViewCodes = (vs: VsGrouping) => {
    setCurVsGrouping(vs);
    setCurConcepts(vs.items.map((i) => i.concepts).flat());
    setIsDrawerOpen(true);
  };

  const handleConceptsChange = (
    updatedConcepts: ConceptOption[],
    updateBatchSave = true,
  ) => {
    if (curVsGrouping) {
      const activeVsName = getNameAuthorSystemFromVSGrouping(curVsGrouping);
      const shouldIncludeValueSet = updatedConcepts
        .map((c) => c.include)
        .some(Boolean);
      curVsGrouping.items = [
        // assuming that name / author / system identifies a unique value set,
        // the new items array will only differ by concepts
        {
          ...curVsGrouping.items[0],
          includeValueSet: shouldIncludeValueSet,
          concepts: updatedConcepts,
        },
      ];

      if (updateBatchSave) {
        handleVsNameLevelUpdate(activeVsName)(curVsGrouping)(
          curVsGrouping.items,
        );
      }
      console.log(curVsGrouping);

      setCurConcepts(updatedConcepts);
      setHasDrawerChange(true);
    }
  };

  const handleSaveChanges = () => {
    Object.values(activeVsGroupings).map((groupedVS) => {
      if (
        groupedVS.valueSetName === curVsGrouping?.valueSetName &&
        curConcepts
      ) {
        const activeVsName = getNameAuthorSystemFromVSGrouping(curVsGrouping);
        const updatedVsGrouping = structuredClone(curVsGrouping);
        const shouldIncludeValueSet = curConcepts
          .map((c) => c.include)
          .some(Boolean);
        updatedVsGrouping.items = [
          // assuming that name / author / system identifies a unique value set,
          // the new items array will only differ by the concepts
          {
            ...curVsGrouping.items[0],
            includeValueSet: shouldIncludeValueSet,
            concepts: curConcepts,
          },
        ];

        handleVsNameLevelUpdate(activeVsName)(updatedVsGrouping);
      }
    });
    setIsDrawerOpen(false);
  };

  function handleBulkToggle(
    e: ChangeEvent<HTMLInputElement>,
    isMinusState: boolean,
  ) {
    const vsGrouping = structuredClone(activeVsGroupings[e.target.id]);
    const activeVsName = getNameAuthorSystemFromVSGrouping(vsGrouping);
    const handleValueSetLevelUpdate =
      handleVsNameLevelUpdate(activeVsName)(vsGrouping);

    const newConcepts = vsGrouping.items
      .map((i) => {
        return i.concepts.map((c) => {
          return {
            ...c,
            include: isMinusState ? false : e.target.checked,
          };
        });
      })
      .flat();

    handleValueSetLevelUpdate([
      { ...vsGrouping.items[0], concepts: newConcepts },
    ]);
  }

  return (
    <div>
      {Object.values(activeVsGroupings).map((vs) => {
        const selectedCount = tallyConceptsForSingleValueSetGroup(vs, true);
        const totalCount = tallyConceptsForSingleValueSetGroup(vs, false);
        const isMinusState =
          selectedCount !== totalCount && selectedCount !== 0;
        const checked = selectedCount == totalCount && selectedCount > 0;
        const vsLabel = getNameAuthorSystemFromVSGrouping(vs);

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
