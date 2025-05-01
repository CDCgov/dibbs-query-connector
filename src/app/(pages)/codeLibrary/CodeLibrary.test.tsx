import { screen, render, act } from "@testing-library/react";
import { RootProviderMock } from "@/app/tests/unit/setup";
import {
  gonorrheaValueSets,
  cancerValueSets,
  conditionIdToNameMap,
} from "../queryBuilding/fixtures";
import CodeLibrary from "./page";
import {
  getAllValueSets,
  getConditionsData,
} from "@/app/shared/database-service";

jest.mock("next-auth/react");

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

jest.mock(".../../../shared/database-service", () => ({
  getAllValueSets: jest.fn().mockReturnValue({ items: [] }),
  getConditionsData: jest.fn().mockReturnValue({}),
  groupConditionConceptsIntoValueSets: jest.fn().mockReturnValue([]),
}));

describe("Code library loading view", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("renders a skeleton loading state when loading is true", async () => {
    await act(() =>
      render(
        <RootProviderMock currentPage="/codeLibrary">
          <CodeLibrary />
        </RootProviderMock>,
      ),
    );
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
    expect(document.body).toMatchSnapshot();
  });
});

describe("Code library rendered view", () => {
  const valueSets = [cancerValueSets, gonorrheaValueSets].flat();

  beforeEach(async () => {
    (getConditionsData as jest.Mock).mockReturnValue({
      conditionIdToNameMap,
    });

    (getAllValueSets as jest.Mock).mockReturnValue({ items: valueSets });

    await act(() =>
      render(
        <RootProviderMock currentPage="/codeLibrary">
          <CodeLibrary />
        </RootProviderMock>,
      ),
    );

    expect(await screen.findByTestId("table-valuesets")).toBeInTheDocument();
  });

  it("renders the correct content", async () => {
    const header = screen.getByRole("heading");
    const infoAlert = screen.queryAllByTestId("alert")[0];

    expect(header).toHaveTextContent("Manage codes");
    expect(infoAlert).toHaveTextContent(
      "Value sets are an organizational structure for easy management of codes. Every code belongs to a value set.",
    );

    const tableBody = await screen.findByTestId("table-valuesets");
    expect(tableBody.childNodes[0]).toHaveTextContent(
      cancerValueSets[1].valueset_name,
    );
    expect(tableBody.childNodes[1]).toHaveTextContent(
      gonorrheaValueSets[1].valueset_name,
    );
    expect(document.body).toMatchSnapshot();
  });

  it("renders concept codes for the value set when clicked", async () => {
    const tableBody = await screen.findByTestId("table-codes");
    act(() => (tableBody.firstChild as HTMLElement).click());

    expect(
      await screen.findByText(
        "This value set comes from DIBBs and cannot be modified.",
      ),
    ).toBeVisible();

    expect(tableBody.childNodes).toHaveLength(2);
    expect(document.body).toMatchSnapshot();
  });
});
