"use client";

import { createContext, ReactNode, useState } from "react";
import { PageType } from "./constants";
import { ToastConfig } from "../ui/components/page/page";

export interface DataContextValue {
  data: unknown; // You can define a specific data type here
  setData: (data: unknown) => void;
  currentPage: PageType | string | undefined;
  setCurrentPage: (currentPage: PageType | string | undefined) => void;
  toastConfig: ToastConfig | null;
  setToastConfig: (config: ToastConfig) => void;
}
// Context lets the parent component make some information available to any component in the tree below it,
// no matter how deep, without passing it explicitly through props.
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
  const [currentPage, setCurrentPage] = useState<
    PageType | string | undefined
  >();
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);

  return (
    <DataContext.Provider
      value={{
        data,
        setData,
        currentPage,
        setCurrentPage,
        toastConfig,
        setToastConfig,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export default DataProvider;
