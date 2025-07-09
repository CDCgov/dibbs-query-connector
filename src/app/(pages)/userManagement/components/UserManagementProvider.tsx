"use client";

import { createContext, useState } from "react";
import { User } from "@/app/models/entities/users";
import { CustomUserQuery } from "@/app/models/entities/query";

export type SubjectType = "Members" | "Queries" | null;

interface UserManagementData {
  teamQueryEditSection: {
    isOpen: boolean;
    title: string;
    subtitle: string;
    placeholder: string;
    groupId: string;
    subjectType: SubjectType;
    subjectData: User[] | CustomUserQuery[];
  };
}

interface UserManagementContext extends UserManagementData {
  openEditSection: (
    title: string,
    subtitle: string,
    subjectType: SubjectType,
    groupId: string,
    subjectData: User[] | CustomUserQuery[],
  ) => void;
  closeEditSection: () => void;
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
    subjectData: User[] | CustomUserQuery[],
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
        subjectData,
        isOpen: true,
      },
    };
    setInnerState(newState);
  }

  return (
    <UserManagementContext.Provider
      value={{
        ...innerState,
        openEditSection,
        closeEditSection,
      }}
    >
      {children}
    </UserManagementContext.Provider>
  );
};

export default DataProvider;
