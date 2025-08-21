"use client";
import {
  Dispatch,
  JSX,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import styles from "../../buildFromTemplates/conditionTemplateSelection.module.scss";
import { HeadingLevel } from "@trussworks/react-uswds";
import ConceptTypeAccordionBody from "../ConceptTypeAccordionBody";
import { ConceptTypeToDibbsVsMap } from "@/app/utils/valueSetTranslation";
import ConceptTypeAccordionHeader from "../ConceptTypeAccordionHeader";
import MultiAccordion from "@/app/ui/designSystem/MultiAccordion";
import { filterVsTypeOptions } from "../utils";
import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";
import { getQueryTimeboxRanges } from "@/app/backend/query-timefiltering";
import { DataContext } from "@/app/utils/DataProvider";
import { DateRangeInfo } from "@/app/ui/designSystem/timeboxing/DateRangePicker";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

type ConceptSelectionViewProps = {
  vsTypeLevelOptions: ConceptTypeToDibbsVsMap;
  handleVsTypeLevelUpdate: (
    vsType: DibbsConceptType,
  ) => (vsId: string) => (dibbsValueSets: DibbsValueSet) => void;
  searchFilter: string;
  setSearchFilter: Dispatch<SetStateAction<string>>;
};

type VsTypeAccordion = {
  title: JSX.Element;
  content: JSX.Element;
  expanded: boolean;
  id: string;
  headingLevel: HeadingLevel;
  handleToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  atLeastOneRenderedValueSet: boolean;
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
export const ConceptSelectionView: React.FC<ConceptSelectionViewProps> = ({
  vsTypeLevelOptions,
  handleVsTypeLevelUpdate,
  searchFilter,
}) => {
  const [curExpanded, setCurExpanded] = useState<string>("");
  const [accordionItems, setAccordionItems] = useState<VsTypeAccordion[]>([]);
  const [timeboxRanges, setTimeboxRanges] = useState<
    Partial<{
      [conceptType in DibbsConceptType]: DateRangeInfo | undefined;
    }>
  >({});

  const queryContext = useContext(DataContext);
  const queryId = queryContext?.selectedQuery?.queryId;

  useEffect(() => {
    async function fetchInitialRanges() {
      if (!queryId) return;
      const initialTimeboxes = await getQueryTimeboxRanges(queryId);
      setTimeboxRanges(initialTimeboxes);
    }

    fetchInitialRanges();
  }, []);

  const generateTypeLevelAccordions = (
    vsTypeLevelOptions: ConceptTypeToDibbsVsMap,
    searchFilter: string,
  ) => {
    if (!queryId) {
      showToastConfirmation({
        heading: "Query ID not set",
        body: "Something went wrong unexpectedly. Please try again or contact us if the issue persists",
        variant: "error",
      });
      return [];
    }

    const accordionDataToDisplay = filterVsTypeOptions(
      vsTypeLevelOptions,
      searchFilter,
    );

    const areItemsFiltered = searchFilter !== "";

    return Object.entries(accordionDataToDisplay).map(
      ([k, valueSetsInType]) => {
        const atLeastOneRenderedValueSet = Object.values(valueSetsInType)
          .map((vs) => vs.render)
          .flat()
          .some(Boolean);

        const vsType = k as DibbsConceptType;
        const updateConceptTimebox = (newTimebox: DateRangeInfo) =>
          setTimeboxRanges((prev) => {
            return {
              ...prev,
              [vsType]: newTimebox,
            };
          });

        const handleVsNameLevelUpdate = handleVsTypeLevelUpdate(vsType);
        let initialTimeboxRange = undefined;
        if (timeboxRanges && timeboxRanges[vsType]) {
          const conceptTimeboxRange = timeboxRanges[vsType];

          initialTimeboxRange = {
            startDate: conceptTimeboxRange.startDate,
            endDate: conceptTimeboxRange.endDate,
            isRelativeRange: conceptTimeboxRange.isRelativeRange,
          };
        }
        const title = (
          <ConceptTypeAccordionHeader
            activeType={vsType}
            activeTypeValueSets={valueSetsInType}
            expanded={curExpanded === vsType}
            areItemsFiltered={areItemsFiltered}
            initialTimeboxRange={initialTimeboxRange}
          />
        );

        const content = (
          <ConceptTypeAccordionBody
            updateTimeboxRange={updateConceptTimebox}
            accordionConceptType={vsType}
            activeValueSets={valueSetsInType}
            handleVsNameLevelUpdate={handleVsNameLevelUpdate}
            handleVsIdLevelUpdate={handleVsNameLevelUpdate}
            tableSearchFilter={searchFilter}
            initialTimeboxRange={initialTimeboxRange}
          />
        );
        const level: HeadingLevel = "h2";

        const handleToggle = () => {
          setCurExpanded((prevState) => {
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
          atLeastOneRenderedValueSet,
        };
      },
    );
  };

  useEffect(() => {
    const accordions = generateTypeLevelAccordions(
      vsTypeLevelOptions,
      searchFilter,
    );
    setAccordionItems(accordions);
  }, [vsTypeLevelOptions, searchFilter, curExpanded, timeboxRanges]);

  const accordionsToRender = accordionItems.filter(
    (i) => i.atLeastOneRenderedValueSet,
  );

  return accordionsToRender.length > 0 ? (
    <div
      data-testid="accordion-container"
      className={styles.accordionContainer}
    >
      <MultiAccordion
        items={accordionsToRender}
        multiselectable={false}
        accordionClassName={styles.accordionInnerWrapper}
      />
    </div>
  ) : null;
};
