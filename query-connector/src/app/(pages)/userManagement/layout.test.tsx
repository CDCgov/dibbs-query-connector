import { useContext } from "react";
import { waitFor, screen } from "@testing-library/react";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import UserManagementLayout from "./layout";
import { UserManagementContext } from "./components/UserManagementProvider";

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

describe("User Management Layout", () => {
  const MockComponent: React.FC = () => {
    const { openEditSection } = useContext(UserManagementContext);

    return (
      <div>
        <button
          onClick={() => {
            openEditSection("Mock title", "Mock subtitle", "Query", "123");
          }}
        >
          Open edit section
        </button>
      </div>
    );
  };

  it("Integrates the query edit section with all inner pages ", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/userManagement">
        <UserManagementLayout>
          {" "}
          <MockComponent />
        </UserManagementLayout>
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading")).not.toBeInTheDocument();
    });

    const openBtn = screen.getByRole("button", { name: "Open edit section" });
    expect(screen.queryByText("Mock title")).not.toBeInTheDocument();
    // Open section
    await user.click(openBtn);
    expect(screen.queryByText("Mock title")).toBeInTheDocument();
    expect(screen.queryByTestId("drawer-open-true")).toBeInTheDocument();
    expect(document.body).toMatchSnapshot();
    // Close section
    const closeBtn = screen.getByTestId("close-drawer");
    await user.click(closeBtn);
    expect(screen.queryByTestId("drawer-open-true")).not.toBeInTheDocument();
    expect(screen.queryByTestId("drawer-open-false")).toBeInTheDocument();
  });
});
