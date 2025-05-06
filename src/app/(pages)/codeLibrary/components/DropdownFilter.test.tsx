import { render, screen } from "@testing-library/react";
import { RootProviderMock } from "@/app/tests/unit/setup";
import { mockDibbsValueSets } from "../../queryBuilding/fixtures";
import DropdownFilter from "./DropdownFilter";

jest.mock("next-auth/react");

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

describe("DropdownFilter", () => {
  beforeAll(() => {});
  it("renders correctly", async () => {
    render(
      <RootProviderMock currentPage="/auditLogs">
        <DropdownFilter
          filterSearch={{
            category: undefined,
            codeSystem: "",
            creator: "",
          }}
          setFilterSearch={jest.fn()}
          setShowFilters={jest.fn()}
          valueSets={mockDibbsValueSets}
          loading={false}
          filterCount={0}
        />
      </RootProviderMock>,
    );

    const selectDropdowns = await screen.findAllByRole("combobox");
    expect(selectDropdowns[0].id).toBe("category");
    expect(selectDropdowns[1].id).toBe("code-system");
    expect(selectDropdowns[2].id).toBe("creator");

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("Created by me");
    expect(buttons[1]).toHaveTextContent("Created by my team");
    expect(document.body).toMatchSnapshot();
  });

  it("renders a 'clear filters' button when filters are applied", async () => {
    render(
      <RootProviderMock currentPage="/auditLogs">
        <DropdownFilter
          filterSearch={{
            category: "labs",
            codeSystem: "",
            creator: "",
          }}
          setFilterSearch={jest.fn()}
          setShowFilters={jest.fn()}
          valueSets={mockDibbsValueSets}
          loading={false}
          filterCount={1}
        />
      </RootProviderMock>,
    );

    const selectDropdowns = await screen.findAllByRole("combobox");
    expect(selectDropdowns[0].id).toBe("category");
    expect(selectDropdowns[1].id).toBe("code-system");
    expect(selectDropdowns[2].id).toBe("creator");

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[2]).toHaveTextContent("Clear all filters");

    expect(document.body).toMatchSnapshot();
  });
});
