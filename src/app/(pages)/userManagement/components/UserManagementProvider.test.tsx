import { useContext } from "react";
import { screen } from "@testing-library/react";
import { renderWithUser } from "@/app/tests/unit/setup";
import DataProvider, { UserManagementContext } from "./UserManagementProvider";

const Probe: React.FC = () => {
  const ctx = useContext(UserManagementContext);
  const section = ctx.teamQueryEditSection;

  return (
    <div>
      <span data-testid="isOpen">{String(section.isOpen)}</span>
      <span data-testid="title">{section.title}</span>
      <span data-testid="subtitle">{section.subtitle}</span>
      <span data-testid="placeholder">{section.placeholder}</span>
      <span data-testid="subjectType">{String(section.subjectType)}</span>
      <span data-testid="groupId">{section.groupId}</span>
      <span data-testid="subjectCount">{section.subjectData.length}</span>
      <button
        onClick={() =>
          ctx.openEditSection(
            "Members Title",
            "Members Subtitle",
            "Members",
            "g1",
            [{ id: "u1" } as never],
          )
        }
      >
        open-members
      </button>
      <button
        onClick={() =>
          ctx.openEditSection(
            "Queries Title",
            "Queries Subtitle",
            "Queries",
            "g2",
            [],
          )
        }
      >
        open-queries
      </button>
      <button onClick={() => ctx.closeEditSection()}>close</button>
    </div>
  );
};

const renderProbe = () =>
  renderWithUser(
    <DataProvider>
      <Probe />
    </DataProvider>,
  );

describe("UserManagementProvider (DataProvider)", () => {
  it("provides the initial closed edit-section state", () => {
    renderProbe();

    expect(screen.getByTestId("isOpen")).toHaveTextContent("false");
    expect(screen.getByTestId("title")).toHaveTextContent("");
    expect(screen.getByTestId("placeholder")).toHaveTextContent("Search");
    expect(screen.getByTestId("subjectType")).toHaveTextContent("null");
  });

  it("opens the edit section for Members with the members placeholder", async () => {
    const { user } = renderProbe();

    await user.click(screen.getByText("open-members"));

    expect(screen.getByTestId("isOpen")).toHaveTextContent("true");
    expect(screen.getByTestId("title")).toHaveTextContent("Members Title");
    expect(screen.getByTestId("subtitle")).toHaveTextContent(
      "Members Subtitle",
    );
    expect(screen.getByTestId("placeholder")).toHaveTextContent(
      "Search members",
    );
    expect(screen.getByTestId("subjectType")).toHaveTextContent("Members");
    expect(screen.getByTestId("groupId")).toHaveTextContent("g1");
    expect(screen.getByTestId("subjectCount")).toHaveTextContent("1");
  });

  it("opens the edit section for Queries with the queries placeholder", async () => {
    const { user } = renderProbe();

    await user.click(screen.getByText("open-queries"));

    expect(screen.getByTestId("isOpen")).toHaveTextContent("true");
    expect(screen.getByTestId("placeholder")).toHaveTextContent(
      "Search queries",
    );
    expect(screen.getByTestId("subjectType")).toHaveTextContent("Queries");
    expect(screen.getByTestId("groupId")).toHaveTextContent("g2");
  });

  it("resets the edit-section state when closed", async () => {
    const { user } = renderProbe();

    await user.click(screen.getByText("open-members"));
    expect(screen.getByTestId("isOpen")).toHaveTextContent("true");

    await user.click(screen.getByText("close"));

    expect(screen.getByTestId("isOpen")).toHaveTextContent("false");
    expect(screen.getByTestId("title")).toHaveTextContent("");
    expect(screen.getByTestId("placeholder")).toHaveTextContent("Search");
    expect(screen.getByTestId("subjectType")).toHaveTextContent("null");
  });
});
