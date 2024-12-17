"use client";
import { createContext, ReactNode, useState } from "react";
import React from "react";
import classNames from "classnames";
import { QueryResultRow } from "pg";
import { ValueSet } from "./constants";

export interface DataDisplayInfo {
  title: string;
  value?: string | React.JSX.Element | React.JSX.Element[];
}

/**
 * Functional component for displaying data.
 * @param props - Props for the component.
 * @param props.item - The display data item(s) to be rendered.
 * @param [props.className] - Additional class name for styling purposes.
 * @returns - A React element representing the display of data.
 */
export const DataDisplay: React.FC<{
  item: DataDisplayInfo;
  className?: string;
}> = ({
  item,
  className,
}: {
  item: DataDisplayInfo;
  className?: string;
}): React.JSX.Element => {
  return (
    <div>
      <div className="grid-row">
        <div className="data-title" id={item.title}>
          {item.title}
        </div>
        <div
          className={classNames("grid-col-auto maxw7 text-pre-line", className)}
        >
          {item.value}
        </div>
      </div>
      <div className={"section__line_gray"} />
    </div>
  );
};

export interface DataContextValue {
  data: unknown; // You can define a specific data type here
  setData: (data: unknown) => void;
}

export const DataContext = createContext<DataContextValue | undefined>(
  undefined,
);

/**
 *
 * @param root0 - Children
 * @param root0.children - Children
 * @returns - The data provider component.
 */
export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<unknown | null>(null);

  return (
    <DataContext.Provider value={{ data, setData }}>
      {children}
    </DataContext.Provider>
  );
}

type QueryTableQueryDataColumn = {
  [condition_name: string]: {
    [valueSetId: string]: ValueSet;
  };
};

/**
 * Maps the results returned from the DIBBs query table into their associated
 * valueSets, each containing one or more Concepts build out
 * of the coding information in the DB.
 * @param rows The Rows returned from the ValueSet table.
 * @returns A list of ValueSets, which hold the Concepts pulled from the DB.
 */
export const unnestValueSetsFromQuery = (
  rows: QueryResultRow[],
): ValueSet[] => {
  // Unest the {condition: valuesetId: valueSet} nesting in an array of valueSets
  const valueSets = rows
    .map((curRow) => {
      const valueSetsByCondition =
        curRow.query_data as QueryTableQueryDataColumn;
      const valueSetsById = Object.values(valueSetsByCondition);
      return valueSetsById.map((valById) => {
        return Object.values(valById);
      });
    })
    .flat()
    .flat();

  return valueSets;
};
/**
 * Maps the results returned from the DIBBs value set and coding system database
 * into a collection of value sets, each containing one or more Concepts build out
 * of the coding information in the DB.
 * @param rows The Rows returned from the ValueSet table.
 * @returns A list of ValueSets, which hold the Concepts pulled from the DB.
 */
export const groupConditionConceptsIntoValueSets = (rows: QueryResultRow[]) => {
  // Create groupings of rows (each of which is a single Concept) by their ValueSet ID
  const vsIdGroupedRows = rows.reduce((conceptsByVSId, r) => {
    if (!(r["valueset_id"] in conceptsByVSId)) {
      conceptsByVSId[r["valueset_id"]] = [];
    }
    conceptsByVSId[r["valueset_id"]].push(r);
    return conceptsByVSId;
  }, {});

  // Each "prop" of the struct is now a ValueSet ID
  // Iterate over them to create formal Concept Groups attached to a formal VS
  const valueSets = Object.keys(vsIdGroupedRows).map((vsID) => {
    const conceptGroup: QueryResultRow[] = vsIdGroupedRows[vsID];
    const valueSet = mapStoredValueSetIntoInternalValueset(conceptGroup);
    return valueSet;
  });
  return valueSets;
};

// TODO?: Type the input param more explicitly to not be a generic DB return?
/**
 *
 * @param conceptGroup - a grouping of concepts fetched from various coding
 * systems that share the same ValueSet ID
 * @returns a ValueSet shaped to our internal ValueSet structure
 */
function mapStoredValueSetIntoInternalValueset(
  conceptGroup: QueryResultRow[],
): ValueSet {
  // For info that should be the same at the valueset-level, just use the first
  // fetched concept to populate
  const storedConcept = conceptGroup[0];
  const valueSet: ValueSet = {
    valueSetId: storedConcept["valueset_id"],
    valueSetVersion: storedConcept["version"],
    valueSetName: storedConcept["valueset_name"],
    // External ID might not be defined for user-defined valuesets
    valueSetExternalId: storedConcept["valueset_external_id"]
      ? storedConcept["valueset_external_id"]
      : undefined,
    author: storedConcept["author"],
    system: storedConcept["code_system"],
    ersdConceptType: storedConcept["type"] ? storedConcept["type"] : undefined,
    dibbsConceptType: storedConcept["dibbs_concept_type"],
    includeValueSet: conceptGroup
      .map((c) => c["include"])
      // if every concept is explicitly set to false, don't include this valueset.
      // otherwise (even if inclusion is undefined, which by default it will be)
      // assume we want to include that valueset
      .every((v) => v === false)
      ? false
      : true,
    concepts: conceptGroup.map((c) => {
      return {
        code: c["code"],
        display: c["display"],
        include: c["include"] ?? true,
      };
    }),
  };
  const conditionId = storedConcept["condition_id"];
  if (conditionId) {
    valueSet["conditionId"] = conditionId;
  }
  return valueSet;
}
