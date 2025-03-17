"use client";

import { createContext, useState } from "react";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { User } from "@/app/models/entities/users";
import { QueryTableResult } from "../../queryBuilding/utils";

export type SubjectType = "Members" | "Queries" | null;

interface UserManagementData {
  teamQueryEditSection: {
    isOpen: boolean;
    title: string;
    subtitle: string;
    placeholder: string;
    groupId: string;
    subjectType: SubjectType;
    subjectData: User[] | QueryTableResult[];
  };
}

interface UserManagementContext extends UserManagementData {
  openEditSection: (
    title: string,
    subtitle: string,
    subjectType: SubjectType,
    groupId: string,
    subjectData?: User[] | QueryTableResult[],
  ) => void;
  closeEditSection: () => void;
  handleSearch: (searchFilter: string) => void;
  handleQueryUpdate: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const initData: UserManagementData = {
  teamQueryEditSection: {
    isOpen: false,
    title: "",
    subtitle: "",
    placeholder: "Search",
    groupId: "",
    subjectType: null,
    subjectData: [],
  },
};

export const UserManagementContext = createContext<UserManagementContext>({
  ...initData,
  openEditSection: () => {},
  closeEditSection: () => {},
  handleSearch: (_searchFilter: string) => {},
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
    setInnerState(initData);
  }

  function openEditSection(
    title: string,
    subtitle: string,
    subjectType: SubjectType,
    id: string,
    subjectData?: User[] | QueryTableResult[],
  ) {
    let placeholder = "";

    if (subjectType == "Members") {
      placeholder = "Search members";
    } else {
      placeholder = "Search queries";
    }
    const newData = subjectData ?? [];
    const newState: UserManagementData = {
      ...innerState,
      teamQueryEditSection: {
        ...innerState.teamQueryEditSection,
        title,
        subtitle,
        placeholder,
        subjectType,
        groupId: id,
        subjectData: newData,
        isOpen: true,
      },
    };
    setInnerState(newState);
  }

  function handleSearch(filter: string) {
    // TODO data filtering
    console.log("filtering ...", filter);
  }

  async function handleQueryUpdate(e: React.ChangeEvent<HTMLInputElement>) {
    const queryName = e.currentTarget.name;
    const checked = e.target.checked;

    const alertText = checked
      ? `Assigned ${queryName} to ${innerState.teamQueryEditSection.title}`
      : `Removed ${queryName} from ${innerState.teamQueryEditSection.title}`;

    try {
      showToastConfirmation({
        body: alertText,
      });
    } catch (error) {
      showToastConfirmation({
        heading: "Something went wrong",
        body: alertText,
        variant: "error",
      });
      console.error("Error updating group queries list:", error);
    }
  }

  return (
    <UserManagementContext.Provider
      value={{
        ...innerState,
        openEditSection,
        closeEditSection,
        handleSearch,
        handleQueryUpdate,
      }}
    >
      {children}
    </UserManagementContext.Provider>
  );
};

export default DataProvider;
