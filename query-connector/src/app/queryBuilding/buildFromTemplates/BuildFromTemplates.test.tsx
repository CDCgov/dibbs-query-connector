import { screen, waitFor } from "@testing-library/react";
import { DataContext } from "@/app/DataProvider";
import {
  getConditionsData,
  getValueSetsAndConceptsByConditionIDs,
} from "../../database-service";
import {
  cancerValueSets,
  categoryToConditionNameArrayMap,
  conditionIdToNameMap,
  DEFAULT_QUERIES,
  gonorreheaSavedQuery,
  gonorreheaValueSets,
} from "../fixtures";
import BuildFromTemplates from "./BuildFromTemplates";
import { formatDiseaseDisplay } from "../utils";
import { renderWithUser } from "@/app/tests/unit/setup";
import { USE_CASE_DETAILS } from "@/app/constants";
import { getSavedQueryById } from "@/app/backend/query-building";

jest.mock("../../database-service", () => ({
  getCustomQueries: jest.fn(),
  getConditionsData: jest.fn(),
  getValueSetsAndConceptsByConditionIDs: jest.fn(),
}));

jest.mock("../../backend/query-building", () => ({
  getSavedQueryById: jest.fn(),
}));
const mockSetData = jest.fn();
const mockContextValue = {
  data: DEFAULT_QUERIES,
  setData: mockSetData,
};

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

(getSavedQueryById as jest.Mock).mockResolvedValue(gonorreheaSavedQuery);

describe("tests the build from template page interactions", () => {
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

describe("tests the valueset selection page interactions", () => {
  it("filters search on the condition selection drawer appropriately", async () => {
    const { user } = renderWithUser(
      <DataContext.Provider value={mockContextValue}>
        <BuildFromTemplates
          buildStep={"valueset"}
          setBuildStep={jest.fn}
          selectedQuery={{
            queryName: "Gonorrhea case investigation",
            queryId: USE_CASE_DETAILS["gonorrhea"].id,
          }}
          setSelectedQuery={jest.fn}
        />
      </DataContext.Provider>,
    );
    await waitFor(() => screen.getByText("Save query"));
    await user.click(screen.getByTestId("add-left-rail"));

    const drawerConditionsSearch =
      screen.getByPlaceholderText("Search conditions");
    expect(drawerConditionsSearch).toBeVisible();

    const CANCER_NAME = "Cancer (Leukemia)";
    const SYPHILIS_NAME = "Syphilis";
    expect(screen.getByText(SYPHILIS_NAME)).toBeInTheDocument();
    await user.type(drawerConditionsSearch, CANCER_NAME);
    expect(screen.queryByText(SYPHILIS_NAME)).not.toBeInTheDocument();
    expect(screen.getByText(CANCER_NAME)).toBeInTheDocument();

    (getValueSetsAndConceptsByConditionIDs as jest.Mock).mockResolvedValueOnce(
      cancerValueSets,
    );

    const CANCER_ID = 2;
    await user.click(screen.getByTestId(`condition-drawer-add-${CANCER_ID}`));
    expect(
      screen.getByTestId(`condition-drawer-added-${CANCER_ID}`),
    ).toBeInTheDocument();
    await user.click(screen.getByTestId("close-drawer"));

    expect(screen.getByTestId("drawer-open-false")).toBeInTheDocument();
    expect(
      screen.getByTestId(`${CANCER_ID}-conditionCard`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${GONORREHEA_ID}-conditionCard-active`),
    ).toBeInTheDocument();
  });
});
