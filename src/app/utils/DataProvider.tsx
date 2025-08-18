"use client";

import { createContext, ReactNode, useState } from "react";
import { SessionProvider } from "next-auth/react";
import { PageType } from "../constants";
import { ToastConfigOptions } from "../ui/designSystem/toast/Toast";
import { Session } from "next-auth";
import { SelectedQueryDetails } from "@/app/(pages)/queryBuilding/querySelection/utils";
import { EMPTY_QUERY_SELECTION } from "@/app/(pages)/queryBuilding/utils";

const REFRESH_INTERVAL_MINS = 15;

export interface DataContextValue {
  data: unknown;
  setData: (data: unknown) => void;
  currentPage: PageType | string | null;
  setCurrentPage: (currentPage: PageType | string | null) => void;
  toastConfig: ToastConfigOptions | null;
  setToastConfig: (config: ToastConfigOptions) => void;
  runtimeConfig?: Record<string, string>;
  selectedQuery?: SelectedQueryDetails;
  setSelectedQuery?: (query: SelectedQueryDetails) => void;
}

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
  const [currentPage, setCurrentPage] = useState<PageType | string | null>(
    null,
  );
  const [toastConfig, setToastConfig] = useState<ToastConfigOptions | null>(
    null,
  );
  const [selectedQuery, setSelectedQuery] = useState<SelectedQueryDetails>(
    EMPTY_QUERY_SELECTION,
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
        selectedQuery,
        setSelectedQuery: (q) => setSelectedQuery(structuredClone(q)),
      }}
    >
      <SessionProvider
        session={session}
        refetchInterval={REFRESH_INTERVAL_MINS * 60}
        refetchOnWindowFocus={false}
      >
        {children}
      </SessionProvider>
    </DataContext.Provider>
  );
}

export default DataProvider;
