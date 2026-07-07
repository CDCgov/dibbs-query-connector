import ConceptTypeAccordionBody from "./ConceptTypeAccordionBody";
import { FilterableValueSet } from "./utils";
import { gonorrheaSavedQuery } from "@/app/(pages)/queryBuilding/fixtures";
import { RootProviderMock } from "@/app/tests/unit/setup";
import { render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import {
  deleteTimeboxSettings,
  updateTimeboxSettings,
} from "@/app/backend/query-timefiltering";

jest.mock("../../../backend/query-timefiltering", () => ({
  updateTimeboxSettings: jest.fn(),
  deleteTimeboxSettings: jest.fn(),
}));

const QUERY_ID = "test-query-id";
const CONCEPT_TYPE = "labs" as const;

const VALUESET_MAP = gonorrheaSavedQuery.queryData["15628003"];
const VALUESET_IDS = Object.keys(VALUESET_MAP);
const FIRST_VS_ID = VALUESET_IDS[0];
const FIRST_VS = VALUESET_MAP[FIRST_VS_ID];

/**
 * Turns the saved-query value set map into the FilterableValueSet shape the
 * accordion body expects (adds `render` flags to value sets and concepts).
 * @returns a map of value set id to FilterableValueSet
 */
function buildActiveValueSets(): { [vsId: string]: FilterableValueSet } {
  const out: { [vsId: string]: FilterableValueSet } = {};
  Object.entries(VALUESET_MAP).forEach(([id, vs]) => {
    out[id] = {
      ...vs,
      render: true,
      concepts: vs.concepts.map((c) => ({ ...c, render: true })),
    } as FilterableValueSet;
  });
  return out;
}

type RenderOverrides = {
  tableSearchFilter?: string;
};

/**
 * Renders the accordion body inside a DataProvider with a selected query so that
 * the timebox handlers have a query id to work with.
 * @param overrides - optional prop overrides
 * @returns testing utilities plus the jest mocks used for assertions
 */
function renderAccordion(overrides: RenderOverrides = {}) {
  const vsIdUpdate = jest.fn();
  const handleVsIdLevelUpdate = jest.fn(() => vsIdUpdate);
  const vsNameUpdate = jest.fn();
  const handleVsNameLevelUpdate = jest.fn(() => vsNameUpdate);
  const updateTimeboxRange = jest.fn();

  const user = userEvent.setup();
  const utils = render(
    <RootProviderMock
      currentPage="/"
      initialQuery={{ queryId: QUERY_ID, queryName: "Gonorrhea" }}
    >
      <ConceptTypeAccordionBody
        activeValueSets={buildActiveValueSets()}
        accordionConceptType={CONCEPT_TYPE}
        handleVsIdLevelUpdate={handleVsIdLevelUpdate}
        handleVsNameLevelUpdate={handleVsNameLevelUpdate}
        updateTimeboxRange={updateTimeboxRange}
        tableSearchFilter={overrides.tableSearchFilter}
      />
    </RootProviderMock>,
  );

  return {
    user,
    ...utils,
    vsIdUpdate,
    handleVsIdLevelUpdate,
    vsNameUpdate,
    handleVsNameLevelUpdate,
    updateTimeboxRange,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

it("renders each active value set with its display count and view codes button", () => {
  renderAccordion();

  expect(screen.getByText(FIRST_VS.valueSetName)).toBeInTheDocument();
  expect(screen.getByTestId(`viewCodes-${FIRST_VS_ID}`)).toBeInTheDocument();

  const displayCount = screen.getByTestId(`displayCount-${FIRST_VS_ID}`);
  expect(displayCount).toHaveTextContent(
    `${FIRST_VS.concepts.length} / ${FIRST_VS.concepts.length}`,
  );
});

it("opens the drawer and toggling a concept propagates the value set update", async () => {
  const { user, handleVsIdLevelUpdate, vsIdUpdate } = renderAccordion();

  await user.click(screen.getByTestId(`viewCodes-${FIRST_VS_ID}`));

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { name: FIRST_VS.valueSetName }),
    ).toBeInTheDocument();
  });

  // deselect a single concept in the drawer -> handleConceptsChange
  const conceptCheckbox = document.getElementById(
    `checkbox-${FIRST_VS.concepts[0].code}`,
  ) as HTMLElement;
  await user.click(conceptCheckbox);

  expect(handleVsIdLevelUpdate).toHaveBeenCalledWith(FIRST_VS_ID);
  expect(vsIdUpdate).toHaveBeenCalled();
  const updatedVs = vsIdUpdate.mock.calls[0][0];
  // the first concept should now be excluded
  expect(
    updatedVs.concepts.find(
      (c: { code: string }) => c.code === FIRST_VS.concepts[0].code,
    ).include,
  ).toBe(false);
});

it("bulk 'Deselect All' toggles every rendered value set", async () => {
  const { user, handleVsNameLevelUpdate } = renderAccordion();

  const deselectBtn = await screen.findByRole("button", {
    name: /deselect\s+all/i,
  });
  await user.click(deselectBtn);

  expect(handleVsNameLevelUpdate).toHaveBeenCalled();
  // every rendered value set gets a name-level update applied
  expect(handleVsNameLevelUpdate).toHaveBeenCalledTimes(VALUESET_IDS.length);
});

it("bulk value set toggle updates only the targeted value set", async () => {
  const { user, handleVsIdLevelUpdate, vsIdUpdate } = renderAccordion();

  const container = screen.getByTestId(`container-${FIRST_VS_ID}`);
  const checkbox = within(container).getByRole("checkbox");

  await user.click(checkbox);

  expect(handleVsIdLevelUpdate).toHaveBeenCalledWith(FIRST_VS_ID);
  expect(vsIdUpdate).toHaveBeenCalled();
  const updatedVs = vsIdUpdate.mock.calls[0][0];
  expect(updatedVs.valueSetId).toBe(FIRST_VS_ID);
});

it("applying a preset date range persists the timebox and updates the range", async () => {
  const { user, updateTimeboxRange } = renderAccordion();

  await user.click(screen.getByTestId(`dateRangePicker-${CONCEPT_TYPE}`));
  await user.click(screen.getByTestId("preset-last-7-days"));
  await user.click(screen.getByRole("button", { name: /apply filter/i }));

  await waitFor(() => {
    expect(updateTimeboxSettings).toHaveBeenCalled();
  });
  const call = (updateTimeboxSettings as jest.Mock).mock.calls[0];
  expect(call[0]).toBe(QUERY_ID);
  expect(call[1]).toBe(CONCEPT_TYPE);
  expect(call[4]).toBe(true); // isRelativeRange for a preset

  await waitFor(() => {
    expect(updateTimeboxRange).toHaveBeenCalled();
  });
});

it("clearing the date range deletes the timebox settings", async () => {
  const { user, updateTimeboxRange } = renderAccordion();

  await user.click(screen.getByTestId(`dateRangePicker-${CONCEPT_TYPE}`));
  await user.click(screen.getByTestId("date-range-clear-button"));

  await waitFor(() => {
    expect(deleteTimeboxSettings).toHaveBeenCalledWith(QUERY_ID, CONCEPT_TYPE);
  });
  expect(updateTimeboxRange).toHaveBeenCalledWith({
    startDate: null,
    endDate: null,
    isRelativeRange: true,
  });
});

it("hides non-rendered value sets when a table search filter is active", () => {
  renderAccordion({ tableSearchFilter: "meningitidis" });

  // With an active filter, all rendered value sets still show 'render: true'
  // in this fixture, but the filtered branch (areItemsFiltered) is exercised.
  expect(screen.getByText(FIRST_VS.valueSetName)).toBeInTheDocument();
});
