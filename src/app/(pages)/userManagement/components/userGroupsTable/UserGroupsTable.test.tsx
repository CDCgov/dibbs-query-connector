import React from "react";
import { waitFor, screen, render } from "@testing-library/react";
import UserGroupsTable from "./UserGroupsTable";
import {
  mockGroupMany,
  mockGroupWithSingleQuery,
  allGroups,
} from "../../test-utils";
import { RootProviderMock } from "@/app/tests/unit/setup";

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

describe("User Groups table", () => {
  it("renders the correct label syntax based on member/query size", async () => {
    render(
      <RootProviderMock currentPage="/userManagement">
        <UserGroupsTable
          openModal={jest.fn()}
          userGroups={allGroups}
          fetchGroupMembers={jest.fn()}
          fetchGroupQueries={jest.fn()}
          modalData={""}
        />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    const singleMemberBtn = screen.getByTestId(
      `edit-member-list-${allGroups.indexOf(mockGroupWithSingleQuery)}`,
    );
    const multiMemberBtn = screen.getByTestId(
      `edit-member-list-${allGroups.indexOf(mockGroupMany)}`,
    );
    const singleQueryBtn = screen.getByTestId(
      `edit-query-list-${allGroups.indexOf(mockGroupWithSingleQuery)}`,
    );
    const multiQueryBtn = screen.getByTestId(
      `edit-query-list-${allGroups.indexOf(mockGroupMany)}`,
    );

    expect(singleMemberBtn).toHaveTextContent(
      mockGroupWithSingleQuery.memberSize + " member",
    );

    expect(multiMemberBtn).toHaveTextContent(
      mockGroupMany.memberSize + " members",
    );

    expect(singleQueryBtn).toHaveTextContent(
      mockGroupWithSingleQuery.querySize + " query",
    );

    expect(multiQueryBtn).toHaveTextContent(
      mockGroupMany.querySize + " queries",
    );

    expect(document.body).toMatchSnapshot();
    jest.restoreAllMocks();
  });
});
