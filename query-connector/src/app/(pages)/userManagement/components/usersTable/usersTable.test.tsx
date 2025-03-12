import { waitFor, screen, render } from "@testing-library/react";
import * as UserManagementBackend from "@/app/backend/user-management";
import { UserRole } from "@/app/models/entities/users";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import UsersTable from "./usersTable";
import {
  mockSuperAdmin,
  mockAdmin,
  mockGroupBasic,
  mockPermissionsTab,
} from "../../test-utils";

jest.mock("next-auth/react");

jest.mock("@/app/backend/user-management", () => ({
  getUsers: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getUserGroups: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
}));

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
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
    jest.spyOn(UserManagementBackend, "getUsers").mockResolvedValueOnce({
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
    jest.spyOn(UserManagementBackend, "getUsers").mockResolvedValueOnce({
      items: [mockAdmin, mockSuperAdmin],
      totalItems: 2,
    });
    jest.spyOn(UserManagementBackend, "getUserGroups").mockResolvedValueOnce({
      items: [mockGroupBasic],
      totalItems: 2,
    });
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

    expect(document.body).toHaveTextContent("Assigned queries");
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

  it("fetches usergroups on page load", async () => {
    const getUserGroupsSpy = jest
      .spyOn(UserManagementBackend, "getUserGroups")
      .mockResolvedValueOnce({
        items: [mockGroupBasic],
        totalItems: 1,
      });

    render(
      <RootProviderMock currentPage="/userManagement">
        <UsersTable role={role} />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(getUserGroupsSpy).toHaveBeenCalled();
    await screen.findByText(mockGroupBasic.name);
    expect(document.body).toMatchSnapshot();
    jest.restoreAllMocks();
  });
});
