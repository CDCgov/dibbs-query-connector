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

interface DataContextValue {
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

/**
 * Maps the results returned from the DIBBs value set and coding system database
 * into a collection of value sets, each containing one or more Concepts build out
 * of the coding information in the DB.
 * @param rows The Rows returned from the DB Query.
 * @returns A list of ValueSets, which hold the Concepts pulled from the DB.
 */
export const mapQueryRowsToValueSets = (rows: QueryResultRow[]) => {
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
    const valueSet: ValueSet = {
      valueSetId: conceptGroup[0]["valueset_id"],
      valueSetVersion: conceptGroup[0]["version"],
      valueSetName: conceptGroup[0]["valueset_name"],
      // External ID might not be defined for user-defined valuesets
      valueSetExternalId: conceptGroup[0]["valueset_external_id"]
        ? conceptGroup[0]["valueset_external_id"]
        : undefined,
      author: conceptGroup[0]["author"],
      system: conceptGroup[0]["code_system"],
      ersdConceptType: conceptGroup[0]["type"]
        ? conceptGroup[0]["type"]
        : undefined,
      dibbsConceptType: conceptGroup[0]["dibbs_concept_type"],
      includeValueSet: conceptGroup.find((c) => c["include"]) ? true : false,
      concepts: conceptGroup.map((c) => {
        return {
          code: c["code"],
          display: c["display"],
          include: c["include"],
        };
      }),
    };
    return valueSet;
  });
  return valueSets;
};
