import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import BuildFromTemplates from "../buildFromTemplates/BuildFromTemplates";
import { screen, waitFor } from "@testing-library/dom";
import { VALUESET_SELECTION_SEARCH_PLACEHOLDER } from "./utils";
import {
  getConditionsData,
  getSavedQueryById,
  getValueSetsAndConceptsByConditionIDs,
} from "@/app/backend/query-building/service";
import {
  conditionIdToNameMap,
  categoryToConditionNameArrayMap,
  gonorrheaValueSets,
  gonorrheaSavedQuery,
} from "../fixtures";

const currentPage = "/";

jest.mock("../../../backend/query-building/service", () => ({
  getCustomQueries: jest.fn(),
  getSavedQueryById: jest.fn(),
  getConditionsData: jest.fn(),
  getValueSetsAndConceptsByConditionIDs: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    prefetch: jest.fn(),
  }),
}));

(getConditionsData as jest.Mock).mockResolvedValue({
  conditionIdToNameMap,
  categoryToConditionNameArrayMap,
});

(getValueSetsAndConceptsByConditionIDs as jest.Mock).mockResolvedValue(
  gonorrheaValueSets,
);

(getSavedQueryById as jest.Mock).mockResolvedValue(gonorrheaSavedQuery);

describe("tests the value set selection page", () => {
  it("switches and displays the medical records page", async () => {
    const { user } = renderWithUser(
      <RootProviderMock
        currentPage={currentPage}
        initialQuery={{
          queryName: undefined,
          queryId: undefined,
        }}
      >
        <BuildFromTemplates buildStep={"valueset"} setBuildStep={jest.fn} />
      </RootProviderMock>,
    );

    await waitFor(() => {
      screen.getByPlaceholderText(VALUESET_SELECTION_SEARCH_PLACEHOLDER);
    });
    await user.click(screen.getByText("Medical record sections"));
    expect(screen.getByLabelText("Include immunizations")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Include social determinants"),
    ).toBeInTheDocument();
  });

  it("switches and updates the conditions", async () => {
    const { user } = renderWithUser(
      <RootProviderMock
        currentPage={currentPage}
        initialQuery={{
          queryName: undefined,
          queryId: undefined,
        }}
      >
        <BuildFromTemplates buildStep={"valueset"} setBuildStep={jest.fn} />
      </RootProviderMock>,
    );

    await waitFor(() => {
      screen.getByPlaceholderText(VALUESET_SELECTION_SEARCH_PLACEHOLDER);
    });

    expect(screen.queryByTestId("tab-15628003")).not.toBeInTheDocument();
    expect(screen.queryByText("Add Condition(s)")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("add-left-rail"));
    await waitFor(() => {
      expect(screen.queryByText("Add Condition(s)")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("condition-drawer-add-15628003"));
    await waitFor(() => {
      expect(
        screen.getByTestId("condition-drawer-added-15628003"),
      ).toBeInTheDocument();
    });
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("Add Condition(s)")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("15628003-card-active")).toBeInTheDocument();
    });
  });

  it("highlights the active tab to the side", async () => {
    const { user } = renderWithUser(
      <RootProviderMock
        currentPage={currentPage}
        initialQuery={{
          queryName: undefined,
          queryId: undefined,
        }}
      >
        <BuildFromTemplates buildStep={"valueset"} setBuildStep={jest.fn} />
      </RootProviderMock>,
    );

    await waitFor(() => {
      screen.getByPlaceholderText(VALUESET_SELECTION_SEARCH_PLACEHOLDER);
    });

    const additionalCodesTabContainer = screen.getByTestId(
      "tab-custom-container",
    );
    await user.click(screen.getByTestId("tab-custom"));
    await waitFor(() => {
      expect(screen.getByText("Add from code library")).toBeInTheDocument();
    });

    expect(
      additionalCodesTabContainer.className.includes("active"),
    ).toBeTruthy();
    expect(document.body).toMatchSnapshot();

    const medicalRecordsTabContainer = screen.getByTestId(
      "tab-medical-records-container",
    );
    await user.click(screen.getByText("Medical record sections"));

    expect(screen.getByLabelText("Include immunizations")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Include social determinants"),
    ).toBeInTheDocument();
    expect(
      medicalRecordsTabContainer.className.includes("active"),
    ).toBeTruthy();
    expect(document.body).toMatchSnapshot();

    await user.click(screen.getByTestId("add-left-rail"));
    await waitFor(() => {
      expect(screen.queryByText("Add Condition(s)")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("condition-drawer-add-15628003"));
    await waitFor(() => {
      expect(screen.getByTestId("15628003-card-active")).toBeInTheDocument();
    });
    expect(document.body).toMatchSnapshot();
  });
});
