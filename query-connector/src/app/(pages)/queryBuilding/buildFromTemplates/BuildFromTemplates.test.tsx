import BuildFromTemplates from "@/app/(pages)/queryBuilding/buildFromTemplates/BuildFromTemplates";
import {
  DEFAULT_QUERIES,
  conditionIdToNameMap,
  categoryToConditionNameArrayMap,
  gonorreheaValueSets,
  gonorreheaSavedQuery,
  cancerValueSets,
} from "@/app/(pages)/queryBuilding/fixtures";
import { formatDiseaseDisplay } from "@/app/(pages)/queryBuilding/utils";
import { getSavedQueryById } from "@/app/backend/query-building";
import { DataContext } from "@/app/shared/DataProvider";
import { USE_CASE_DETAILS } from "@/app/shared/constants";
import {
  getConditionsData,
  getValueSetsAndConceptsByConditionIDs,
} from "@/app/shared/database-service";
import { renderWithUser } from "@/app/tests/unit/setup";
import { screen, waitFor } from "@testing-library/dom";

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
  });
  it("search filters reset properly", async () => {
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

    // "can" (2 matches) --> "an" (3 matches, Gonorrehea matched on Sexually Transmitted)
    await user.type(screen.getByPlaceholderText("Search conditions"), "can");
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
    expect(screen.queryByText(GONORREHEA_NAME)).not.toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText("Search conditions"),
      "[ArrowLeft][ArrowLeft][Backspace]",
    );
    expect(screen.getByText(GONORREHEA_NAME)).toBeInTheDocument();
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText("Search conditions"));

    // "can" (2 matches) --> "" (3 matches, testing the empty string case)
    await user.type(screen.getByPlaceholderText("Search conditions"), "can");
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
    expect(screen.queryByText(GONORREHEA_NAME)).not.toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText("Search conditions"),
      "[Backspace][Backspace][Backspace]",
    );
    expect(screen.getByText(GONORREHEA_NAME)).toBeInTheDocument();
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText("Search conditions"));

    // Reset state
    await user.type(screen.getByPlaceholderText("Search conditions"), "leuk");
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
    // click out of the drawer
    await user.click(screen.getByTestId(`${CANCER_ID}-conditionCard`));

    expect(
      screen.getByTestId(`${CANCER_ID}-conditionCard`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${GONORREHEA_ID}-conditionCard-active`),
    ).toBeInTheDocument();
  });

  it("filters search on the valueset selection drawer appropriately", async () => {
    const GONORREHEA_VALUESET_MAP = Object.values(
      gonorreheaSavedQuery.query_data,
    )[0];
    const GONORREHEA_VALUESET_IDS = Object.keys(GONORREHEA_VALUESET_MAP);

    const TEST_ID = GONORREHEA_VALUESET_IDS[0];
    const TEST_VALUESET = GONORREHEA_VALUESET_MAP[TEST_ID];

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

    await waitFor(() => {
      screen.getByText("Save query");
    });

    await user.click(
      screen.getByTestId("15628003-conditionCard", { exact: false }),
    );
    await user.click(
      screen.getByTestId("accordionButton_labs", { exact: false }),
    );
    expect(screen.getByText(TEST_VALUESET.valueSetName)).toBeVisible();

    await user.click(screen.getByTestId(`viewCodes-${TEST_ID}`));

    await waitFor(() => {
      expect(
        screen.getByTestId(`drawer-title-${TEST_VALUESET.valueSetName}`),
      ).toBeVisible();
    });

    const valueSetSearch = screen.getByPlaceholderText(
      "Search by code or name",
    );
    expect(valueSetSearch).toBeVisible();
    expect(screen.getByText(TEST_VALUESET.concepts[0].display)).toBeVisible();
    expect(screen.getByText(TEST_VALUESET.concepts[1].display)).toBeVisible();
    await user.type(valueSetSearch, "meningitidis");
    expect(
      screen.queryByText(TEST_VALUESET.concepts[1].display),
    ).not.toBeInTheDocument();
    await user.clear(valueSetSearch);
    expect(screen.getByText(TEST_VALUESET.concepts[0].display)).toBeVisible();
    expect(screen.getByText(TEST_VALUESET.concepts[1].display)).toBeVisible();
  });
});
