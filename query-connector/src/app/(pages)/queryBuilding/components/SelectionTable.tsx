"use client";
import { useEffect, useState } from "react";
import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { HeadingLevel } from "@trussworks/react-uswds";
import ConceptTypeAccordionBody from "./SelectionViewAccordionBody";
import { DibbsConceptType, DibbsValueSet } from "@/app/shared/constants";
import { ConceptTypeToDibbsVsMap } from "@/app/utils/valueSetTranslation";
import ConceptTypeAccordionHeader from "./SelectionViewAccordionHeader";
import MultiAccordion from "@/app/ui/designSystem/MultiAccordion";

type ConceptTypeSelectionTableProps = {
  vsTypeLevelOptions: ConceptTypeToDibbsVsMap;
  handleVsTypeLevelUpdate: (
    vsType: DibbsConceptType,
  ) => (vsId: string) => (dibbsValueSets: DibbsValueSet) => void;
  searchFilter: string;
};

/**
 * Component that displays ValueSetGroupings sorted by VsType (DibbsConceptType)
 * for the active condition selected
 * @param root0 - params
 * @param root0.searchFilter - the string set in the search field to filter options by
 * @param root0.vsTypeLevelOptions - the valueSets that are currently in the in-progress query
 * @param root0.handleVsTypeLevelUpdate - curried state update function that
 * takes a VsType and generates a VsName level setter function
 * @returns A component for display to render on the query building page
 */
export const ConceptTypeSelectionTable: React.FC<
  ConceptTypeSelectionTableProps
> = ({ vsTypeLevelOptions, handleVsTypeLevelUpdate, searchFilter }) => {
  const [expanded, setExpandedGroup] = useState<string>("");
  const [valueSetDisplay, setValueSetDisplay] =
    useState<ConceptTypeToDibbsVsMap>(vsTypeLevelOptions);

  useEffect(() => {
    const casedSearchFilter = searchFilter.toLocaleLowerCase();

    const filteredValueSets = structuredClone(vsTypeLevelOptions);

    Object.entries(filteredValueSets).forEach(([vsType, vsDict]) => {
      Object.entries(vsDict).forEach(([vsId, vs]) => {
        if (vs.valueSetName.toLocaleLowerCase().includes(casedSearchFilter)) {
          filteredValueSets[vsType as DibbsConceptType][vsId] = vs;
        } else {
          vs.concepts = vs.concepts.filter(
            (c) =>
              c.code.toLocaleLowerCase().includes(casedSearchFilter) ||
              c.display.toLocaleLowerCase().includes(casedSearchFilter),
          );

          if (vs.concepts.length > 0) {
            filteredValueSets[vsType as DibbsConceptType][vsId] = vs;
          }
        }
      });
    });

    setValueSetDisplay(filteredValueSets);
  }, [searchFilter]);

  const generateTypeLevelAccordionItems = (vsType: DibbsConceptType) => {
    const handleVsNameLevelUpdate = handleVsTypeLevelUpdate(vsType);

    const title = (
      <ConceptTypeAccordionHeader
        activeType={vsType}
        activeTypeValueSets={valueSetDisplay[vsType]}
        expanded={expanded === vsType}
        handleVsNameLevelUpdate={handleVsNameLevelUpdate}
      />
    );

    const content = (
      <ConceptTypeAccordionBody
        activeValueSets={valueSetDisplay[vsType]}
        handleVsIdLevelUpdate={handleVsNameLevelUpdate}
      />
    );
    const level: HeadingLevel = "h4";

    const handleToggle = () => {
      setExpandedGroup((prevState) => {
        if (prevState === vsType) return "";
        return vsType;
      });
    };

    return {
      title,
      content,
      expanded: false,
      id: `${vsType}`,
      headingLevel: level,
      handleToggle,
      length: Object.keys(vsTypeLevelOptions[vsType]).length,
    };
  };

  const accordionItems = Object.keys(vsTypeLevelOptions)
    .map((vsType) => {
      return generateTypeLevelAccordionItems(vsType as DibbsConceptType);
    })
    .filter((v) => v.length > 0);

  return (
    <div data-testid="accordion" className={styles.accordionContainer}>
      <MultiAccordion
        items={accordionItems}
        multiselectable={false}
        accordionClassName={styles.accordionInnerWrapper}
      />
    </div>
  );
};
