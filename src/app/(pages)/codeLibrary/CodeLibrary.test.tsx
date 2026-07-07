import { screen, render, act, waitFor } from "@testing-library/react";
import { RootProviderMock } from "@/app/tests/unit/setup";
import {
  conditionIdToNameMap,
  categoryToConditionNameArrayMap,
} from "../queryBuilding/fixtures";
import CodeLibrary from "./page";
import { getAllUsers, getUserByUsername } from "@/app/backend/user-management";
import {
  getAllGroupMembers,
  getAllUserGroups,
} from "@/app/backend/usergroup-management";
import { mockAdmin } from "../userManagement/test-utils";
import {
  getValueSetsPaginated,
  getConceptsByValueSetId,
  getValueSetCreators,
} from "@/app/backend/custom-code-service";
import { renderWithUser } from "@/app/tests/unit/setup";
import {
  insertCustomValueSet,
  insertCustomValuesetsIntoQuery,
  deleteCustomValueSet,
} from "@/app/backend/custom-code-service";
import {
  getConditionsData,
  getSavedQueryById,
} from "@/app/backend/query-building/service";
import { DibbsValueSet } from "@/app/models/entities/valuesets";

jest.mock("next-auth/react");

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

jest.mock("@/app/backend/query-building/service", () => ({
  getConditionsData: jest.fn(),
  getSavedQueryById: jest.fn(),
  saveCustomQuery: jest.fn(),
  getCustomQueries: jest.fn(),
}));

const mockSaveQueryAndRedirect = jest.fn();
jest.mock("@/app/backend/query-building/useSaveQueryAndRedirect", () => ({
  useSaveQueryAndRedirect: () => mockSaveQueryAndRedirect,
}));

const mockShowToast = jest.fn();
jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  __esModule: true,
  showToastConfirmation: (...args: unknown[]) => mockShowToast(...args),
  default: () => null,
}));

jest.mock("@/app/backend/usergroup-management", () => ({
  getAllUserGroups: jest.fn(),
  getAllGroupMembers: jest.fn(),
}));

jest.mock("@/app/backend/user-management", () => ({
  getAllUsers: jest.fn(),
  getUserByUsername: jest.fn(),
}));

jest.mock("@/app/backend/custom-code-service", () => ({
  getValueSetsPaginated: jest.fn().mockResolvedValue({
    items: [],
    totalItems: 0,
    pageIndex: 0,
    pageSize: 10,
    totalPages: 0,
    prevPage: 0,
    nextPage: 0,
  }),
  getConceptsByValueSetId: jest.fn().mockResolvedValue([]),
  getValueSetCreators: jest.fn().mockResolvedValue([]),
  getCustomValueSetById: jest.fn(),
  insertCustomValueSet: jest.fn(),
  insertCustomValuesetsIntoQuery: jest.fn(),
  deleteCustomValueSet: jest.fn(),
  deleteCustomConcept: jest.fn(),
}));

const cancerValueSet: DibbsValueSet = {
  valueSetId: "14_20240923",
  valueSetName: "Cancer (Leukemia) Lab Result",
  valueSetExternalId: "14",
  valueSetVersion: "20240923",
  author: "DIBBs",
  system: "http://cap.org/eCC",
  ersdConceptType: "lrtc",
  dibbsConceptType: "labs",
  includeValueSet: true,
  concepts: [],
  conditionId: "2",
  userCreated: false,
};

const gonorrheaValueSet: DibbsValueSet = {
  valueSetId: "7_20240909",
  valueSetName: "Gonorrhea Medication",
  valueSetExternalId: "7",
  valueSetVersion: "20240909",
  author: "DIBBs",
  system: "http://www.nlm.nih.gov/research/umls/rxnorm",
  ersdConceptType: "mrtc",
  dibbsConceptType: "medications",
  includeValueSet: true,
  concepts: [],
  conditionId: "15628003",
  userCreated: false,
};

const customValueSet: DibbsValueSet = {
  valueSetId: "1-test",
  valueSetName: "Fruits",
  valueSetExternalId: "1-test",
  valueSetVersion: "1",
  author: "QC Admin",
  system: "http://snomed.info/sct",
  ersdConceptType: "medications",
  dibbsConceptType: "medications",
  includeValueSet: true,
  concepts: [],
  conditionId: "custom_condition",
  userCreated: true,
};

const allValueSets = [cancerValueSet, gonorrheaValueSet, customValueSet];

const mockPagedResponse = {
  items: allValueSets,
  totalItems: 3,
  pageIndex: 0,
  pageSize: 10,
  totalPages: 1,
  prevPage: 0,
  nextPage: 0,
};

const mockConcepts = [
  { code: "1A", display: "Apple", include: true, internalId: "c1" },
  { code: "1B", display: "Banana", include: true, internalId: "c2" },
  { code: "1C", display: "Coconut", include: true, internalId: "c3" },
];

describe("Code library loading view", () => {
  it("renders a skeleton loading state when loading is true", async () => {
    // Keep getValueSetsPaginated as a never-resolving promise so pagedResult stays null
    (getValueSetsPaginated as jest.Mock).mockReturnValue(new Promise(() => {}));
    (getUserByUsername as jest.Mock).mockReturnValue(new Promise(() => {}));
    (getConditionsData as jest.Mock).mockReturnValue(new Promise(() => {}));
    (getValueSetCreators as jest.Mock).mockReturnValue(new Promise(() => {}));

    await act(async () =>
      render(
        <RootProviderMock currentPage="/codeLibrary">
          <CodeLibrary />
        </RootProviderMock>,
      ),
    );
    expect(await screen.findByTestId("loading-skeleton")).toBeInTheDocument();

    expect(document.body).toMatchSnapshot();
  });
});

describe("Code library rendered view", () => {
  beforeAll(() => {
    (getAllUsers as jest.Mock).mockResolvedValue({ items: [], totalItems: 0 });
    (getAllGroupMembers as jest.Mock).mockResolvedValue({
      items: [],
      totalItems: 0,
    });
    (getUserByUsername as jest.Mock).mockResolvedValue({ items: [mockAdmin] });

    (getConditionsData as jest.Mock).mockResolvedValue({
      conditionIdToNameMap,
      categoryToConditionNameArrayMap,
    });

    (getValueSetsPaginated as jest.Mock).mockResolvedValue(mockPagedResponse);
    (getConceptsByValueSetId as jest.Mock).mockResolvedValue([]);
    (getValueSetCreators as jest.Mock).mockResolvedValue(["DIBBs", "QC Admin"]);
  });

  it("renders the correct content", async () => {
    await act(async () =>
      render(
        <RootProviderMock currentPage="/codeLibrary">
          <CodeLibrary />
        </RootProviderMock>,
      ),
    );
    expect(screen.getByTestId("table-valuesets-manage")).toBeInTheDocument();

    const header = screen
      .getAllByRole("heading")
      .find((heading) => heading.classList.contains("header__title"));
    const infoAlert = screen.queryAllByTestId("alert")[0];

    expect(header).toHaveTextContent("Manage codes");
    expect(infoAlert).toHaveTextContent(
      "Value sets are an organizational structure for easy management of codes. Every code belongs to a value set.",
    );

    const tableBody = screen.getByTestId("table-valuesets-manage");
    expect(tableBody.childNodes[0]).toHaveTextContent(
      cancerValueSet.valueSetName,
    );
    expect(tableBody.childNodes[1]).toHaveTextContent(
      gonorrheaValueSet.valueSetName,
    );
    expect(tableBody.childNodes[2]).toHaveTextContent(
      customValueSet.valueSetName,
    );
    expect(document.body).toMatchSnapshot();
  });

  it("renders concept codes for the value set when clicked", async () => {
    await act(async () =>
      render(
        <RootProviderMock currentPage="/codeLibrary">
          <CodeLibrary />
        </RootProviderMock>,
      ),
    );

    expect(screen.getByTestId("table-valuesets-manage")).toBeInTheDocument();
    const tableBody = screen.getByTestId("table-valuesets-manage");
    () => (tableBody.firstChild as HTMLElement).click();

    expect(
      screen.getByText(
        "This value set comes from DIBBs and cannot be modified.",
      ),
    ).toBeVisible();

    expect(tableBody.childNodes).toHaveLength(3);
    expect(document.body).toMatchSnapshot();
  });
});

describe("Code library interaction", () => {
  beforeAll(() => {
    (getAllUsers as jest.Mock).mockResolvedValue({ items: [], totalItems: 0 });
    (getAllUserGroups as jest.Mock).mockResolvedValue({
      items: [],
      totalItems: 1,
    });

    (getAllGroupMembers as jest.Mock).mockResolvedValue({
      items: [],
      totalItems: 0,
    });
    (getUserByUsername as jest.Mock).mockResolvedValue({ items: [mockAdmin] });

    (getConditionsData as jest.Mock).mockResolvedValue({
      conditionIdToNameMap,
      categoryToConditionNameArrayMap,
    });

    (getValueSetsPaginated as jest.Mock).mockResolvedValue(mockPagedResponse);
    (getConceptsByValueSetId as jest.Mock).mockResolvedValue(mockConcepts);
    (getValueSetCreators as jest.Mock).mockResolvedValue(["DIBBs", "QC Admin"]);
  });
  it("renders action buttons for custom value sets only", async () => {
    await act(async () =>
      render(
        <RootProviderMock currentPage="/codeLibrary">
          <CodeLibrary />
        </RootProviderMock>,
      ),
    );
    expect(screen.getByTestId("table-valuesets-manage")).toBeInTheDocument();

    const tableBody = screen.getByTestId("table-valuesets-manage");
    const cancerVsRow = tableBody.getElementsByClassName(
      "valueSetTable__tableBody_row_details",
    )[0];
    const customVsRow = tableBody.getElementsByClassName(
      "valueSetTable__tableBody_row_details",
    )[2];

    expect(cancerVsRow.textContent).toContain(cancerValueSet.valueSetName);
    expect(customVsRow.textContent).toContain(customValueSet.valueSetName);

    expect(cancerVsRow.textContent).not.toContain(cancerValueSet.author);
    expect(customVsRow.textContent).toContain(customValueSet.author);

    await waitFor(async () => {
      (cancerVsRow as HTMLElement).click();
      const cancerCodesPanel = screen.getByTestId("table-codes").parentElement;
      expect(cancerCodesPanel).toHaveTextContent(
        "This value set comes from DIBBs and cannot be modified.",
      );
    });

    await waitFor(async () => {
      (customVsRow as HTMLElement).click();
      const customCodesPanel = screen.getByTestId("table-codes").parentElement;

      const customActionButtons = (
        customCodesPanel as Element
      ).getElementsByClassName("usa-button");
      expect(customActionButtons[0]).toHaveTextContent("Edit codes");
      expect(customActionButtons[1]).toHaveTextContent("Delete value set");
    });

    expect(document.body).toMatchSnapshot();
  });

  it("prompts the user to confirm before deleting a value set", async () => {
    await act(async () =>
      render(
        <RootProviderMock currentPage="/codeLibrary">
          <CodeLibrary />
        </RootProviderMock>,
      ),
    );

    const customVsRow = screen
      .getByTestId("table-valuesets-manage")
      .getElementsByClassName("valueSetTable__tableBody_row_details")[2];

    await waitFor(async () => {
      (customVsRow as HTMLElement).click();
      const deleteButton = screen.getAllByRole("button", {
        name: /delete value set/i,
      })[1];
      (deleteButton as HTMLElement).click();

      const modal = screen.getByTestId("modalWindow");
      expect(modal).toBeVisible();
      expect(modal).toHaveTextContent(
        `Are you sure you want to delete the value set "${customValueSet.valueSetName}?"`,
      );
    });
  });
});

describe("Code library CSV upload", () => {
  const adminUser = {
    id: "user-1",
    username: "qcadmin",
    firstName: "QC",
    lastName: "Admin",
  };

  const rows = [
    {
      "value set name": "Cooties Vaccine",
      category: "labs",
      "code system": "LOINC",
      code: "12345",
      display: "Circle Circle",
    },
    {
      "value set name": "Cooties Vaccine",
      category: "labs",
      "code system": "LOINC",
      code: "67890",
      display: "Dot Dot",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    (getUserByUsername as jest.Mock).mockResolvedValue({ items: [adminUser] });
    (getConditionsData as jest.Mock).mockResolvedValue({
      conditionIdToNameMap: {},
    });
    (getValueSetsPaginated as jest.Mock).mockResolvedValue({
      items: [],
      totalItems: 0,
      pageIndex: 0,
      pageSize: 10,
      totalPages: 0,
      prevPage: 0,
      nextPage: 0,
    });
    (getConceptsByValueSetId as jest.Mock).mockResolvedValue([]);
    (getValueSetCreators as jest.Mock).mockResolvedValue([]);
    (insertCustomValueSet as jest.Mock).mockResolvedValue({
      success: true,
      id: "vs-1",
    });

    (global as typeof globalThis).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rows }),
    });
  });
  afterEach(() => {
    (global.fetch as jest.Mock).mockReset();
    (insertCustomValueSet as jest.Mock).mockReset();
    (getValueSetsPaginated as jest.Mock).mockReset();
  });

  it("uploads CSV, saves value set(s), refetches, and applies Created by me filter", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );

    await screen.findByTestId("table-valuesets-manage");

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = new File(["value set csv"], "CustomValueSetSample.csv", {
      type: "text/csv",
    });

    await user.upload(fileInput, file);

    await waitFor(() => expect(insertCustomValueSet).toHaveBeenCalledTimes(1));

    expect(insertCustomValueSet).toHaveBeenCalledWith(
      expect.objectContaining({
        valueSetName: "Cooties Vaccine",
        dibbsConceptType: "labs",
        system: "http://loinc.org",
      }),
      adminUser.id,
    );

    await waitFor(() => expect(getValueSetCreators).toHaveBeenCalled());

    await waitFor(() =>
      expect(screen.getByText(/1 filter applied/i)).toBeInTheDocument(),
    );
  });
});

// ---------------------------------------------------------------------------
// Additional coverage: select mode, delete flow, filters, search/pagination,
// create/edit form navigation, and CSV error handling.
// ---------------------------------------------------------------------------

const adminUser = {
  id: "user-1",
  username: "qcadmin",
  firstName: "QC",
  lastName: "Admin",
};

function setupDefaultMocks(
  paged: typeof mockPagedResponse = mockPagedResponse,
  concepts = mockConcepts,
) {
  jest.clearAllMocks();
  (getAllUsers as jest.Mock).mockResolvedValue({ items: [], totalItems: 0 });
  (getAllUserGroups as jest.Mock).mockResolvedValue({
    items: [],
    totalItems: 0,
  });
  (getAllGroupMembers as jest.Mock).mockResolvedValue({
    items: [],
    totalItems: 0,
  });
  (getUserByUsername as jest.Mock).mockResolvedValue({ items: [adminUser] });
  (getConditionsData as jest.Mock).mockResolvedValue({
    conditionIdToNameMap,
    categoryToConditionNameArrayMap,
  });
  (getValueSetsPaginated as jest.Mock).mockResolvedValue(paged);
  (getConceptsByValueSetId as jest.Mock).mockResolvedValue(concepts);
  (getValueSetCreators as jest.Mock).mockResolvedValue(["DIBBs", "QC Admin"]);
  (getSavedQueryById as jest.Mock).mockResolvedValue({
    queryData: { custom: {} },
  });
  (insertCustomValuesetsIntoQuery as jest.Mock).mockResolvedValue({
    success: true,
  });
  (deleteCustomValueSet as jest.Mock).mockResolvedValue({ success: true });
}

describe("Code library select mode", () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  const renderSelect = () =>
    renderWithUser(
      <RootProviderMock
        currentPage="/codeLibrary"
        initialQuery={{
          queryId: "query-1",
          queryName: "My Test Query",
          pageMode: "select",
        }}
      >
        <CodeLibrary />
      </RootProviderMock>,
    );

  it("renders select-specific UI (subtitle, checkboxes, Next button)", async () => {
    renderSelect();

    expect(
      await screen.findByTestId("table-valuesets-select"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Check the box to add the value set or code to the query/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Next: Update query/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Manage codes/i }),
    ).toBeInTheDocument();
    // value-set-level checkboxes are only rendered in select mode
    expect(
      document.getElementById(`valueset-checkbox-${cancerValueSet.valueSetId}`),
    ).toBeInTheDocument();
  });

  it("toggles a value set and saves it to the query via Next", async () => {
    const { user } = renderSelect();
    await screen.findByTestId("table-valuesets-select");

    const vsCheckbox = document.getElementById(
      `valueset-checkbox-${cancerValueSet.valueSetId}`,
    ) as HTMLElement;
    await user.click(vsCheckbox);

    await user.click(
      screen.getByRole("button", { name: /Next: Update query/i }),
    );

    await waitFor(() =>
      expect(insertCustomValuesetsIntoQuery).toHaveBeenCalled(),
    );
    await waitFor(() => expect(mockSaveQueryAndRedirect).toHaveBeenCalled());
  });

  it("toggles an individual concept in the active value set", async () => {
    const { user } = renderSelect();
    await screen.findByTestId("table-valuesets-select");

    // load concepts for the first value set
    const row = screen.getByText(cancerValueSet.valueSetName).closest("tr")!;
    await user.click(row);

    const conceptCheckbox = (await waitFor(() => {
      const el = document.getElementById(
        `concept-checkbox-${cancerValueSet.valueSetId}-${mockConcepts[0].code}`,
      );
      expect(el).toBeInTheDocument();
      return el;
    })) as HTMLElement;
    await user.click(conceptCheckbox);
    expect(conceptCheckbox).toBeChecked();
  });

  it("navigates back to manage view via the Manage codes link", async () => {
    const { user } = renderSelect();
    await screen.findByTestId("table-valuesets-select");

    await user.click(screen.getByRole("button", { name: /Manage codes/i }));

    expect(
      await screen.findByTestId("table-valuesets-manage"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Upload CSV/i }),
    ).toBeInTheDocument();
  });
});

describe("Code library delete flow", () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  const openDeleteModal = async (
    user: ReturnType<typeof renderWithUser>["user"],
  ) => {
    await screen.findByTestId("table-valuesets-manage");
    const customRow = screen
      .getByText(customValueSet.valueSetName)
      .closest("tr")!;
    await user.click(customRow);
    const deleteBtn = screen.getAllByRole("button", {
      name: /delete value set/i,
    })[0];
    await user.click(deleteBtn);
    return document.getElementById("delete-vs-confirm") as HTMLElement;
  };

  it("deletes a value set and shows a success toast", async () => {
    (deleteCustomValueSet as jest.Mock).mockResolvedValue({ success: true });
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );

    const confirm = await openDeleteModal(user);
    await user.click(confirm);

    await waitFor(() =>
      expect(deleteCustomValueSet).toHaveBeenCalledWith(
        expect.objectContaining({ valueSetName: customValueSet.valueSetName }),
      ),
    );
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("successfully deleted"),
        }),
      ),
    );
  });

  it("shows an error toast when delete fails", async () => {
    (deleteCustomValueSet as jest.Mock).mockResolvedValue({ success: false });
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );

    const confirm = await openDeleteModal(user);
    await user.click(confirm);

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "error",
          body: expect.stringContaining("Could not remove value set"),
        }),
      ),
    );
  });

  it("shows an error toast when delete throws", async () => {
    (deleteCustomValueSet as jest.Mock).mockRejectedValue(new Error("boom"));
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );

    const confirm = await openDeleteModal(user);
    await user.click(confirm);

    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "error" }),
      ),
    );
  });
});

describe("Code library filters", () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  it("opens the filter dropdown and applies a category filter", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );
    await screen.findByTestId("table-valuesets-manage");

    await user.click(screen.getByRole("button", { name: /^Filters$/i }));

    const categorySelect = await screen.findByLabelText("Category");
    await user.selectOptions(categorySelect, "labs");

    await waitFor(() =>
      expect(getValueSetsPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ category: "labs" }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByText(/1 filter applied/i)).toBeInTheDocument(),
    );
  });

  it("closes the filter dropdown via the Close button", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );
    await screen.findByTestId("table-valuesets-manage");

    await user.click(screen.getByRole("button", { name: /^Filters$/i }));
    expect(await screen.findByLabelText("Category")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Close$/i }));
    await waitFor(() =>
      expect(screen.queryByLabelText("Category")).not.toBeInTheDocument(),
    );
  });
});

describe("Code library search and pagination", () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  it("debounces the search field and refetches with the text query", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );
    await screen.findByTestId("table-valuesets-manage");

    await user.type(screen.getByPlaceholderText("Search"), "cancer");

    await waitFor(() =>
      expect(getValueSetsPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ textSearch: "cancer" }),
      ),
    );
  });

  it("changes the number of items per page", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );
    await screen.findByTestId("table-valuesets-manage");

    await user.selectOptions(
      screen.getByLabelText(/Value sets per page/i),
      "25",
    );

    await waitFor(() =>
      expect(getValueSetsPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ pageSize: 25 }),
      ),
    );
  });

  it("advances to the next page using pagination", async () => {
    setupDefaultMocks({
      ...mockPagedResponse,
      totalItems: 30,
      totalPages: 3,
    });
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );
    await screen.findByTestId("table-valuesets-manage");

    const nextButton = await screen.findByLabelText(/next page/i);
    await user.click(nextButton);

    await waitFor(() =>
      expect(getValueSetsPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ pageIndex: 1 }),
      ),
    );
  });
});

describe("Code library create/edit navigation", () => {
  beforeEach(() => {
    setupDefaultMocks();
  });

  it("renders the create form when Add value set is clicked", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );
    await screen.findByTestId("table-valuesets-manage");

    await user.click(screen.getByRole("button", { name: /Add value set/i }));

    expect(
      await screen.findByRole("heading", { name: /New value set/i }),
    ).toBeInTheDocument();
  });

  it("renders the edit form when editing a custom value set", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );
    await screen.findByTestId("table-valuesets-manage");

    const customRow = screen
      .getByText(customValueSet.valueSetName)
      .closest("tr")!;
    await user.click(customRow);

    const editBtn = await screen.findByRole("button", { name: /Edit codes/i });
    await user.click(editBtn);

    expect(
      await screen.findByRole("heading", { name: /Edit value set/i }),
    ).toBeInTheDocument();
  });
});

describe("Code library CSV error handling", () => {
  beforeEach(() => {
    setupDefaultMocks({
      ...mockPagedResponse,
      items: [],
      totalItems: 0,
      totalPages: 0,
    });
  });
  afterEach(() => {
    if ((global.fetch as jest.Mock)?.mockReset) {
      (global.fetch as jest.Mock).mockReset();
    }
  });

  it("surfaces an error when the CSV has an unsupported category", async () => {
    (global as typeof globalThis).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        rows: [
          {
            "value set name": "Bad Set",
            category: "not-a-category",
            "code system": "LOINC",
            code: "111",
            display: "Nope",
          },
        ],
      }),
    });

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );
    await screen.findByTestId("table-valuesets-manage");

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["x"], "bad.csv", { type: "text/csv" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /unsupported values/i,
    );
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "error" }),
      ),
    );
    expect(insertCustomValueSet).not.toHaveBeenCalled();
  });

  it("surfaces an error when the CSV fails to parse", async () => {
    (global as typeof globalThis).fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Failed to parse CSV" }),
    });

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CodeLibrary />
      </RootProviderMock>,
    );
    await screen.findByTestId("table-valuesets-manage");

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["x"], "bad.csv", { type: "text/csv" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Failed to parse CSV/i,
    );
  });
});
