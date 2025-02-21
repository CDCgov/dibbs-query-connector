"use client";

import { createContext, useState } from "react";

export type SubjectType = "Members" | "Query";

interface UserManagementData {
  teamQueryEditSection: {
    isOpen: boolean;
    title: string;
    subtitle: string;
    placeholder: string;
    groupId: string;
    subjectType: SubjectType;
  };
}

interface UserManagementContext extends UserManagementData {
  openEditSection: (
    title: string,
    subtitle: string,
    subjectType: SubjectType,
    groupId: string,
  ) => void;
  closeEditSection: () => void;
  handleSearch: (searchFilter: string) => void;
  handleMemberUpdate: (e: React.ChangeEvent) => void;
  handleQueryUpdate: (e: React.ChangeEvent) => void;
}

const initData: UserManagementData = {
  teamQueryEditSection: {
    isOpen: false,
    title: "",
    subtitle: "",
    placeholder: "Search",
    groupId: "",
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
    id: string,
  ) {
    let placeholder = "";

    if (subjectType == "Members") {
      placeholder = "Search members";
    } else {
      placeholder = "Search queries";
    }

    const newState: UserManagementData = {
      ...innerState,
      teamQueryEditSection: {
        ...innerState.teamQueryEditSection,
        title,
        subtitle,
        placeholder,
        subjectType,
        groupId: id,
        isOpen: true,
      },
    };
    setInnerState(newState);
  }

  function handleSearch(filter: string) {
    // TODO data filtering
    console.log("filtering ...", filter);
  }

  function handleMemberUpdate(e: React.ChangeEvent) {
    const id = e.currentTarget.id;
    console.log("update team members", id);
  }

  function handleQueryUpdate(e: React.ChangeEvent) {
    const id = e.currentTarget.id;
    console.log("update team queries", id);
  }

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
