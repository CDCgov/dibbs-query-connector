"use client";

import { createContext, useState } from "react";

type SubjectType = "Members" | "Query";

interface UserManagementData {
  TeamQueryEditSection: {
    isOpen: boolean;
    title: string;
    subtitle: string;
    content: JSX.Element;
    subjectType: SubjectType;
  };
}

interface UserManagementContext extends UserManagementData {
  OpenEditSection: (
    title: string,
    subtitle: string,
    subjectType: SubjectType,
    subjectId: string,
  ) => void;
  CloseEditSection: () => void;
}

const initData: UserManagementData = {
  TeamQueryEditSection: {
    isOpen: false,
    title: "",
    subtitle: "",
    content: <></>,
    subjectType: "Members",
  },
};

export const DataContext = createContext<UserManagementContext>({
  ...initData,
  OpenEditSection: () => {},
  CloseEditSection: () => {},
});

/**
 *
 * @param root0 - DataProvider props (only receives children)
 * @param root0.children - React components that need access to the user management data
 * @returns DataProvider component which allows to access and update user management data
 */
const DataProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [innerState, setInnerState] = useState<UserManagementData>(initData);

  function CloseEditSection() {
    const newState: UserManagementData = {
      ...innerState,
      TeamQueryEditSection: {
        ...innerState.TeamQueryEditSection,
        isOpen: false,
      },
    };
    setInnerState(newState);
  }

  function OpenEditSection(
    title: string,
    subtitle: string,
    subjectType: SubjectType,
    subjectId: string,
  ) {
    // here we retrieve the relevant data
    const newState: UserManagementData = {
      ...innerState,
      TeamQueryEditSection: {
        ...innerState.TeamQueryEditSection,
        title,
        subtitle,
        subjectType,
        isOpen: true,
      },
    };
    setInnerState(newState);
  }

  return (
    <DataContext.Provider
      value={{ ...innerState, OpenEditSection, CloseEditSection }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
