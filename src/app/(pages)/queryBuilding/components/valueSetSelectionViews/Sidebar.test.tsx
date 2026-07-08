import { screen, waitFor } from "@testing-library/react";
import { renderWithUser } from "@/app/tests/unit/setup";
import { Sidebar } from "./Sidebar";
import {
  conditionIdToNameMap,
  categoryToConditionNameArrayMap,
} from "@/app/(pages)/queryBuilding/fixtures";
import { NestedQuery } from "../../utils";
import { CUSTOM_VALUESET_ARRAY_ID } from "@/app/constants";
import { MEDICAL_RECORD_SECTIONS_ID } from "../utils";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

const mockToast = showToastConfirmation as jest.Mock;

// Two active conditions plus an (ignored) custom bucket key.
const constructedQuery = {
  "2": {},
  "15628003": {},
  [CUSTOM_VALUESET_ARRAY_ID]: {},
} as unknown as NestedQuery;

type Overrides = {
  activeCondition?: string;
  constructedQuery?: NestedQuery;
};

/**
 * Renders the Sidebar with sensible defaults and spy callbacks.
 * @param overrides - optional prop overrides
 * @returns testing utilities plus the spy callbacks
 */
function renderSidebar(overrides: Overrides = {}) {
  const setActiveCondition = jest.fn();
  const setValueSetSearchFilter = jest.fn();
  const handleUpdateCondition = jest.fn();

  const utils = renderWithUser(
    <Sidebar
      constructedQuery={overrides.constructedQuery ?? constructedQuery}
      conditionsMap={conditionIdToNameMap}
      activeCondition={overrides.activeCondition ?? "2"}
      setActiveCondition={setActiveCondition}
      setValueSetSearchFilter={setValueSetSearchFilter}
      handleUpdateCondition={handleUpdateCondition}
      categoryToConditionsMap={categoryToConditionNameArrayMap}
    />,
  );

  return {
    ...utils,
    setActiveCondition,
    setValueSetSearchFilter,
    handleUpdateCondition,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Sidebar", () => {
  it("renders a card for each active condition and the fixed section tabs", () => {
    renderSidebar();

    expect(screen.getByTestId("tab-2")).toBeInTheDocument();
    expect(screen.getByTestId("tab-15628003")).toBeInTheDocument();
    expect(screen.getByTestId("tab-custom")).toBeInTheDocument();
    expect(screen.getByTestId("tab-medical-records")).toBeInTheDocument();
  });

  it("marks the active condition card as active and others as inactive", () => {
    renderSidebar({ activeCondition: "2" });

    expect(screen.getByTestId("2-card-active")).toBeInTheDocument();
    expect(screen.getByTestId("15628003-card")).toBeInTheDocument();
  });

  it("skips condition ids that are not present in the conditions map", () => {
    renderSidebar({
      constructedQuery: {
        "2": {},
        "999-unknown": {},
      } as unknown as NestedQuery,
    });

    expect(screen.getByTestId("tab-2")).toBeInTheDocument();
    expect(screen.queryByTestId("tab-999-unknown")).not.toBeInTheDocument();
  });

  it("selecting a condition tab sets it active and clears the value set filter", async () => {
    const { user, setActiveCondition, setValueSetSearchFilter } =
      renderSidebar();

    await user.click(screen.getByTestId("tab-15628003"));

    expect(setActiveCondition).toHaveBeenCalledWith("15628003");
    expect(setValueSetSearchFilter).toHaveBeenCalledWith("");
  });

  it("deleting a condition removes it and moves focus to the next condition", async () => {
    const { user, handleUpdateCondition, setActiveCondition } = renderSidebar();

    await user.click(screen.getByTestId("delete-condition-2"));

    expect(handleUpdateCondition).toHaveBeenCalledWith("2", true);
    // the next non-custom condition becomes active
    expect(setActiveCondition).toHaveBeenCalledWith("15628003");
  });

  it("selecting the custom tab activates the custom value set bucket", async () => {
    const { user, setActiveCondition } = renderSidebar();

    await user.click(screen.getByTestId("tab-custom"));

    expect(setActiveCondition).toHaveBeenCalledWith(CUSTOM_VALUESET_ARRAY_ID);
  });

  it("selecting the medical records tab activates that section", async () => {
    const { user, setActiveCondition } = renderSidebar();

    await user.click(screen.getByTestId("tab-medical-records"));

    expect(setActiveCondition).toHaveBeenCalledWith(MEDICAL_RECORD_SECTIONS_ID);
  });

  it("opens the add-condition drawer and shows Added vs ADD affordances", async () => {
    const { user } = renderSidebar();

    await user.click(screen.getByTestId("add-condition-icon"));

    await waitFor(() =>
      expect(screen.getByTestId("drawer-open-true")).toBeInTheDocument(),
    );

    // a condition already in the query is marked "Added"
    expect(
      screen.getByTestId("condition-drawer-added-15628003"),
    ).toBeInTheDocument();
    // a condition not in the query offers an ADD button
    expect(
      screen.getByTestId("condition-drawer-add-363346000"),
    ).toBeInTheDocument();
  });

  it("adding a condition from the drawer updates the query, activates it, and toasts", async () => {
    const { user, handleUpdateCondition, setActiveCondition } = renderSidebar();

    await user.click(screen.getByTestId("add-condition-icon"));
    await user.click(
      await screen.findByTestId("condition-drawer-add-363346000"),
    );

    expect(handleUpdateCondition).toHaveBeenCalledWith("363346000", false);
    expect(setActiveCondition).toHaveBeenCalledWith("363346000");
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining("added to query"),
      }),
    );
  });

  it("searching the drawer filters conditions and shows an empty state for no matches", async () => {
    const { user } = renderSidebar();

    await user.click(screen.getByTestId("add-condition-icon"));
    const searchField = await screen.findByPlaceholderText(
      "Search condition or category",
    );

    await user.type(searchField, "Syphilis");
    await waitFor(() =>
      expect(
        screen.getByTestId("condition-drawer-add-76272004"),
      ).toBeInTheDocument(),
    );
    // an unrelated condition is filtered out
    expect(
      screen.queryByTestId("condition-drawer-add-363346000"),
    ).not.toBeInTheDocument();

    await user.clear(searchField);
    await user.type(searchField, "zzz-no-match");
    await waitFor(() =>
      expect(screen.getByText("No conditions found")).toBeInTheDocument(),
    );
  });
});
