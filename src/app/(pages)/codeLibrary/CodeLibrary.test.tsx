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
import { insertCustomValueSet } from "@/app/backend/custom-code-service";
import { getConditionsData } from "@/app/backend/query-building/service";
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
