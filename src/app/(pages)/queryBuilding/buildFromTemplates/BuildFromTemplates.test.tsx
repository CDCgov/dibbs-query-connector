import BuildFromTemplates from "@/app/(pages)/queryBuilding/buildFromTemplates/BuildFromTemplates";
import {
  conditionIdToNameMap,
  categoryToConditionNameArrayMap,
  gonorrheaValueSets,
  gonorrheaSavedQuery,
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
import { getSavedQueryById } from "@/app/backend/query-building/service";

jest.mock("../../../shared/database-service", () => ({
  getCustomQueries: jest.fn(),
  getConditionsData: jest.fn(),
  getValueSetsAndConceptsByConditionIDs: jest.fn(),
}));

jest.mock("../../../backend/query-building/service", () => ({
  getSavedQueryById: jest.fn(),
}));

jest.mock("../../../backend/query-timefiltering", () => ({
  getTimeboxRanges: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: jest.fn(),
  }),
}));

const currentPage = "/";
const CUSTOM_CONDITION_NAME = "Custom Code Condition";
const GONORRHEA_ID = 15628003;
const GONORRHEA_DETAILS = conditionIdToNameMap[GONORRHEA_ID];
const GONORRHEA_NAME = formatDiseaseDisplay(GONORRHEA_DETAILS.name);

(getConditionsData as jest.Mock).mockResolvedValue({
  conditionIdToNameMap,
  categoryToConditionNameArrayMap,
});

(getValueSetsAndConceptsByConditionIDs as jest.Mock).mockResolvedValue(
  gonorrheaValueSets,
);

(getSavedQueryById as jest.Mock).mockResolvedValue(gonorrheaSavedQuery);

it("customize query button is disabled unless name and individual condition are defined", async () => {
  const { user } = renderWithUser(
    <RootProviderMock
      currentPage={currentPage}
      initialQuery={{
        queryName: undefined,
        queryId: undefined,
      }}
    >
      <BuildFromTemplates buildStep={"condition"} setBuildStep={jest.fn} />
    </RootProviderMock>,
  );

  expect(screen.getByText("Customize query")).toBeDisabled();

  await user.type(screen.getByTestId("queryNameInput"), "some name");
  await user.click(screen.getByLabelText(GONORRHEA_NAME));

  expect(screen.getByText("Customize query")).not.toBeDisabled();
});

it("custom query page does not have custom condition", async () => {
  const { user } = renderWithUser(
    <RootProviderMock
      currentPage={"/"}
      initialQuery={{
        queryName: "Test query",
        queryId: undefined,
      }}
    >
      <BuildFromTemplates buildStep="condition" setBuildStep={jest.fn} />
    </RootProviderMock>,
  );

  expect(screen.queryByText(CUSTOM_CONDITION_NAME)).not.toBeInTheDocument();
  await screen.findByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER);
  await user.type(
    screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
    "Custom",
  );

  expect(screen.queryByText(CUSTOM_CONDITION_NAME)).not.toBeInTheDocument();
});

it("search filters by category and by condition name", async () => {
  const { user } = renderWithUser(
    <RootProviderMock
      currentPage={currentPage}
      initialQuery={{
        queryName: undefined,
        queryId: undefined,
      }}
    >
      <BuildFromTemplates buildStep={"condition"} setBuildStep={jest.fn} />
    </RootProviderMock>,
  );

  expect(await screen.findByText(GONORRHEA_NAME)).toBeInTheDocument();
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
  expect(screen.queryByText(GONORRHEA_NAME)).not.toBeInTheDocument();
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

  expect(screen.getByText("Malignant neoplastic disease")).toBeInTheDocument();
  expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
  expect(screen.queryByText(GONORRHEA_NAME)).not.toBeInTheDocument();
});
it("search filters reset properly", async () => {
  const { user } = renderWithUser(
    <RootProviderMock
      currentPage={currentPage}
      initialQuery={{
        queryName: undefined,
        queryId: undefined,
      }}
    >
      <BuildFromTemplates buildStep={"condition"} setBuildStep={jest.fn} />
    </RootProviderMock>,
  );

  expect(await screen.findByText(GONORRHEA_NAME)).toBeInTheDocument();
  expect(await screen.findByText("Cancer (Leukemia)")).toBeInTheDocument();
  expect(
    await screen.findByText("Malignant neoplastic disease"),
  ).toBeInTheDocument();

  // "can" (2 matches) --> "an" (3 matches, Gonorrhea matched on Sexually Transmitted)
  await user.type(
    screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
    "can",
  );
  expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
  expect(screen.getByText("Malignant neoplastic disease")).toBeInTheDocument();
  expect(screen.queryByText(GONORRHEA_NAME)).not.toBeInTheDocument();
  await user.type(
    screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
    "[ArrowLeft][ArrowLeft][Backspace]",
  );
  expect(screen.getByText(GONORRHEA_NAME)).toBeInTheDocument();
  expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
  expect(screen.getByText("Malignant neoplastic disease")).toBeInTheDocument();
  await user.clear(
    screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
  );

  // "can" (2 matches) --> "" (3 matches, testing the empty string case)
  await user.type(
    screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
    "can",
  );
  expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
  expect(screen.getByText("Malignant neoplastic disease")).toBeInTheDocument();
  expect(screen.queryByText(GONORRHEA_NAME)).not.toBeInTheDocument();
  await user.type(
    screen.getByPlaceholderText(CONDITION_DRAWER_SEARCH_PLACEHOLDER),
    "[Backspace][Backspace][Backspace]",
  );
  expect(screen.getByText(GONORRHEA_NAME)).toBeInTheDocument();
  expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
  expect(screen.getByText("Malignant neoplastic disease")).toBeInTheDocument();
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
  expect(screen.getByText(GONORRHEA_NAME)).toBeInTheDocument();
  expect(screen.getByText("Cancer (Leukemia)")).toBeInTheDocument();
  expect(screen.getByText("Malignant neoplastic disease")).toBeInTheDocument();
});

it("removes condition pill and unchecks checkbox when pill X is clicked", async () => {
  const { user } = renderWithUser(
    <RootProviderMock
      currentPage={"/"}
      initialQuery={{
        queryName: "Test query",
        queryId: undefined,
      }}
    >
      <BuildFromTemplates buildStep="condition" setBuildStep={jest.fn} />
    </RootProviderMock>,
  );

  const DISPLAY_NAME = formatDiseaseDisplay(GONORRHEA_DETAILS.name);

  // Check the checkbox
  await user.click(await screen.findByLabelText(DISPLAY_NAME));

  // Expect pill to appear
  const pillRegion = await screen.findByTestId("selected-pill-container");
  expect(within(pillRegion).getByText(DISPLAY_NAME)).toBeInTheDocument();

  // Click the pill's X button
  const removeBtn = screen.getByRole("button", {
    name: `Remove ${DISPLAY_NAME}`,
  });
  await user.click(removeBtn);

  // Checkbox should now be unchecked
  expect(screen.getByLabelText(DISPLAY_NAME)).not.toBeChecked();

  // Pill should be gone
  await waitFor(() => {
    expect(
      within(pillRegion).queryByText(DISPLAY_NAME),
    ).not.toBeInTheDocument();
  });
});

describe("tests the valueset selection page interactions", () => {
  const GONORRHEA_VALUESET_MAP = Object.values(
    gonorrheaSavedQuery.queryData,
  )[0];
  const GONORRHEA_VALUESET_IDS = Object.keys(GONORRHEA_VALUESET_MAP);

  const TEST_ID = GONORRHEA_VALUESET_IDS[0];
  const TEST_VALUESET = GONORRHEA_VALUESET_MAP[TEST_ID];
  let user = userEvent.setup();

  beforeEach(async () => {
    render(
      <RootProviderMock
        currentPage={currentPage}
        initialQuery={{
          queryName: "Gonorrhea case investigation",
          queryId: USE_CASE_DETAILS["gonorrhea"].id,
        }}
      >
        <BuildFromTemplates buildStep={"valueset"} setBuildStep={jest.fn} />
      </RootProviderMock>,
    );

    await waitFor(() => {
      screen.getByText("Save query");
    });

    await user.click(screen.getByTestId("15628003-card", { exact: false }));
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
    await user.click(screen.getByTestId(`${CANCER_ID}-card-active`));

    expect(screen.getByTestId(`${CANCER_ID}-card-active`)).toBeInTheDocument();
    expect(screen.getByTestId(`${GONORRHEA_ID}-card`)).toBeInTheDocument();
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

    // the "total" selected values should be just the 2 search results, and since
    // we've bulk toggled them off, none of them should be selected
    // Traverse up to the container, then query the checkbox input
    const checkboxContainer = searchResultLabel.closest(
      '[data-testid^="container-"]',
    ) as HTMLElement;
    const checkbox = within(checkboxContainer).getByRole("checkbox");

    // Toggle off (should uncheck)
    await user.click(checkbox);
    expect(
      screen.getByText((_, el) => el?.textContent === "0 / 2"),
    ).toBeInTheDocument();

    // Toggle on
    await user.click(checkbox);
    expect(
      screen.getByText((_, el) => el?.textContent === "2 / 2"),
    ).toBeInTheDocument();

    // Toggle back off for next check to confirm filtering
    await user.click(checkbox);
    expect(
      screen.getByText((_, el) => el?.textContent === "0 / 2"),
    ).toBeInTheDocument();

    await user.clear(valueSetSearch);
    // when we clear the search filter, the other two non-rendered codes shouldn't
    // have been affected
    const displayCount = screen.getByTestId(`displayCount-${TEST_ID}`);
    expect(displayCount).toHaveTextContent("2 / 4");
    expect(document.body).toMatchSnapshot();

    // Test the accordion - toggle everything visible on
    const selectAllBtn = await screen.findByText("Select All");
    expect(selectAllBtn).toBeInTheDocument();
    await user.click(selectAllBtn);
    expect(screen.getByText("4 / 4")).toBeInTheDocument();

    await user.type(valueSetSearch, "meningitidis");

    // Toggle everything visible off
    const deselectButton = await screen.findByText("Deselect All");
    expect(deselectButton).toBeInTheDocument();
    await user.click(deselectButton);
    expect(screen.getByText("0 / 2")).toBeInTheDocument();

    // Clear search filter

    await user.clear(valueSetSearch);
    expect(screen.getByText("2 / 4")).toBeInTheDocument();

    // ... and the drawer
    await user.type(valueSetSearch, "meningitidis");
    await user.click(screen.getByText("View codes", { exact: false }));
    await user.click(screen.getByText(TEST_VALUESET.concepts[0].code));
    await user.click(screen.getByText(TEST_VALUESET.concepts[3].code));
    expect(screen.getByText("0 / 2")).toBeInTheDocument();
    // close the drawer
    await user.keyboard("{Escape}");
    await user.clear(valueSetSearch);

    expect(screen.getByText("2 / 4")).toBeInTheDocument();
  });
});

describe("custom value set behavior", () => {
  it("renders the empty state if no custom value sets are present", async () => {
    const emptyCustomQuery = {
      ...gonorrheaSavedQuery,
      queryData: {
        ...gonorrheaSavedQuery.queryData,
        custom: {},
      },
    };
    (getSavedQueryById as jest.Mock).mockResolvedValueOnce(emptyCustomQuery);

    const { user } = renderWithUser(
      <RootProviderMock
        currentPage={currentPage}
        initialQuery={{
          queryName: emptyCustomQuery.queryName,
          queryId: emptyCustomQuery.queryId,
        }}
      >
        <BuildFromTemplates buildStep="valueset" setBuildStep={jest.fn} />
      </RootProviderMock>,
    );

    await user.click(
      await screen.findByRole("button", {
        name: /Additional codes from library/i,
      }),
    );

    expect(
      await screen.findByText(
        /This is a space for you to pull in individual value sets/i,
      ),
    ).toBeVisible();
    expect(screen.queryByTestId("accordion-container")).not.toBeInTheDocument();
  });

  it("renders grouped concept accordions if custom value sets are present", async () => {
    const customQueryWithData = {
      ...gonorrheaSavedQuery,
      queryData: {
        ...gonorrheaSavedQuery.queryData,
        custom: {
          ...gonorrheaSavedQuery.queryData[
            Object.keys(gonorrheaSavedQuery.queryData)[0]
          ],
        },
      },
    };
    (getSavedQueryById as jest.Mock).mockResolvedValueOnce(customQueryWithData);

    const { user } = renderWithUser(
      <RootProviderMock
        currentPage={currentPage}
        initialQuery={{
          queryName: customQueryWithData.queryName,
          queryId: customQueryWithData.queryId,
        }}
      >
        <BuildFromTemplates buildStep="valueset" setBuildStep={jest.fn} />
      </RootProviderMock>,
    );

    await user.click(
      await screen.findByRole("button", {
        name: /Additional codes from library/i,
      }),
    );

    expect(await screen.findByTestId("accordion-container")).toBeVisible();
    expect(
      screen.queryByText(
        /This is a space for you to pull in individual value sets/i,
      ),
    ).not.toBeInTheDocument();
  });
});
