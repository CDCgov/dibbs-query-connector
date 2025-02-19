import { useContext } from "react";
import { waitFor, screen } from "@testing-library/react";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import UserManagementLayout from "./layout";
import {
  SubjectType,
  UserManagementContext,
} from "./components/UserManagementProvider";

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

type MockComponentProps = { type: SubjectType };

const MockComponent: React.FC<MockComponentProps> = ({ type }) => {
  const { openEditSection } = useContext(UserManagementContext);

  return (
    <div>
      <button
        onClick={() => {
          openEditSection("Mock title", "Mock subtitle", type, "123");
        }}
      >
        Open edit section
      </button>
    </div>
  );
};

describe("User Management Layout", () => {
  it.each(["Query", "Members"] as SubjectType[])(
    "Integrates the '%s' edit section with all inner pages ",
    async (sectionType: SubjectType) => {
      const { user } = renderWithUser(
        <RootProviderMock currentPage="/userManagement">
          <UserManagementLayout>
            <MockComponent type={sectionType} />
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
    },
  );
});
