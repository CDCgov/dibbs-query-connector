import { screen } from "@testing-library/react";
import { DataContext } from "@/app/DataProvider";
import {
  getConditionsData,
  getValueSetsAndConceptsByConditionIDs,
} from "../../database-service";
import {
  categoryToConditionNameArrayMap,
  conditionIdToNameMap,
  DEFAULT_QUERIES,
  gonorreheaValueSets,
} from "../fixtures";
import BuildFromTemplates from "./BuildFromTemplates";
import { formatDiseaseDisplay } from "../utils";
import { renderWithUser } from "@/app/tests/unit/setup";

jest.mock("../../database-service", () => ({
  getCustomQueries: jest.fn(),
  getConditionsData: jest.fn(),
  getValueSetsAndConceptsByConditionIDs: jest.fn(),
}));

describe("tests the build from template page interactions", () => {
  const GONORREHEA_ID = 15628003;
  const GONORREHEA_DETAILS = conditionIdToNameMap[GONORREHEA_ID];
  const GONORREHEA_NAME = formatDiseaseDisplay(GONORREHEA_DETAILS.name);

  (getConditionsData as jest.Mock).mockResolvedValue({
    conditionIdToNameMap,
    categoryToConditionNameArrayMap,
  });

  (getValueSetsAndConceptsByConditionIDs as jest.Mock).mockResolvedValue(
    gonorreheaValueSets,
  );

  const mockSetData = jest.fn();
  const mockContextValue = {
    data: DEFAULT_QUERIES,
    setData: mockSetData,
  };

  it("customize query button is disabled unless name and individual condition are defined", async () => {
    const { user } = renderWithUser(
      <DataContext.Provider value={mockContextValue}>
        <BuildFromTemplates
          buildStep={"condition"}
          setBuildStep={jest.fn}
          selectedQuery={{
            queryName: undefined,
            queryId: undefined,
          }}
          setSelectedQuery={jest.fn}
        />
      </DataContext.Provider>,
    );

    expect(screen.getByText("Customize query")).toBeDisabled();

    await user.type(screen.getByTestId("queryNameInput"), "some name");
    await user.click(screen.getByLabelText(GONORREHEA_NAME));

    expect(screen.getByText("Customize query")).not.toBeDisabled();
  });

  it("search filters by category and by condition name", async () => {
    const { user } = renderWithUser(
      <DataContext.Provider value={mockContextValue}>
        <BuildFromTemplates
          buildStep={"condition"}
          setBuildStep={jest.fn}
          selectedQuery={{
            queryName: undefined,
            queryId: undefined,
          }}
          setSelectedQuery={jest.fn}
        />
      </DataContext.Provider>,
    );

    expect(await screen.findByText(GONORREHEA_NAME)).toBeInTheDocument();
    expect(await screen.findByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      await screen.findByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();

    // Name match
    await user.type(
      screen.getByPlaceholderText("Search conditions"),
      "leukemia",
    );
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(screen.queryByText(GONORREHEA_NAME)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Malignant neoplastic disease"),
    ).not.toBeInTheDocument();

    // Category match
    await user.clear(screen.getByPlaceholderText("Search conditions"));
    await user.type(screen.getByPlaceholderText("Search conditions"), "can");

    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(screen.queryByText(GONORREHEA_NAME)).not.toBeInTheDocument();

    // Reset state
    await user.clear(screen.getByPlaceholderText("Search conditions"));
    expect(screen.getByText(GONORREHEA_NAME)).toBeInTheDocument();
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
  });
});
