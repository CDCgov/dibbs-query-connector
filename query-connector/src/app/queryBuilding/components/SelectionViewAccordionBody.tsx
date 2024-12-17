import { Checkbox } from "@trussworks/react-uswds";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { GroupedValueSet } from "@/app/query/components/customizeQuery/customizeQueryUtils";
import { formatDiseaseDisplay } from "../utils";
import { tallyConceptsForSingleValueSet } from "../utils";
import { DibbsValueSetType } from "@/app/constants";
import Drawer from "@/app/query/designSystem/drawer/Drawer";
import React, { useState } from "react";

type SelectionViewAccordionBodyProps = {
  id?: string;
  valueSetType: DibbsValueSetType;
  valueSetsForType: GroupedValueSet[];
  handleCheckboxToggle: (
    valueSetType: DibbsValueSetType,
    groupedValueSet: GroupedValueSet,
  ) => void;
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
  handleCheckboxToggle,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState<string>("");
  const [drawerCodes, setDrawerCodes] = useState<React.ReactNode>(null);

  const handleViewCodes = (
    vsName: string,
    concepts: { code: string; display: string; include: boolean }[],
  ) => {
    const allSelected = concepts.every((concept) => concept.include);

    const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      concepts.forEach((concept) => (concept.include = isChecked));
      setDrawerCodes(renderConcepts());
    };

    const toggleSingle = (
      e: React.ChangeEvent<HTMLInputElement>,
      conceptIndex: number,
    ) => {
      concepts[conceptIndex].include = e.target.checked;
      setDrawerCodes(renderConcepts());
    };

    const renderConcepts = () => (
      <div>
        <div className="display-flex padding-y-3">
          <Checkbox
            name="toggleAll"
            id="toggleAll"
            checked={allSelected}
            onChange={toggleAll}
            label={
              <div className="display-flex">
                <div className="width-15 font-sans-md text-bold flex-0">
                  Code
                </div>
                <div className="font-sans-md text-bold">Name</div>
              </div>
            }
          />
        </div>
        {concepts.map((concept, index) => (
          <div key={concept.code} className="display-flex padding-y-1">
            <Checkbox
              name={`checkbox-${concept.code}`}
              id={`checkbox-${concept.code}`}
              checked={concept.include}
              onChange={(e) => toggleSingle(e, index)}
              label={
                <div className="display-flex">
                  <div className="width-15 text-no-wrap">{concept.code}</div>
                  <div className="flex-fill">{concept.display}</div>
                </div>
              }
            />
          </div>
        ))}
      </div>
    );

    setDrawerTitle(`${vsName}`);
    setDrawerCodes(renderConcepts());
    setIsDrawerOpen(true);
  };
  return (
    <div>
      {valueSetsForType &&
        valueSetsForType.map((vs) => {
          const selectedCount = tallyConceptsForSingleValueSet(vs, true);
          const totalCount = tallyConceptsForSingleValueSet(vs, false);
          const checked =
            vs.items[0].includeValueSet || selectedCount == totalCount;

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
                    handleCheckboxToggle(valueSetType, vs);
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
        codes={drawerCodes}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
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
