import "@testing-library/jest-dom";
import { waitFor, screen, render } from "@testing-library/react";
import * as UserManagementBackend from "@/app/backend/user-management";
import * as UserGroupManagementBackend from "@/app/backend/usergroup-management";
import * as QueryBuildingBackend from "@/app/backend/query-building/service";
import { UserRole } from "@/app/models/entities/users";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import UserManagementContainer from "./userManagementContainer";

import {
  mockSuperAdmin,
  mockAdmin,
  mockGroupBasic,
  mockPermissionsTab,
  mockQueryWithGroups,
} from "../../test-utils";

jest.mock("next-auth/react");

jest.mock("@/app/backend/user-management", () => ({
  getAllUsers: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getUserRole: jest.fn(),
}));

jest.mock("@/app/backend/query-building/service", () => ({
  getCustomQueries: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/app/backend/usergroup-management", () => ({
  getAllUserGroups: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getSingleQueryGroupAssignments: jest
    .fn()
    .mockResolvedValue({ items: [], totalItems: 0 }),
  getAllGroupMembers: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getAllGroupQueries: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
}));

jest.mock("@/app/backend/query-building/service", () => ({
  getCustomQueries: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

jest.mock(
  "@/app/(pages)/userManagement/components/userModal/userModal",
  () => () => <div>Modal Mock</div>,
);

describe("Super Admin view of Users Table", () => {
  const role = UserRole.SUPER_ADMIN;
  it("renders error message when no users are found", async () => {
    render(
      <RootProviderMock currentPage="/userManagement">
        <UserManagementContainer role={role} />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("No users found")).toBeInTheDocument();
    });

    expect(document.body).toMatchSnapshot();
  });

  it("renders table view after content is loaded", async () => {
    jest.spyOn(UserManagementBackend, "getAllUsers").mockResolvedValueOnce({
      items: [mockAdmin, mockSuperAdmin],
      totalItems: 2,
    });

    render(
      <RootProviderMock currentPage="/userManagement">
        <UserManagementContainer role={role} />
      </RootProviderMock>,
    );

    expect(document.body).toMatchSnapshot();

    if (mockPermissionsTab.renderContent) {
      render(mockPermissionsTab.renderContent());
    }

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(document.body).toHaveTextContent("Potter, Harry");
    expect(document.body).toHaveTextContent("Order of the Phoenix");
    expect(document.body).toMatchSnapshot();

    jest.restoreAllMocks();
  });

  it("renders content on tab click", async () => {
    jest.spyOn(QueryBuildingBackend, "getCustomQueries").mockResolvedValue([]);

    jest.spyOn(UserManagementBackend, "getAllUsers").mockResolvedValueOnce({
      items: [mockAdmin, mockSuperAdmin],
      totalItems: 2,
    });
    jest
      .spyOn(UserGroupManagementBackend, "getAllUserGroups")
      .mockResolvedValueOnce({
        items: [mockGroupBasic],
        totalItems: 1,
      });
    jest
      .spyOn(QueryBuildingBackend, "getCustomQueries")
      .mockResolvedValueOnce([mockQueryWithGroups]);
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/userManagement">
        <UserManagementContainer role={role} />
      </RootProviderMock>,
    );
    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(document.body).toMatchSnapshot();
    const usersTab = document.getElementsByClassName("tab__active")[0];
    expect(usersTab).toHaveTextContent("Users");
    expect(document.body).toHaveTextContent("Permissions");

    const groupsTab = document.getElementsByClassName("tab")[0];
    expect(groupsTab).toHaveTextContent("User groups");

    await user.click(groupsTab);
    expect(groupsTab).toHaveClass("tab__active");

    expect(document.body).toHaveTextContent("Create group");
    expect(document.body).toMatchSnapshot();

    jest.restoreAllMocks();
  });

  it("opens modals and fetches group members/queries when switching tabs", async () => {
    jest.spyOn(UserManagementBackend, "getAllUsers").mockResolvedValue({
      items: [mockAdmin, mockSuperAdmin],
      totalItems: 2,
    });
    jest
      .spyOn(UserGroupManagementBackend, "getAllUserGroups")
      .mockResolvedValue({
        items: [mockGroupBasic],
        totalItems: 1,
      });
    const getMembersSpy = jest
      .spyOn(UserGroupManagementBackend, "getAllGroupMembers")
      .mockResolvedValue({ items: [mockAdmin], totalItems: 1 });
    const getQueriesSpy = jest
      .spyOn(UserGroupManagementBackend, "getAllGroupQueries")
      .mockResolvedValue({ items: [mockQueryWithGroups], totalItems: 1 });

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/userManagement">
        <UserManagementContainer role={role} />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    // Users tab renders the "Add user" button, which opens the create-user modal
    const addUserBtn = screen.getByRole("button", { name: "Add user" });
    await user.click(addUserBtn);

    // switch to the groups tab
    await user.click(screen.getByRole("button", { name: "User groups" }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Create group" }),
      ).toBeInTheDocument();
    });

    // opening the create-group modal
    await user.click(screen.getByRole("button", { name: "Create group" }));

    // the members button triggers fetchGroupMembers
    const memberBtn = await screen.findByTestId("edit-member-list-0");
    await user.click(memberBtn);
    await waitFor(() =>
      expect(getMembersSpy).toHaveBeenCalledWith(mockGroupBasic.id),
    );

    // the queries button triggers fetchGroupQueries
    const queryBtn = await screen.findByTestId("edit-query-list-0");
    await user.click(queryBtn);
    await waitFor(() =>
      expect(getQueriesSpy).toHaveBeenCalledWith(mockGroupBasic.id),
    );

    // switching back to the Users tab re-fetches and re-renders the users table
    await user.click(screen.getByRole("button", { name: "Users" }));
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add user" }),
      ).toBeInTheDocument();
    });

    jest.restoreAllMocks();
  });
});

describe("Admin view of Users Table", () => {
  const role = UserRole.ADMIN;
  it("renders error message when no user groups are found", async () => {
    render(
      <RootProviderMock currentPage="/userManagement">
        <UserManagementContainer role={role} />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No user groups found")).toBeInTheDocument();
    expect(document.body).toMatchSnapshot();
    jest.restoreAllMocks();
  });
});
