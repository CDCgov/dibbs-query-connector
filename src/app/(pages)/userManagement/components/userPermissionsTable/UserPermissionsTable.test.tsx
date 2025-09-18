import { waitFor, screen, render } from "@testing-library/react";
import * as UserManagementBackend from "@/app/backend/user-management";
import { UserRole } from "@/app/models/entities/users";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import UserPermissionsTable from "./userPermissionsTable";
import {
  mockAdmin,
  mockSuperAdmin,
  mockPermissionsTab,
} from "../../test-utils";
import { createRef, RefObject } from "react";

jest.mock("next-auth/react");

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

jest.mock("@/app/backend/user-management", () => ({
  getAllUsers: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getUserGroups: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  updateUserRole: jest.fn(),
}));

jest.mock("@/app/backend/query-building/service", () => ({
  getConditionsData: jest.fn(),
}));

const mockRefs = createRef<RefObject<HTMLTableRowElement | null>[]>();
mockRefs.current = [];

describe("User Management: User tab", () => {
  it("Loads user list successfully", async () => {
    jest.spyOn(UserManagementBackend, "getAllUsers").mockResolvedValue({
      items: [mockAdmin, mockSuperAdmin],
      totalItems: 2,
    });

    render(
      <RootProviderMock currentPage="/userManagement">
        <UserPermissionsTable
          openModal={jest.fn()}
          setUsers={jest.fn()}
          users={[mockAdmin, mockSuperAdmin]}
          fetchGroupMembers={jest.fn()}
          rowFocusRefs={mockRefs}
          modalData={""}
        />
      </RootProviderMock>,
    );
    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    if (mockPermissionsTab.renderContent) {
      render(mockPermissionsTab.renderContent());
    }
    expect(screen.queryAllByText("Potter, Harry")).toBeTruthy();
    expect(screen.queryAllByText("Potter, Lily")).toBeTruthy();
    expect(document.body).toMatchSnapshot();
  });

  it("Changes a user's role", async () => {
    jest.spyOn(UserManagementBackend, "getAllUsers").mockResolvedValue({
      items: [mockAdmin, mockSuperAdmin],
      totalItems: 2,
    });

    const updateRoleFnSpy = jest
      .spyOn(UserManagementBackend, "updateUserRole")
      .mockResolvedValue({
        totalItems: 1,
        items: [
          {
            ...mockAdmin,
            qcRole: UserRole.SUPER_ADMIN,
          },
        ],
      });

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/userManagement">
        <UserPermissionsTable
          openModal={jest.fn()}
          setUsers={jest.fn()}
          users={[mockAdmin, mockSuperAdmin]}
          fetchGroupMembers={jest.fn()}
          rowFocusRefs={mockRefs}
          modalData={""}
        />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    if (mockPermissionsTab.renderContent) {
      render(mockPermissionsTab.renderContent());
    }

    const adminDropdown = screen.queryAllByTestId(
      `role-select-${mockAdmin.id}`,
    )[0];

    expect(adminDropdown).toHaveValue("Admin");
    await user.selectOptions(adminDropdown, ["Super Admin"]);
    expect(adminDropdown).toHaveValue("Super Admin");
    expect(updateRoleFnSpy).toHaveBeenCalledWith(mockAdmin.id, "Super Admin");
  });
});
