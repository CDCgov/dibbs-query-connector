import BuildFromTemplates from "@/app/(pages)/queryBuilding/buildFromTemplates/BuildFromTemplates";
import {
  conditionIdToNameMap,
  categoryToConditionNameArrayMap,
  gonorreheaValueSets,
  gonorreheaSavedQuery,
  cancerValueSets,
} from "@/app/(pages)/queryBuilding/fixtures";
import { formatDiseaseDisplay } from "@/app/(pages)/queryBuilding/utils";
import { USE_CASE_DETAILS } from "@/app/shared/constants";
import {
  getConditionsData,
  getValueSetsAndConceptsByConditionIDs,
} from "@/app/shared/database-service";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import { screen, waitFor, within } from "@testing-library/dom";
import {
  CONDITION_DRAWER_SEARCH_PLACEHOLDER,
  VALUESET_DRAWER_SEARCH_PLACEHOLDER,
  VALUESET_SELECTION_SEARCH_PLACEHOLDER,
} from "../components/utils";
import { userEvent } from "@testing-library/user-event";
import { render } from "@testing-library/react";
import { getSavedQueryById } from "@/app/backend/dbServices/query-building";

jest.mock("../../../shared/database-service", () => ({
  getCustomQueries: jest.fn(),
  getConditionsData: jest.fn(),
  getValueSetsAndConceptsByConditionIDs: jest.fn(),
}));

jest.mock("../../../backend/dbServices/query-building", () => ({
  getSavedQueryById: jest.fn(),
}));

const currentPage = "/";
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
      <RootProviderMock currentPage={currentPage}>
        <BuildFromTemplates
          buildStep={"condition"}
          setBuildStep={jest.fn}
          selectedQuery={{
            queryName: undefined,
            queryId: undefined,
          }}
          setSelectedQuery={jest.fn}
        />
      </RootProviderMock>,
    );

    expect(screen.getByText("Customize query")).toBeDisabled();

    await user.type(screen.getByTestId("queryNameInput"), "some name");
    await user.click(screen.getByLabelText(GONORREHEA_NAME));

    expect(screen.getByText("Customize query")).not.toBeDisabled();
  });

  it("search filters by category and by condition name", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage={currentPage}>
        <BuildFromTemplates
          buildStep={"condition"}
          setBuildStep={jest.fn}
          selectedQuery={{
            queryName: undefined,
            queryId: undefined,
          }}
          setSelectedQuery={jest.fn}
        />
      </RootProviderMock>,
    );

    expect(await screen.findByText(GONORREHEA_NAME)).toBeInTheDocument();
    expect(await screen.findByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      await screen.findByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();

    // Name match
    await user.type(
      screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
      "leukemia",
    );
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(screen.queryByText(GONORREHEA_NAME)).not.toBeInTheDocument();
    expect(
      screen.queryByText("Malignant neoplastic disease"),
    ).not.toBeInTheDocument();

    // Category match
    await user.clear(
      screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
    );
    await user.type(
      screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
      "can",
    );

    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(screen.queryByText(GONORREHEA_NAME)).not.toBeInTheDocument();
  });
  it("search filters reset properly", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage={currentPage}>
        <BuildFromTemplates
          buildStep={"condition"}
          setBuildStep={jest.fn}
          selectedQuery={{
            queryName: undefined,
            queryId: undefined,
          }}
          setSelectedQuery={jest.fn}
        />
      </RootProviderMock>,
    );

    expect(await screen.findByText(GONORREHEA_NAME)).toBeInTheDocument();
    expect(await screen.findByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      await screen.findByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();

    // "can" (2 matches) --> "an" (3 matches, Gonorrehea matched on Sexually Transmitted)
    await user.type(
      screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
      "can",
    );
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
    expect(screen.queryByText(GONORREHEA_NAME)).not.toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
      "[ArrowLeft][ArrowLeft][Backspace]",
    );
    expect(screen.getByText(GONORREHEA_NAME)).toBeInTheDocument();
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
    await user.clear(
      screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
    );

    // "can" (2 matches) --> "" (3 matches, testing the empty string case)
    await user.type(
      screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
      "can",
    );
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
    expect(screen.queryByText(GONORREHEA_NAME)).not.toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
      "[Backspace][Backspace][Backspace]",
    );
    expect(screen.getByText(GONORREHEA_NAME)).toBeInTheDocument();
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
    await user.clear(
      screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
    );

    // Reset state
    await user.type(
      screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
      "leuk",
    );
    await user.clear(
      screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
    );
    expect(screen.getByText(GONORREHEA_NAME)).toBeInTheDocument();
    expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
    expect(
      screen.getByText("Malignant neoplastic disease"),
    ).toBeInTheDocument();
  });
});

describe("tests the valueset selection page interactions", () => {
  const GONORREHEA_VALUESET_MAP = Object.values(
    gonorreheaSavedQuery.query_data,
  )[0];
  const GONORREHEA_VALUESET_IDS = Object.keys(GONORREHEA_VALUESET_MAP);

  const TEST_ID = GONORREHEA_VALUESET_IDS[0];
  const TEST_VALUESET = GONORREHEA_VALUESET_MAP[TEST_ID];
  let user = userEvent.setup();

  beforeEach(async () => {
    render(
      <RootProviderMock currentPage={currentPage}>
        <BuildFromTemplates
          buildStep={"valueset"}
          setBuildStep={jest.fn}
          selectedQuery={{
            queryName: "Gonorrhea case investigation",
            queryId: USE_CASE_DETAILS["gonorrhea"].id,
          }}
          setSelectedQuery={jest.fn}
        />
      </RootProviderMock>,
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
  });

  it("filters search on the condition selection drawer appropriately", async () => {
    await user.click(screen.getByTestId("add-left-rail"));

    const drawerConditionsSearch = screen.getByPlaceholderText(
      CONDITION_DRAWER_SEARCH_PLACEHOLDER,
    );
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
    await user.click(screen.getByTestId(`${CANCER_ID}-conditionCard-active`));

    expect(
      screen.getByTestId(`${CANCER_ID}-conditionCard-active`),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${GONORREHEA_ID}-conditionCard`),
    ).toBeInTheDocument();
  });

  it("filters search on the valueset selection drawer appropriately", async () => {
    await user.click(screen.getByTestId(`viewCodes-${TEST_ID}`));
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: TEST_VALUESET.valueSetName }),
      ).toBeVisible();
    });

    const valueSetSearch = screen.getByPlaceholderText(
      VALUESET_DRAWER_SEARCH_PLACEHOLDER,
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

  it("filters search on the valueset selection table appropriately", async () => {
    const valueSetSearch = screen.getByPlaceholderText(
      VALUESET_SELECTION_SEARCH_PLACEHOLDER,
    );
    expect(valueSetSearch).toBeVisible();
    expect(screen.getByText(TEST_VALUESET.valueSetName)).toBeVisible();

    // search filters populate the right amount of valuesets / codes
    await user.type(valueSetSearch, "meningitidis");
    expect(
      screen.getByText("1 valueset(s) found", { exact: false }),
    ).toBeVisible();
    expect(
      screen.getByText(
        `${TEST_VALUESET.concepts[0].code}, ${TEST_VALUESET.concepts[3].code}`,
        { exact: false },
      ),
    ).toBeVisible();

    // drawer population works
    await user.click(
      screen.getByRole("button", {
        name: /view codes/i,
      }),
    );
    const heading = screen.getByRole("heading", {
      name: TEST_VALUESET.valueSetName,
    });

    expect(
      within(heading).getByText(TEST_VALUESET.valueSetName),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("cell", {
        name: TEST_VALUESET.concepts[0].code,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("cell", {
        name: TEST_VALUESET.concepts[3].code,
      }),
    ).toBeInTheDocument();

    // drawer search works
    const valueSetDrawerSearch = screen.getByPlaceholderText(
      VALUESET_DRAWER_SEARCH_PLACEHOLDER,
    );
    await user.type(valueSetDrawerSearch, TEST_VALUESET.concepts[0].code);

    expect(
      screen.getByRole("cell", {
        name: TEST_VALUESET.concepts[0].display,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("cell", {
        name: TEST_VALUESET.concepts[3].display,
      }),
    ).not.toBeInTheDocument();
  });
  it("filter bulk selection updates only the filtered valuesets", async () => {
    const valueSetSearch = screen.getByPlaceholderText(
      VALUESET_SELECTION_SEARCH_PLACEHOLDER,
    );
    expect(valueSetSearch).toBeVisible();
    expect(screen.getByText(TEST_VALUESET.valueSetName)).toBeVisible();

    // search filters populate the right amount of valuesets / codes
    await user.type(valueSetSearch, "meningitidis");
    expect(
      screen.getByText("1 valueset(s) found", { exact: false }),
    ).toBeVisible();
    const searchResultLabel = screen.getByText(
      `${TEST_VALUESET.concepts[0].code}, ${TEST_VALUESET.concepts[3].code}`,
      { exact: false },
    );
    expect(searchResultLabel).toBeVisible();
    await user.click(searchResultLabel);

    // the "total" selected values should be just the 2 search results, and since
    // we've bulk toggled them off, none of them should be selected
    expect(screen.getByText("0/2")).toBeInTheDocument();
    await user.click(searchResultLabel);

    // toggle on and off again
    expect(screen.getByText("2/2")).toBeInTheDocument();
    await user.click(searchResultLabel);

    await user.clear(valueSetSearch);
    // when we clear the search filter, the other two non-rendered codes shouldn't
    // have been affected
    expect(screen.getByText("2/4")).toBeInTheDocument();

    // do the same for the accordidion
    await user.type(valueSetSearch, "meningitidis");

    await user.click(screen.getByLabelText("Labs", { exact: false }));
    expect(screen.getByText("2/2")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Labs", { exact: false }));
    expect(screen.getByText("0/2")).toBeInTheDocument();

    await user.clear(valueSetSearch);
    expect(screen.getByText("2/4")).toBeInTheDocument();

    // ... and the drawer
    await user.type(valueSetSearch, "meningitidis");
    await user.click(screen.getByText("View codes", { exact: false }));
    await user.click(screen.getByText(TEST_VALUESET.concepts[0].code));
    await user.click(screen.getByText(TEST_VALUESET.concepts[3].code));
    expect(screen.getByText("0/2")).toBeInTheDocument();
    await user.clear(valueSetSearch);
    expect(screen.getByText("2/4")).toBeInTheDocument();
  });
});
