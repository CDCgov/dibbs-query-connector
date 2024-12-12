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
 * Maps the results returned from the DIBBs value set and coding system database
 * into a collection of value sets, each containing one or more Concepts build out
 * of the coding information in the DB.
 * @param rows The Rows returned from the DB Query.
 * @returns A list of ValueSets, which hold the Concepts pulled from the DB.
 */
export const mapQueryRowsToValueSets = (rows: QueryResultRow[]): ValueSet[] => {
  // Unest the {condition: valuesetId: valueSet} nesting in an array of valueSets
  const valueSets = rows
    .map((curRow) => {
      const valueSetsByCondition =
        curRow.query_data as QueryTableQueryDataColumn;
      const valueSetsById = Object.values(valueSetsByCondition);
      return valueSetsById.map((valById) => {
        const curValueSet = Object.values(valById);
        return curValueSet.map((v) => {
          return {
            valueSetId: v.valueSetId,
            valueSetVersion: v.valueSetVersion,
            valueSetName: v.valueSetName,
            author: v.author,
            system: v.system,
            valueSetExternalId: v?.valueSetExternalId,
            ersdConceptType: v?.ersdConceptType,
            dibbsConceptType: v.dibbsConceptType,
            includeValueSet: v.includeValueSet,
            concepts: v.concepts,
          };
        });
      });
    })
    .flat()
    .flat();

  return valueSets;
};
