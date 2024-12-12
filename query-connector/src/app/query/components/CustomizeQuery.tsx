"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@trussworks/react-uswds";
import {
  DibbsConceptType,
  DibbsValueSetType,
  USE_CASES,
  ValueSet,
  demoQueryValToLabelMap,
} from "../../constants";
import { UseCaseQueryResponse } from "@/app/query-service";
import LoadingView from "./LoadingView";
import { showToastConfirmation } from "../designSystem/toast/Toast";
import styles from "./customizeQuery/customizeQuery.module.css";
import CustomizeQueryAccordionHeader from "./customizeQuery/CustomizeQueryAccordionHeader";
import CustomizeQueryAccordionBody from "./customizeQuery/CustomizeQueryAccordionBody";
import Accordion from "../designSystem/Accordion";
import CustomizeQueryNav from "./customizeQuery/CustomizeQueryNav";
import {
  GroupedValueSet,
  mapValueSetsToValueSetTypes,
  countDibbsConceptTypeToVsMapItems,
} from "./customizeQuery/customizeQueryUtils";
import Backlink from "./backLink/Backlink";
import { RETURN_LABEL } from "./stepIndicator/StepIndicator";

interface CustomizeQueryProps {
  useCaseQueryResponse: UseCaseQueryResponse;
  queryType: USE_CASES;
  queryValueSets: ValueSet[];
  setQueryValuesets: (queryVS: ValueSet[]) => void;
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
  const [activeTab, setActiveTab] = useState<DibbsValueSetType>("labs");

  const [valueSetOptions, setValueSetOptions] = useState<{
    [dibbsConceptType in DibbsConceptType]: {
      [vsNameAuthorSystem: string]: GroupedValueSet;
    };
  }>({
    labs: {},
    conditions: {},
    medications: {},
  });

  useEffect(() => {
    const { labs, conditions, medications } =
      mapValueSetsToValueSetTypes(queryValueSets);

    setValueSetOptions({
      labs: labs,
      conditions: conditions,
      medications: medications,
    });
  }, [queryValueSets]);

  // Compute counts of each tab-type
  const countLabs = countDibbsConceptTypeToVsMapItems(valueSetOptions.labs);
  const countConditions = countDibbsConceptTypeToVsMapItems(
    valueSetOptions.conditions,
  );
  const countMedications = countDibbsConceptTypeToVsMapItems(
    valueSetOptions.medications,
  );

  // Keeps track of which side nav tab to display to users
  const handleTabChange = (tab: DibbsValueSetType) => {
    setActiveTab(tab);
  };

  // Handles the toggle of the 'include' state for individual concepts in
  // the accordion
  const toggleInclude = (
    groupIndex: string,
    valueSetIndex: number,
    conceptIndex: number,
  ) => {
    const updatedGroups = valueSetOptions[activeTab];
    const updatedValueSets = [...updatedGroups[groupIndex].items]; // Clone the current group items
    const updatedConceptsInIndexedValueSet = [
      ...updatedValueSets[valueSetIndex].concepts,
    ];
    updatedConceptsInIndexedValueSet[conceptIndex] = {
      ...updatedConceptsInIndexedValueSet[conceptIndex],
      include: !updatedConceptsInIndexedValueSet[conceptIndex].include, // Toggle the include for the clicked concept
    };

    updatedValueSets[valueSetIndex] = {
      ...updatedValueSets[valueSetIndex],
      concepts: updatedConceptsInIndexedValueSet, // Update the concepts in the accessed value set
    };

    updatedGroups[groupIndex] = {
      ...updatedGroups[groupIndex],
      items: updatedValueSets, // Update the whole group's items
    };

    setValueSetOptions((prevState) => ({
      ...prevState,
      [activeTab]: updatedGroups, // Update the state with the new group
    }));
  };

  // Allows all items to be selected within all accordion sections of the active tab
  const handleSelectAllChange = (groupIndex: string, checked: boolean) => {
    const updatedGroups = valueSetOptions[activeTab];

    // Update only the group at the specified index
    updatedGroups[groupIndex].items = updatedGroups[groupIndex].items.map(
      (item) => ({
        ...item,
        includeValueSet: checked, // Set all items in this group to checked or unchecked
        concepts: item.concepts.map((ic) => {
          return { ...ic, include: checked };
        }),
      }),
    );

    setValueSetOptions((prevState) => ({
      ...prevState,
      [activeTab]: updatedGroups, // Update the state for the current tab
    }));
  };

  // Allows all items to be selected within the entire active tab
  const handleSelectAllForTab = (checked: boolean) => {
    const updatedGroups = Object.values(valueSetOptions[activeTab]).map(
      (group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          includeValueSet: checked, // Set all items in this group to checked or unchecked
          concepts: item.concepts.map((ic) => {
            return { ...ic, include: checked };
          }),
        })),
      }),
    );

    setValueSetOptions((prevState) => ({
      ...prevState,
      [activeTab]: updatedGroups, // Update the state for the current tab
    }));
  };

  // Persist the changes made on this page to the valueset state maintained
  // by the entire query branch of the app
  const handleApplyChanges = () => {
    const selectedItems = Object.keys(valueSetOptions).reduce((acc, key) => {
      const items = valueSetOptions[key as DibbsValueSetType];
      acc = acc.concat(Object.values(items).flatMap((dict) => dict.items));
      return acc;
    }, [] as ValueSet[]);
    setQueryValuesets(selectedItems);
    goBack();
    showToastConfirmation({
      body: QUERY_CUSTOMIZATION_CONFIRMATION_BODY,
    });
  };

  useEffect(() => {
    const items = Object.values(valueSetOptions[activeTab]).flatMap(
      (group) => group.items,
    );
    const selectedCount = items.filter((item) => item.includeValueSet).length;
    const topCheckbox = document.getElementById(
      "select-all",
    ) as HTMLInputElement;
    if (topCheckbox) {
      topCheckbox.indeterminate =
        selectedCount > 0 && selectedCount < items.length;
    }
  }, [valueSetOptions, activeTab]);

  return (
    <div>
      <div className="padding-top-3">
        <Backlink onClick={goBack} label={RETURN_LABEL["results"]} />
      </div>
      <LoadingView loading={!useCaseQueryResponse} />
      <h1 className="page-title margin-bottom-05-important">Customize query</h1>
      <h2 className="page-explainer margin-y-0-important">
        Query: {demoQueryValToLabelMap[queryType]}
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
      {Object.entries(valueSetOptions[activeTab]).map(([groupIndex, group]) => {
        const id = group.author + ":" + group.system + ":" + group.valueSetName;
        return (
          <Accordion
            key={id}
            id={id}
            title={
              <CustomizeQueryAccordionHeader
                handleSelectAllChange={handleSelectAllChange}
                groupIndex={groupIndex}
                group={group}
              />
            }
            content={
              <CustomizeQueryAccordionBody
                group={group}
                toggleInclude={toggleInclude}
                groupIndex={groupIndex}
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
  "Query Customization Successful!";
