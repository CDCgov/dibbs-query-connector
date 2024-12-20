import { Checkbox } from "@trussworks/react-uswds";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { ConditionToValueSetGroupingMap } from "../utils";
import { ValueSetGrouping } from "@/app/query/components/customizeQuery/customizeQueryUtils";
import { formatDiseaseDisplay } from "../utils";
import { tallyConceptsForSingleValueSet } from "../utils";
import { DibbsConceptType } from "@/app/constants";
import Drawer from "@/app/query/designSystem/drawer/Drawer";
import React, { Dispatch, SetStateAction, useState } from "react";
import ConceptSelection from "./ConceptSelection";

type SelectionViewAccordionBodyProps = {
  id?: string;
  setValueSets: Dispatch<SetStateAction<ConditionToValueSetGroupingMap>>;
  conditionId: string;
  valueSetType: DibbsConceptType;
  valueSetsForType: ValueSetGrouping[];
};

/**
 * Fragment component to style out some of the accordion bodies
 * @param param0 - params
 * @param param0.valueSetType - DibbsValueSetType (labs, conditions, medications)
 * @param param0.valueSetsForType - ValueSets for a given ValueSetType
 * @param param0.handleCheckboxToggle - Listener event to handle a ValueSet inclusion/
 * exclusion check
 * @returns An accordion body component
 */
const SelectionViewAccordionBody: React.FC<SelectionViewAccordionBodyProps> = ({
  valueSetType,
  valueSetsForType,
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
    valueSetsForType.map((groupedVS) => {
      if (groupedVS.valueSetName === drawerTitle) {
        const groupVSNameAuthorSystem = `${groupedVS.valueSetName}:${groupedVS.author}:${groupedVS.system}`;
        setValueSets((prevState) => {
          prevState[conditionId][valueSetType][groupVSNameAuthorSystem] = {
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
      {valueSetsForType.map((vs) => {
        const selectedCount = tallyConceptsForSingleValueSet(vs, true);
        const totalCount = tallyConceptsForSingleValueSet(vs, false);
        const checked = vs.items[0].includeValueSet || selectedCount > 0;

        return (
          <div
            className={styles.accordionBodyExpanded}
            key={`${valueSetType}-${vs.valueSetName}`}
          >
            <div className={styles.accordionExpandedInner}>
              <Checkbox
                name={`checkbox-${vs.valueSetName}`}
                className={styles.valueSetTemplate__checkbox}
                label={checkboxLabel(vs.valueSetName, vs.author, vs.system)}
                onChange={(e) => {
                  e.stopPropagation();
                }}
                id={`${vs.valueSetName}-${valueSetType}`}
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
