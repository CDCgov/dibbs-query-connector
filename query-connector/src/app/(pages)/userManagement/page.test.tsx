import UserManagement from "./page";
import { render, waitFor, screen } from "@testing-library/react";
import * as UserManagementBackend from "@/app/backend/user-management";
import { RoleTypeValues } from "@/app/models/entities/user-management";
import { RootProviderMock } from "@/app/tests/unit/setup";

jest.mock("@/app/backend/user-management", () => ({
  getUsers: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  updateUserRole: jest.fn(),
}));

describe("User Management: User tab", () => {
  it("Loads user list and not users are found", async () => {
    render(
      <RootProviderMock currentPage="/userManagement">
        <UserManagement />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(screen.getByText("No users found")).toBeInTheDocument();
    expect(document.body).toMatchSnapshot();
  });

  it("Loads user list successfully", async () => {
    jest.spyOn(UserManagementBackend, "getUsers").mockResolvedValue({
      items: [
        {
          id: "123",
          username: "harrypotter",
          first_name: "harry",
          last_name: "potter",
          qc_role: RoleTypeValues.Admin,
        },
        {
          id: "456",
          username: "lilypotter",
          first_name: "lily",
          last_name: "potter",
          qc_role: RoleTypeValues.Admin,
          userGroups: [
            {
              id: "123",
              name: "Team 1",
              memberSize: 1,
              querySize: 0,
            },
          ],
        },
      ],
      totalItems: 1,
    });

    render(
      <RootProviderMock currentPage="/userManagement">
        <UserManagement />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(screen.getByText("potter, harry")).toBeInTheDocument();
    expect(document.body).toMatchSnapshot();
  });

  it("Loads with error while retrieving users", async () => {
    jest
      .spyOn(UserManagementBackend, "getUsers")
      .mockRejectedValueOnce(new Error("Random error"));

    render(
      <RootProviderMock currentPage="/userManagement">
        <UserManagement />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    // how do I check the toast here?
  });
});
