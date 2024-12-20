import { Checkbox } from "@trussworks/react-uswds";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { formatDiseaseDisplay } from "../utils";
import { tallyConceptsForSingleValueSet } from "../utils";
import Drawer from "@/app/query/designSystem/drawer/Drawer";
import React, { useState } from "react";
import { VsGrouping } from "@/app/utils/valueSetTranslation";
import { DibbsConceptType } from "@/app/constants";

type SelectionViewAccordionBodyProps = {
  id?: string;
  activeConceptType: DibbsConceptType;
  activeVsGroupings: VsGrouping[];
  handleCheckboxToggle: (
    activeConceptType: DibbsConceptType,
    groupedValueSet: VsGrouping,
  ) => void;
};

/**
 * Fragment component to style out some of the accordion bodies
 * @param param0 - params
 * @param param0.activeConceptType - DibbsConceptType for display in this accordion
 * @param param0.activeVsGroupings - VsGroupings[] for display in this accordion
 * @param param0.handleCheckboxToggle - Listener event to handle a ValueSet inclusion/
 * exclusion check
 * @returns An accordion body component
 */
const SelectionViewAccordionBody: React.FC<SelectionViewAccordionBodyProps> = ({
  activeConceptType,
  activeVsGroupings,
  handleCheckboxToggle,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState<string>("");
  const [drawerCodes, setDrawerCodes] = useState<React.ReactNode>(null);

  const handleViewCodes = (vsName: string, codes: React.ReactNode) => {
    setDrawerTitle(`${vsName}`);
    setDrawerCodes(codes);
    setIsDrawerOpen(true);
  };

  return (
    <div>
      {activeVsGroupings &&
        activeVsGroupings.map((vs) => {
          const selectedCount = tallyConceptsForSingleValueSet(vs, true);
          const totalCount = tallyConceptsForSingleValueSet(vs, false);
          const checked =
            vs.items[0].includeValueSet || selectedCount == totalCount;

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
                    handleCheckboxToggle(activeConceptType, vs);
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
                    handleViewCodes(vs.valueSetName, <div>TODO</div>)
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
