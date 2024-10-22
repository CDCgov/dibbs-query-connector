"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@trussworks/react-uswds";
import {
  DibbsValueSetType,
  USE_CASES,
  ValueSet,
  demoQueryValToLabelMap,
} from "../../constants";
import { UseCaseQueryResponse } from "@/app/query-service";
import LoadingView from "./LoadingView";
import { showRedirectConfirmation } from "../designSystem/redirectToast/RedirectToast";
import styles from "./customizeQuery/customizeQuery.module.css";
import CustomizeQueryAccordionHeader from "./customizeQuery/CustomizeQueryAccordionHeader";
import CustomizeQueryAccordionBody from "./customizeQuery/CustomizeQueryAccordionBody";
import Accordion from "../designSystem/Accordion";
import CustomizeQueryNav from "./customizeQuery/CustomizeQueryNav";
import { mapValueSetsToValueSetTypes } from "./customizeQuery/customizeQueryUtils";
import Backlink from "./backLink/Backlink";

interface CustomizeQueryProps {
  useCaseQueryResponse: UseCaseQueryResponse;
  queryType: USE_CASES;
  queryValuesets: ValueSet[];
  setQueryValuesets: (queryVS: ValueSet[]) => void;
  goBack: () => void;
}

/**
 * CustomizeQuery component for displaying and customizing query details.
 * @param root0 - The properties object.
 * @param root0.useCaseQueryResponse - The response from the query service.
 * @param root0.queryType - The type of the query.
 * @param root0.queryValuesets - The pre-fetched value sets from the DB.
 * @param root0.setQueryValuesets - Function to update tracked custom query state.
 * @param root0.goBack - Back button to go from "customize-queries" to "search" component.
 * @returns The CustomizeQuery component.
 */
const CustomizeQuery: React.FC<CustomizeQueryProps> = ({
  useCaseQueryResponse,
  queryType,
  queryValuesets,
  setQueryValuesets,
  goBack,
}) => {
  const [activeTab, setActiveTab] = useState<DibbsValueSetType>("labs");
  const { labs, conditions, medications } =
    mapValueSetsToValueSetTypes(queryValuesets);
  const [valueSetOptions, setValueSetOptions] = useState({
    labs: labs,
    conditions: conditions,
    medications: medications,
  });

  // Compute counts of each tab-type
  const countLabs = Object.values(valueSetOptions.labs).flatMap(
    (group) => group.items,
  ).length;
  const countConditions = Object.values(valueSetOptions.conditions).flatMap(
    (group) => group.items,
  ).length;
  const countMedications = Object.values(valueSetOptions.medications).flatMap(
    (group) => group.items,
  ).length;

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
        include: checked, // Set all items in this group to checked or unchecked
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
          include: checked, // Set all items in this group to checked or unchecked
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
    showRedirectConfirmation({
      heading: QUERY_CUSTOMIZATION_CONFIRMATION_HEADER,
      body: QUERY_CUSTOMIZATION_CONFIRMATION_BODY,
      headingLevel: "h4",
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
        <Backlink onClick={goBack} label="Return to Select query" />
      </div>
      <LoadingView loading={!useCaseQueryResponse} />
      <h1 className="font-sans-2xl text-bold margin-top-205">
        Customize query
      </h1>
      <div className="font-sans-lg text-light padding-bottom-0 padding-top-05">
        Query: {demoQueryValToLabelMap[queryType]}
      </div>
      <div className="font-sans-sm text-light padding-bottom-0 padding-top-05">
        {countLabs} labs found, {countMedications} medications found,{" "}
        {countConditions} conditions found.
      </div>

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

export const QUERY_CUSTOMIZATION_CONFIRMATION_HEADER =
  "Query Customization Successful!";
export const QUERY_CUSTOMIZATION_CONFIRMATION_BODY =
  "You've successfully customized your query. Once you're done adding patient details, submit your completed query to get results";
