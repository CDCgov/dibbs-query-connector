"use client";

import { createContext, ReactNode, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { PageType } from "./constants";
import { ToastConfigOptions } from "../ui/designSystem/toast/Toast";
import { Session } from "next-auth";

const REFRESH_INTERVAL_MINS = 15;

export interface DataContextValue {
  data: unknown; // You can define a specific data type here
  setData: (data: unknown) => void;
  currentPage: PageType | string | undefined;
  setCurrentPage: (currentPage: PageType | string | undefined) => void;
  toastConfig: ToastConfigOptions | null;
  setToastConfig: (config: ToastConfigOptions) => void;
  runtimeConfig?: Record<string, string>;
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
 * @param root0.runtimeConfig - env variables that are needed at runtime
 * @param root0.session - user session retrieved on the server on first render
 * @returns - The data provider component.
 */
export function DataProvider({
  children,
  runtimeConfig,
  session,
}: {
  children: ReactNode;
  runtimeConfig: Record<string, string>;
  session: Session | null;
}) {
  const [data, setData] = useState<unknown | null>(null);
  const [currentPage, setCurrentPage] = useState<
    PageType | string | undefined
  >();
  const [toastConfig, setToastConfig] = useState<ToastConfigOptions | null>(
    null,
  );

  return (
    <DataContext.Provider
      value={{
        data,
        setData,
        currentPage,
        setCurrentPage,
        toastConfig,
        setToastConfig,
        runtimeConfig,
      }}
    >
      <SessionProvider
        session={session}
        refetchInterval={REFRESH_INTERVAL_MINS * 60000}
      >
        {children}
      </SessionProvider>
    </DataContext.Provider>
  );
}

export default DataProvider;
