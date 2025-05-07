import React, { ReactNode } from "react";
import { waitFor, screen, render } from "@testing-library/react";
import {
  allGroups,
  mockAdmin,
  mockGroupWithSingleQuery,
  mockQueryNoGroups,
  mockQueryWithGroups,
  mockStandard,
  mockSuperAdmin,
} from "../../test-utils";
import { RootProviderMock } from "@/app/tests/unit/setup";
import { SubjectType, UserManagementContext } from "../UserManagementProvider";
import UserManagementDrawer from "./TeamQueryEditSection";

jest.mock("next-auth/react");

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

jest.mock("@/app/backend/dbServices/queryBuilding/service", () => ({
  getCustomQueries: jest.fn(),
}));

jest.mock("@/app/backend/user-management", () => ({
  getGroupMembers: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getGroupQueries: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getUsers: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getUserGroups: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
}));

describe("User Management drawer", () => {
  const allQueries = [mockQueryNoGroups, mockQueryWithGroups];
  const allUsers = [mockAdmin, mockStandard, mockSuperAdmin];

  const renderOpenDrawer = (subject: SubjectType, children: ReactNode) => {
    return (
      <UserManagementContext.Provider
        value={{
          teamQueryEditSection: {
            isOpen: true,
            title: mockGroupWithSingleQuery.name,
            subtitle: subject == "Queries" ? "Assigned queries" : "Members",
            placeholder: "Search",
            groupId: mockGroupWithSingleQuery.id,
            subjectType: subject,
            subjectData: subject == "Queries" ? allQueries : allUsers,
          },
          openEditSection: jest.fn(),
          closeEditSection: jest.fn(),
        }}
      >
        {children}
      </UserManagementContext.Provider>
    );
  };
  it("is closed by default", async () => {
    render(
      <RootProviderMock currentPage="/userManagement">
        <UserManagementDrawer
          userGroups={[]}
          setUserGroups={jest.fn()}
          users={[]}
          setUsers={jest.fn()}
          refreshView={jest.fn()}
          activeTabLabel={""}
          allQueries={[]}
          setAllQueries={jest.fn()}
        />
      </RootProviderMock>,
    );

    const drawer = screen.getByTestId("drawer-open-false");
    expect(drawer.classList).toContain("closed");
    expect(document.body).toMatchSnapshot();

    jest.restoreAllMocks();
  });
  it("renders an error message if there is no subject data to display", async () => {
    render(
      <RootProviderMock currentPage="/userManagement">
        {renderOpenDrawer(
          "Members",
          <UserManagementDrawer
            userGroups={[]}
            setUserGroups={jest.fn()}
            users={[]}
            setUsers={jest.fn()}
            refreshView={jest.fn()}
            activeTabLabel={""}
            allQueries={[]}
            setAllQueries={jest.fn()}
          />,
        )}
      </RootProviderMock>,
    );

    const drawer = screen.getByTestId("drawer-open-true");
    expect(drawer.classList).toContain("open");

    const body = document.getElementsByClassName("drawerBody")[0];
    expect(body.innerHTML).toContain("No users found");
    expect(document.body).toMatchSnapshot();

    jest.restoreAllMocks();
  });
  it("renders the list of all available queries", async () => {
    render(
      <RootProviderMock currentPage="/userManagement">
        {renderOpenDrawer(
          "Queries",
          <UserManagementDrawer
            userGroups={allGroups}
            setUserGroups={jest.fn()}
            users={allUsers}
            setUsers={jest.fn()}
            refreshView={jest.fn()}
            activeTabLabel={""}
            allQueries={allQueries}
            setAllQueries={jest.fn()}
          />,
        )}
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("No queries found")).not.toBeInTheDocument();
    });

    const drawer = screen.getByTestId("drawer-open-true");
    expect(drawer.classList).toContain("open");

    expect(screen.getAllByRole("listitem")).toHaveLength(allQueries.length);
    expect(document.body).toMatchSnapshot();

    jest.restoreAllMocks();
  });

  it("renders the list of all available users", async () => {
    render(
      <RootProviderMock currentPage="/userManagement">
        {renderOpenDrawer(
          "Members",
          <UserManagementDrawer
            userGroups={allGroups}
            setUserGroups={jest.fn()}
            users={allUsers}
            setUsers={jest.fn()}
            refreshView={jest.fn()}
            activeTabLabel={""}
            allQueries={allQueries}
            setAllQueries={jest.fn()}
          />,
        )}
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("No users found")).not.toBeInTheDocument();
    });

    const drawer = screen.getByTestId("drawer-open-true");
    expect(drawer.classList).toContain("open");

    expect(screen.getAllByRole("listitem")).toHaveLength(allUsers.length);
    expect(document.body).toMatchSnapshot();

    jest.restoreAllMocks();
  });
});
