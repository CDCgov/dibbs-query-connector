"use client";

import { createContext, useState } from "react";

export type SubjectType = "Members" | "Query";

interface UserManagementData {
  teamQueryEditSection: {
    isOpen: boolean;
    title: string;
    subtitle: string;
    placeholder: string;
    subjectData: unknown;
    subjectType: SubjectType;
  };
}

interface UserManagementContext extends UserManagementData {
  openEditSection: (
    title: string,
    subtitle: string,
    subjectType: SubjectType,
    subjectId: string,
  ) => void;
  closeEditSection: () => void;
  handleSearch: (searchFilter: string) => void;
  handleMemberUpdate: () => void;
  handleQueryUpdate: () => void;
}

const initData: UserManagementData = {
  teamQueryEditSection: {
    isOpen: false,
    title: "",
    subtitle: "",
    placeholder: "Search",
    subjectData: [],
    subjectType: "Members",
  },
};

export const UserManagementContext = createContext<UserManagementContext>({
  ...initData,
  openEditSection: () => {},
  closeEditSection: () => {},
  handleSearch: (_searchFilter: string) => {},
  handleMemberUpdate: () => {},
  handleQueryUpdate: () => {},
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
  function closeEditSection() {
    const newState: UserManagementData = {
      ...innerState,
      teamQueryEditSection: {
        ...innerState.teamQueryEditSection,
        isOpen: false,
      },
    };
    setInnerState(newState);
  }

  function openEditSection(
    title: string,
    subtitle: string,
    subjectType: SubjectType,
    subjectId: string,
  ) {
    let subjectData = null;
    let placeholder = "";

    if (subjectType == "Members") {
      placeholder = "Search members";
      subjectData = getTeamMembers(subjectId);
    } else {
      placeholder = "Search queries";
      subjectData = getTeamQueries(subjectId);
    }

    const newState: UserManagementData = {
      ...innerState,
      teamQueryEditSection: {
        ...innerState.teamQueryEditSection,
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

  function handleSearch(filter: string) {
    // TODO data filtering
    console.log("filtering ...", filter);
  }

  function handleMemberUpdate() {
    console.log("update team members");
  }

  function handleQueryUpdate() {
    console.log("update team queries");
  }

  /**
   * Data fetching
   */

  function getTeamMembers(_teamId: string): unknown {
    // TODO retrieve member data
    const ListOfMembers = ["Member 1", "Member 2", "Member 3"];
    return ListOfMembers;
  }

  function getTeamQueries(_teamId: string): unknown {
    // TODO retrieve queries data
    const ListOfQueries = ["Query 1", "Query 2", "Query 3"];
    return ListOfQueries;
  }

  /**
   * HTML
   */
  return (
    <UserManagementContext.Provider
      value={{
        ...innerState,
        openEditSection,
        closeEditSection,
        handleSearch,
        handleMemberUpdate,
        handleQueryUpdate,
      }}
    >
      {children}
    </UserManagementContext.Provider>
  );
};

export default DataProvider;
