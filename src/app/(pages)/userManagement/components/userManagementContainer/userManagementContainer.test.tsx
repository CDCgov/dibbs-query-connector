import { waitFor, screen, render } from "@testing-library/react";
import * as UserManagementBackend from "@/app/backend/user-management";
import * as UserGroupManagementBackend from "@/app/backend/usergroup-management";
import * as QueryBuildingBackend from "@/app/backend/query-building/service";
import { UserRole } from "@/app/models/entities/users";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import UsersTable from "./userManagementContainer";
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
}));

jest.mock("@/app/backend/query-building/service", () => ({
  getCustomQueries: jest.fn().mockResolvedValue([]),
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
        <UsersTable role={role} />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No users found")).toBeInTheDocument();
    expect(document.body).toMatchSnapshot();
  });

  it("renders table view after content is loaded", async () => {
    jest.spyOn(UserManagementBackend, "getAllUsers").mockResolvedValueOnce({
      items: [mockAdmin, mockSuperAdmin],
      totalItems: 2,
    });

    render(
      <RootProviderMock currentPage="/userManagement">
        <UsersTable role={role} />
      </RootProviderMock>,
    );
    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(document.body).toMatchSnapshot();

    if (mockPermissionsTab.renderContent) {
      render(mockPermissionsTab.renderContent());
    }

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
        <UsersTable role={role} />
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
});

describe("Admin view of Users Table", () => {
  const role = UserRole.ADMIN;
  it("renders error message when no user groups are found", async () => {
    render(
      <RootProviderMock currentPage="/userManagement">
        <UsersTable role={role} />
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
