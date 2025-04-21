"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@trussworks/react-uswds";
import LoadingView from "../../../ui/designSystem/LoadingView";
import { showToastConfirmation } from "../../../ui/designSystem/toast/Toast";
import styles from "./customizeQuery/customizeQuery.module.scss";
import CustomizeQueryAccordionHeader from "./customizeQuery/CustomizeQueryAccordionHeader";
import CustomizeQueryAccordionBody from "./customizeQuery/CustomizeQueryAccordionBody";
import Accordion from "../../../ui/designSystem/Accordion";
import CustomizeQueryNav from "./customizeQuery/CustomizeQueryNav";
import Backlink from "../../../ui/designSystem/backLink/Backlink";
import { RETURN_LABEL } from "./stepIndicator/StepIndicator";
import { generateValueSetGroupingsByDibbsConceptType } from "@/app/utils/valueSetTranslation";
import { CustomUserQuery } from "@/app/models/entities/query";
import {
  DibbsValueSet,
  DibbsConceptType,
} from "@/app/models/entities/valuesets";

interface CustomizeQueryProps {
  queryValueSets: DibbsValueSet[];
  setQueryValuesets: (queryVS: DibbsValueSet[]) => void;
  goBack: () => void;
  selectedQuery: CustomUserQuery;
}

/**
 * CustomizeQuery component for displaying and customizing query details.
 * @param root0 - The properties object.
 * @param root0.selectedQuery - The current query to be customized.
 * @param root0.queryValueSets - The pre-fetched value sets from the DB.
 * @param root0.setQueryValuesets - Function to update tracked custom query state.
 * @param root0.goBack - Back button to go from "customize-queries" to "search" component.
 * @returns The CustomizeQuery component.
 */
const CustomizeQuery: React.FC<CustomizeQueryProps> = ({
  queryValueSets,
  setQueryValuesets,
  goBack,
  selectedQuery,
}) => {
  const [activeTab, setActiveTab] = useState<DibbsConceptType>("labs");

  const [valueSetOptions, setValueSetOptions] = useState<{
    [dibbsConceptType in DibbsConceptType]: {
      [vsId: string]: DibbsValueSet;
    };
  }>({
    labs: {},
    conditions: {},
    medications: {},
  });

  useEffect(() => {
    const { labs, conditions, medications } =
      generateValueSetGroupingsByDibbsConceptType(queryValueSets);

    setValueSetOptions({
      labs: labs,
      conditions: conditions,
      medications: medications,
    });
  }, [queryValueSets]);

  // Compute counts of each tab-type
  const countLabs = valueSetOptions.labs
    ? countDibbsConceptTypeToVsMapItems(valueSetOptions.labs)
    : 0;
  const countConditions = valueSetOptions.conditions
    ? countDibbsConceptTypeToVsMapItems(valueSetOptions.conditions)
    : 0;
  const countMedications = valueSetOptions.medications
    ? countDibbsConceptTypeToVsMapItems(valueSetOptions.medications)
    : 0;

  // Keeps track of which side nav tab to display to users
  const handleTabChange = (tab: DibbsConceptType) => {
    setActiveTab(tab);
  };

  // Handles the toggle of the 'include' state for individual concepts in
  // the accordion
  const toggleInclude = (vsId: string, conceptIndex: number) => {
    const updatedIdToVsMap = valueSetOptions[activeTab];
    let updatedValueSet = updatedIdToVsMap[vsId];
    const updatedConcepts = updatedValueSet.concepts;
    updatedConcepts[conceptIndex] = {
      ...updatedConcepts[conceptIndex],
      include: !updatedConcepts[conceptIndex].include, // Toggle the include for the clicked concept
    };

    updatedValueSet = {
      ...updatedValueSet,
      includeValueSet: updatedConcepts.map((c) => c.include).some(Boolean),
      concepts: updatedConcepts, // Update the concepts in the accessed value set
    };

    updatedIdToVsMap[vsId] = updatedValueSet;

    setValueSetOptions((prevState) => ({
      ...prevState,
      [activeTab]: updatedIdToVsMap, // Update the state with the modified VS
    }));
  };

  // Allows all items to be selected within all accordion sections of the active tab
  const handleSelectAllChange = (vsId: string, checked: boolean) => {
    const updatedIdToVsMap = valueSetOptions[activeTab]; // a single group of lab/med/etc.
    // Update only the group at the specified index
    updatedIdToVsMap[vsId].includeValueSet = checked;
    const updatedConcepts = updatedIdToVsMap[vsId].concepts.map((concept) => {
      return { ...concept, include: checked };
    });
    updatedIdToVsMap[vsId].concepts = updatedConcepts;

    setValueSetOptions((prevState) => ({
      ...prevState,
      [activeTab]: updatedIdToVsMap, // Update the state for the current tab
    }));
  };

  // Allows all items to be selected within the entire active tab
  const handleSelectAllForTab = (checked: boolean) => {
    const activeItems = valueSetOptions[activeTab] ?? {};
    const updatedValueSets = Object.values(activeItems).map((vs) => {
      const updatedValueSetData = {
        includeValueSet: checked, // Set all items in this group to checked or unchecked
        concepts: vs.concepts.map((concept) => {
          return { ...concept, include: checked };
        }),
      };
      return {
        ...vs,
        ...updatedValueSetData,
      };
    });

    setValueSetOptions((prevState) => ({
      ...prevState,
      [activeTab]: updatedValueSets, // Update the state for the current tab
    }));
  };

  // Persist the changes made on this page to the valueset state maintained
  // by the entire query branch of the app
  const handleApplyChanges = () => {
    const selectedItems = Object.keys(valueSetOptions).reduce((acc, key) => {
      const nameToVs = valueSetOptions[key as DibbsConceptType] ?? {};
      acc = acc.concat(Object.values(nameToVs));
      return acc;
    }, [] as DibbsValueSet[]);
    setQueryValuesets(selectedItems);
    goBack();
    showToastConfirmation({
      body: QUERY_CUSTOMIZATION_CONFIRMATION_BODY,
    });
  };

  const valueSetOptionsToDisplay =
    valueSetOptions && valueSetOptions[activeTab]
      ? Object.entries(valueSetOptions[activeTab])
      : [];

  return (
    <div>
      <div className="padding-top-3">
        <Backlink onClick={goBack} label={RETURN_LABEL["results"]} />
      </div>
      <LoadingView loading={!queryValueSets} />
      <h1 className="page-title margin-bottom-05-important">Customize query</h1>
      <h2 className="page-explainer margin-y-0-important">
        Query: {selectedQuery.query_name}
      </h2>
      <h3 className="margin-y-0-important font-sans-sm text-light padding-bottom-0 padding-top-05">
        {countLabs} labs found, {countMedications} medications found,{" "}
        {countConditions} conditions found.
      </h3>

      <CustomizeQueryNav
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        handleSelectAllForTab={handleSelectAllForTab}
        valueSetOptions={valueSetOptions}
      />
      {valueSetOptionsToDisplay.map(([vsId, vs]) => {
        const id = vs.author + ":" + vs.system + ":" + vs.valueSetName;
        return (
          <Accordion
            key={id}
            id={id}
            title={
              <CustomizeQueryAccordionHeader
                handleSelectAllChange={handleSelectAllChange}
                vsIndex={vsId}
                valueSet={vs}
              />
            }
            content={
              <CustomizeQueryAccordionBody
                valueSet={vs}
                toggleInclude={toggleInclude}
                vsName={vsId}
              />
            }
            headingLevel="h3"
            accordionClassName={`customize-accordion ${styles.customizeQueryAccordion}`}
            containerClassName={styles.resultsContainer}
          />
        );
      })}
      <div className="button-container">
        <Button type="button" onClick={handleApplyChanges}>
          Apply changes
        </Button>
        <Button type="button" outline onClick={() => goBack()}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default CustomizeQuery;
export const QUERY_CUSTOMIZATION_CONFIRMATION_BODY =
  "Query customization successful!";

/**
 * Utility function to count the number of labs / meds / conditions that we display
 * on the customize query page
 * @param obj a grouped ValueSet dictionary that we render as an individual accordion
 * @returns A count of the number of items in each of the DibbsConceptTypes
 */
const countDibbsConceptTypeToVsMapItems = (obj: {
  [vsId: string]: DibbsValueSet;
}) => {
  return Object.values(obj).reduce((runningSum, vs) => {
    runningSum += vs.concepts.length;
    return runningSum;
  }, 0);
};
