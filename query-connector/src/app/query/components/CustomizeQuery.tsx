"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@trussworks/react-uswds";
import {
  DibbsConceptType,
  USE_CASES,
  USE_CASE_DETAILS,
  DibbsValueSet,
} from "../../constants";
import { UseCaseQueryResponse } from "@/app/query-service";
import LoadingView from "./LoadingView";
import { showToastConfirmation } from "../designSystem/toast/Toast";
import styles from "./customizeQuery/customizeQuery.module.scss";
import CustomizeQueryAccordionHeader from "./customizeQuery/CustomizeQueryAccordionHeader";
import CustomizeQueryAccordionBody from "./customizeQuery/CustomizeQueryAccordionBody";
import Accordion from "../designSystem/Accordion";
import CustomizeQueryNav from "./customizeQuery/CustomizeQueryNav";
import Backlink from "./backLink/Backlink";
import { RETURN_LABEL } from "./stepIndicator/StepIndicator";
import { generateValueSetGroupingsByDibbsConceptType } from "@/app/utils/valueSetTranslation";

interface CustomizeQueryProps {
  useCaseQueryResponse: UseCaseQueryResponse;
  queryType: USE_CASES;
  queryValueSets: DibbsValueSet[];
  setQueryValuesets: (queryVS: DibbsValueSet[]) => void;
  goBack: () => void;
}

/**
 * CustomizeQuery component for displaying and customizing query details.
 * @param root0 - The properties object.
 * @param root0.useCaseQueryResponse - The response from the query service.
 * @param root0.queryType - The type of the query.
 * @param root0.queryValueSets - The pre-fetched value sets from the DB.
 * @param root0.setQueryValuesets - Function to update tracked custom query state.
 * @param root0.goBack - Back button to go from "customize-queries" to "search" component.
 * @returns The CustomizeQuery component.
 */
const CustomizeQuery: React.FC<CustomizeQueryProps> = ({
  useCaseQueryResponse,
  queryType,
  queryValueSets: queryValueSets,
  setQueryValuesets,
  goBack,
}) => {
  const [activeTab, setActiveTab] = useState<DibbsConceptType>("labs");

  const [valueSetOptions, setValueSetOptions] = useState<{
    [dibbsConceptType in DibbsConceptType]: {
      [vsNameAuthorSystem: string]: DibbsValueSet;
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
  const toggleInclude = (vsNameAuthorSystem: string, conceptIndex: number) => {
    const updatedNameToVsMap = valueSetOptions[activeTab];
    let updatedValueSet = updatedNameToVsMap[vsNameAuthorSystem];
    const updatedConcepts = updatedValueSet.concepts;
    updatedConcepts[conceptIndex] = {
      ...updatedConcepts[conceptIndex],
      include: !updatedConcepts[conceptIndex].include, // Toggle the include for the clicked concept
    };

    updatedValueSet = {
      ...updatedValueSet,
      concepts: updatedConcepts, // Update the concepts in the accessed value set
    };

    updatedNameToVsMap[vsNameAuthorSystem] = {
      ...updatedNameToVsMap[vsNameAuthorSystem],
      ...updatedValueSet, // Update the entire VS
    };

    setValueSetOptions((prevState) => ({
      ...prevState,
      [activeTab]: updatedNameToVsMap, // Update the state with the modified VS
    }));
  };

  // Allows all items to be selected within all accordion sections of the active tab
  const handleSelectAllChange = (
    vsNameAuthorSystem: string,
    checked: boolean,
  ) => {
    const updatedNameToVsMap = valueSetOptions[activeTab]; // a single group of lab/med/etc.
    // Update only the group at the specified index
    updatedNameToVsMap[vsNameAuthorSystem].includeValueSet = checked;
    const updatedConcepts = updatedNameToVsMap[vsNameAuthorSystem].concepts.map(
      (concept) => {
        return { ...concept, include: checked };
      },
    );
    updatedNameToVsMap[vsNameAuthorSystem].concepts = updatedConcepts;

    setValueSetOptions((prevState) => ({
      ...prevState,
      [activeTab]: updatedNameToVsMap, // Update the state for the current tab
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
      <LoadingView loading={!useCaseQueryResponse} />
      <h1 className="page-title margin-bottom-05-important">Customize query</h1>
      <h2 className="page-explainer margin-y-0-important">
        Query: {USE_CASE_DETAILS[queryType].condition}
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
      {valueSetOptionsToDisplay.map(([vsNameAuthorSystem, vs]) => {
        const id = vs.author + ":" + vs.system + ":" + vs.valueSetName;
        return (
          <Accordion
            key={id}
            id={id}
            title={
              <CustomizeQueryAccordionHeader
                handleSelectAllChange={handleSelectAllChange}
                vsIndex={vsNameAuthorSystem}
                valueSet={vs}
              />
            }
            content={
              <CustomizeQueryAccordionBody
                valueSet={vs}
                toggleInclude={toggleInclude}
                vsName={vsNameAuthorSystem}
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
  [vsNameAuthorSystem: string]: DibbsValueSet;
}) => {
  return Object.values(obj).reduce((runningSum, vs) => {
    runningSum += vs.concepts.length;
    return runningSum;
  }, 0);
};
