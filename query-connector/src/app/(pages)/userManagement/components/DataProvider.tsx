"use client";

import { createContext, useState } from "react";

type SubjectType = "Members" | "Query";

interface UserManagementData {
  TeamQueryEditSection: {
    isOpen: boolean;
    title: string;
    subtitle: string;
    placeholder: string;
    subjectData: unknown;
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
  HandleSearch: (searchFilter: string) => void;
  HandleMemberUpdate: () => void;
  HandleQueryUpdate: () => void;
}

const initData: UserManagementData = {
  TeamQueryEditSection: {
    isOpen: false,
    title: "",
    subtitle: "",
    placeholder: "Search",
    subjectData: [],
    subjectType: "Members",
  },
};

export const DataContext = createContext<UserManagementContext>({
  ...initData,
  OpenEditSection: () => {},
  CloseEditSection: () => {},
  HandleSearch: (searchFilter: string) => {},
  HandleMemberUpdate: () => {},
  HandleQueryUpdate: () => {},
});

/**
 *
 * @param root0 - DataProvider props (only receives children)
 * @param root0.children - React components that need access to the user management data
 * @returns DataProvider component which allows to access and update user management data
 */
const DataProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [innerState, setInnerState] = useState<UserManagementData>(initData);

  /**
   * Event handlers for edit section
   */
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
    let subjectData = null;
    let placeholder = "";

    if (subjectType == "Members") {
      placeholder = "Search members";
      subjectData = GetTeamMembers(subjectId);
    } else {
      placeholder = "Search queries";
      subjectData = GetTeamQueries(subjectId);
    }

    const newState: UserManagementData = {
      ...innerState,
      TeamQueryEditSection: {
        ...innerState.TeamQueryEditSection,
        title,
        subtitle,
        placeholder,
        subjectType,
        subjectData,
        isOpen: true,
      },
    };
    setInnerState(newState);
  }

  function HandleSearch(filter: string) {
    // TODO data filtering
    console.log("filtering ...");
  }

  function HandleMemberUpdate() {
    console.log("update team members");
  }

  function HandleQueryUpdate() {
    console.log("update team queries");
  }

  /**
   * Data fetching
   */

  function GetTeamMembers(teamId: string): unknown {
    // TODO retrieve member data
    const ListOfMembers = ["Member 1", "Member 2", "Member 3"];
    return ListOfMembers;
  }

  function GetTeamQueries(teamId: string): unknown {
    // TODO retrieve queries data
    const ListOfQueries = ["Query 1", "Query 2", "Query 3"];
    return ListOfQueries;
  }

  /**
   * HTML
   */
  return (
    <DataContext.Provider
      value={{
        ...innerState,
        OpenEditSection,
        CloseEditSection,
        HandleSearch,
        HandleMemberUpdate,
        HandleQueryUpdate,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export default DataProvider;
