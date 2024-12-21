import { Checkbox } from "@trussworks/react-uswds";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { ConditionToConceptTypeToValueSetGroupingMap } from "../utils";
import { formatDiseaseDisplay } from "../utils";
import { tallyConceptsForSingleValueSet } from "../utils";
import { DibbsConceptType } from "@/app/constants";
import Drawer from "@/app/query/designSystem/drawer/Drawer";
import React, { Dispatch, SetStateAction, useState } from "react";
import ConceptSelection from "./ConceptSelection";
import { VsGrouping } from "@/app/utils/valueSetTranslation";

type SelectionViewAccordionBodyProps = {
  id?: string;
  setValueSets: Dispatch<
    SetStateAction<ConditionToConceptTypeToValueSetGroupingMap>
  >;
  conditionId: string;
  activeConceptType: DibbsConceptType;
  activeVsGroupings: VsGrouping[];
};

/**
 * An accordion body fragment
 * @param param0 - params
 * @param param0.activeConceptType - the DibbsConceptType of the current accordion
 * @param param0.activeVsGroupings - the ValueSetGroupings associated
 * with the activeConceptTypes
 * @param param0.setValueSets - setter function the ValueSets to be built
 * @param param0.conditionId - the conditionId for the query in progress
 * @returns An accordion body component
 */
const SelectionViewAccordionBody: React.FC<SelectionViewAccordionBodyProps> = ({
  activeConceptType,
  activeVsGroupings,
  setValueSets,
  conditionId,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState<string>("");
  const [initialConcepts, setInitialConcepts] = useState<
    { code: string; display: string; include: boolean }[]
  >([]);

  const [currentConcepts, setCurrentConcepts] = useState<
    { code: string; display: string; include: boolean }[]
  >([]);

  const handleViewCodes = (
    vsName: string,
    concepts: { code: string; display: string; include: boolean }[],
  ) => {
    setDrawerTitle(vsName);
    setInitialConcepts([...concepts]);
    setCurrentConcepts([...concepts]);
    setIsDrawerOpen(true);
  };

  const handleConceptsChange = (
    updatedConcepts: { code: string; display: string; include: boolean }[],
  ) => {
    setCurrentConcepts(updatedConcepts);
  };

  const handleSaveChanges = () => {
    activeVsGroupings.map((groupedVS) => {
      if (groupedVS.valueSetName === drawerTitle) {
        const groupVSNameAuthorSystem = `${groupedVS.valueSetName}:${groupedVS.author}:${groupedVS.system}`;
        setValueSets((prevState) => {
          prevState[conditionId][activeConceptType][groupVSNameAuthorSystem] = {
            ...groupedVS,
            items: [{ ...groupedVS.items[0], concepts: currentConcepts }],
          };
          console.log("save state: ", prevState);
          return prevState;
        });
      }
    });
    setIsDrawerOpen(false);
  };

  return (
    <div>
      {activeVsGroupings.map((vs) => {
        const selectedCount = tallyConceptsForSingleValueSet(vs, true);
        const totalCount = tallyConceptsForSingleValueSet(vs, false);
        const checked = vs.items[0].includeValueSet || selectedCount > 0;

        return (
          <div
            className={styles.accordionBodyExpanded}
            key={`${activeConceptType}-${vs.valueSetName}`}
          >
            <div className={styles.accordionExpandedInner}>
              <Checkbox
                name={`checkbox-${vs.valueSetName}`}
                className={styles.valueSetTemplate__checkbox}
                label={checkboxLabel(vs.valueSetName, vs.author, vs.system)}
                onChange={(e) => {
                  e.stopPropagation();
                }}
                id={`${vs.valueSetName}-${activeConceptType}`}
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
                onClick={() =>
                  handleViewCodes(vs.valueSetName, vs.items[0].concepts)
                }
              >
                View Codes
              </div>
            </div>
          </div>
        );
      })}
      <Drawer
        title={drawerTitle}
        placeholder="Search by code or name"
        toastMessage="Valueset concepts have been successfully modified."
        codes={
          <ConceptSelection
            concepts={currentConcepts}
            onConceptsChange={handleConceptsChange}
          />
        }
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        initialState={initialConcepts}
        currentState={currentConcepts}
        onSave={handleSaveChanges}
      />
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
