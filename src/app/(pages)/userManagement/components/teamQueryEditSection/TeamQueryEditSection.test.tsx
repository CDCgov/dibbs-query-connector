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
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import { SubjectType, UserManagementContext } from "../UserManagementProvider";
import UserManagementDrawer from "./TeamQueryEditSection";
import {
  addUsersToGroup,
  removeUsersFromGroup,
  addQueriesToGroup,
  removeQueriesFromGroup,
  getAllUserGroups,
} from "@/app/backend/usergroup-management";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

jest.mock("next-auth/react");

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

jest.mock("@/app/backend/query-building/service", () => ({
  getCustomQueries: jest.fn(),
}));

jest.mock("@/app/backend/user-management", () => ({
  getGroupMembers: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getGroupQueries: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getUsers: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getUserGroups: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
}));

jest.mock("@/app/backend/usergroup-management", () => ({
  addUsersToGroup: jest.fn(),
  removeUsersFromGroup: jest.fn(),
  addQueriesToGroup: jest.fn(),
  removeQueriesFromGroup: jest.fn(),
  getAllUserGroups: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
}));

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

describe("User Management drawer", () => {
  const allQueries = [mockQueryNoGroups, mockQueryWithGroups];
  const allUsers = [mockAdmin, mockStandard, mockSuperAdmin];

  const renderOpenDrawer = (
    subject: SubjectType,
    children: ReactNode,
    overrides?: {
      groupId?: string;
      subjectData?: typeof allQueries | typeof allUsers;
      closeEditSection?: jest.Mock;
    },
  ) => {
    return (
      <UserManagementContext.Provider
        value={{
          teamQueryEditSection: {
            isOpen: true,
            title: mockGroupWithSingleQuery.name,
            subtitle: subject == "Queries" ? "Assigned queries" : "Members",
            placeholder: "Search",
            groupId: overrides?.groupId ?? mockGroupWithSingleQuery.id,
            subjectType: subject,
            subjectData:
              overrides?.subjectData ??
              (subject == "Queries" ? allQueries : allUsers),
          },
          openEditSection: jest.fn(),
          closeEditSection: overrides?.closeEditSection ?? jest.fn(),
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

  describe("member and query toggle interactions", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (getAllUserGroups as jest.Mock).mockResolvedValue({
        items: allGroups,
        totalItems: allGroups.length,
      });
      (addUsersToGroup as jest.Mock).mockResolvedValue({
        items: [mockStandard],
        totalItems: 1,
      });
      (removeUsersFromGroup as jest.Mock).mockResolvedValue({
        items: [mockAdmin],
        totalItems: 1,
      });
      (addQueriesToGroup as jest.Mock).mockResolvedValue({
        items: [mockQueryWithGroups],
        totalItems: 1,
      });
      (removeQueriesFromGroup as jest.Mock).mockResolvedValue({
        items: [mockQueryWithGroups],
        totalItems: 1,
      });
    });

    const drawerProps = (over: Partial<Record<string, unknown>> = {}) => ({
      userGroups: allGroups,
      setUserGroups: jest.fn(),
      users: allUsers,
      setUsers: jest.fn(),
      refreshView: jest.fn(),
      activeTabLabel: "Users",
      allQueries,
      setAllQueries: jest.fn(),
      ...over,
    });

    it("adds a member to the group when an unchecked box is clicked", async () => {
      const setUsers = jest.fn();
      const setUserGroups = jest.fn();
      const refreshView = jest.fn();
      const props = drawerProps({ setUsers, setUserGroups, refreshView });
      const { user } = renderWithUser(
        <RootProviderMock currentPage="/userManagement">
          {renderOpenDrawer("Members", <UserManagementDrawer {...props} />)}
        </RootProviderMock>,
      );

      const checkbox = (await screen.findByLabelText(
        "Hermione Granger",
      )) as HTMLInputElement;
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      await waitFor(() =>
        expect(addUsersToGroup).toHaveBeenCalledWith("789", ["789"]),
      );
      expect(setUsers).toHaveBeenCalled();
      expect(setUserGroups).toHaveBeenCalled();
      expect(refreshView).toHaveBeenCalledWith("Update Users");
      expect(showToastConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("Added"),
        }),
      );
    });

    it("removes a member from the group when a checked box is clicked", async () => {
      const props = drawerProps();
      const { user } = renderWithUser(
        <RootProviderMock currentPage="/userManagement">
          {renderOpenDrawer("Members", <UserManagementDrawer {...props} />, {
            groupId: "876",
          })}
        </RootProviderMock>,
      );

      const checkbox = (await screen.findByLabelText(
        "Lily Potter",
      )) as HTMLInputElement;
      expect(checkbox).toBeChecked();

      await user.click(checkbox);

      await waitFor(() =>
        expect(removeUsersFromGroup).toHaveBeenCalledWith("876", ["456"]),
      );
      expect(showToastConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("Removed"),
        }),
      );
    });

    it("shows an error toast when updating membership fails", async () => {
      (addUsersToGroup as jest.Mock).mockResolvedValue({
        items: [],
        totalItems: 0,
      });
      const props = drawerProps();
      const { user } = renderWithUser(
        <RootProviderMock currentPage="/userManagement">
          {renderOpenDrawer("Members", <UserManagementDrawer {...props} />)}
        </RootProviderMock>,
      );

      const checkbox = await screen.findByLabelText("Hermione Granger");
      await user.click(checkbox);

      await waitFor(() =>
        expect(showToastConfirmation).toHaveBeenCalledWith(
          expect.objectContaining({
            heading: "Something went wrong",
            variant: "error",
          }),
        ),
      );
    });

    it("unassigns a query from the group when a checked box is clicked", async () => {
      const setAllQueries = jest.fn();
      const refreshView = jest.fn();
      const props = drawerProps({ setAllQueries, refreshView });
      const { user } = renderWithUser(
        <RootProviderMock currentPage="/userManagement">
          {renderOpenDrawer("Queries", <UserManagementDrawer {...props} />)}
        </RootProviderMock>,
      );

      const checkbox = (await screen.findByLabelText(
        "Test Query 2",
      )) as HTMLInputElement;
      expect(checkbox).toBeChecked();

      await user.click(checkbox);

      await waitFor(() =>
        expect(removeQueriesFromGroup).toHaveBeenCalledWith("789", ["q2"]),
      );
      expect(setAllQueries).toHaveBeenCalled();
      expect(refreshView).toHaveBeenCalledWith("Update Users");
      expect(showToastConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("Unassigned"),
        }),
      );
    });

    it("assigns a query to the group when an unchecked box is clicked", async () => {
      const props = drawerProps();
      const { user } = renderWithUser(
        <RootProviderMock currentPage="/userManagement">
          {renderOpenDrawer("Queries", <UserManagementDrawer {...props} />, {
            subjectData: [],
          })}
        </RootProviderMock>,
      );

      const checkbox = (await screen.findByLabelText(
        "Test Query 2",
      )) as HTMLInputElement;
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      await waitFor(() =>
        expect(addQueriesToGroup).toHaveBeenCalledWith("789", ["q2"]),
      );
      expect(showToastConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("Assigned"),
        }),
      );
    });

    it("shows an error toast when updating a query assignment fails", async () => {
      (removeQueriesFromGroup as jest.Mock).mockResolvedValue({
        items: [],
        totalItems: 0,
      });
      const props = drawerProps();
      const { user } = renderWithUser(
        <RootProviderMock currentPage="/userManagement">
          {renderOpenDrawer("Queries", <UserManagementDrawer {...props} />)}
        </RootProviderMock>,
      );

      const checkbox = await screen.findByLabelText("Test Query 2");
      await user.click(checkbox);

      await waitFor(() =>
        expect(showToastConfirmation).toHaveBeenCalledWith(
          expect.objectContaining({
            heading: "Something went wrong",
            variant: "error",
          }),
        ),
      );
    });

    it("closes the drawer when the close button is clicked", async () => {
      const closeEditSection = jest.fn();
      const props = drawerProps();
      const { user } = renderWithUser(
        <RootProviderMock currentPage="/userManagement">
          {renderOpenDrawer("Members", <UserManagementDrawer {...props} />, {
            closeEditSection,
          })}
        </RootProviderMock>,
      );

      const closeButton = await screen.findByTestId("close-drawer");
      await user.click(closeButton);

      expect(closeEditSection).toHaveBeenCalled();
    });

    it("filters the visible members as the user types in the search field", async () => {
      const props = drawerProps();
      const { user } = renderWithUser(
        <RootProviderMock currentPage="/userManagement">
          {renderOpenDrawer("Members", <UserManagementDrawer {...props} />)}
        </RootProviderMock>,
      );

      await screen.findByLabelText("Hermione Granger");

      const searchField = screen.getByPlaceholderText("Search");
      await user.type(searchField, "Hermione");

      await waitFor(() =>
        expect(screen.queryByLabelText("Lily Potter")).not.toBeInTheDocument(),
      );
      expect(screen.getByLabelText("Hermione Granger")).toBeInTheDocument();
    });

    it("filters the visible queries as the user types in the search field", async () => {
      const props = drawerProps();
      const { user } = renderWithUser(
        <RootProviderMock currentPage="/userManagement">
          {renderOpenDrawer("Queries", <UserManagementDrawer {...props} />)}
        </RootProviderMock>,
      );

      await screen.findByLabelText("Test Query 2");

      const searchField = screen.getByPlaceholderText("Search");
      await user.type(searchField, "Query 2");

      await waitFor(() =>
        expect(screen.queryByLabelText("Test Query 1")).not.toBeInTheDocument(),
      );
      expect(screen.getByLabelText("Test Query 2")).toBeInTheDocument();
    });
  });
});
