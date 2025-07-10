import { screen, render, act, waitFor } from "@testing-library/react";
import { RootProviderMock } from "@/app/tests/unit/setup";
import {
  gonorrheaValueSets,
  cancerValueSets,
  customValueSets,
  conditionIdToNameMap,
  categoryToConditionNameArrayMap,
} from "../queryBuilding/fixtures";
import CodeLibrary from "./page";
import {
  getAllValueSets,
  getConditionsData,
} from "@/app/shared/database-service";
import { getAllUsers, getUserByUsername } from "@/app/backend/user-management";
import {
  getAllGroupMembers,
  getAllUserGroups,
} from "@/app/backend/usergroup-management";
import { mockAdmin } from "../userManagement/test-utils";
import { getCustomValueSetById } from "@/app/shared/custom-code-service";

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

jest.mock("@/app/shared/database-service", () => ({
  getAllValueSets: jest.fn().mockReturnValue({ items: [] }),
  getConditionsData: jest.fn().mockReturnValue({}),
  groupConditionConceptsIntoValueSets: jest.fn().mockReturnValue([]),
}));

jest.mock("@/app/backend/usergroup-management", () => ({
  getAllUserGroups: jest.fn(),
  getAllGroupMembers: jest.fn(),
}));

jest.mock("@/app/backend/user-management", () => ({
  getAllUsers: jest.fn(),
  getUserByUsername: jest.fn(),
}));

jest.mock("@/app/shared/custom-code-service", () => ({
  getCustomValueSetById: jest.fn(),
}));

describe("Code library loading view", () => {
  beforeAll(() => {
    (getUserByUsername as jest.Mock).mockResolvedValue({ items: [mockAdmin] });
  });
  it("renders a skeleton loading state when loading is true", async () => {
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
  const valueSets = [
    cancerValueSets,
    gonorrheaValueSets,
    customValueSets,
  ].flat();

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

    (getAllValueSets as jest.Mock).mockReturnValue({ items: valueSets });

    (getCustomValueSetById as jest.Mock).mockReturnValue({
      items: customValueSets[0],
    });
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
      cancerValueSets[1].valueset_name,
    );
    expect(tableBody.childNodes[1]).toHaveTextContent(
      gonorrheaValueSets[1].valueset_name,
    );
    expect(tableBody.childNodes[2]).toHaveTextContent(
      customValueSets[1].valueset_name,
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
  const valueSets = [
    cancerValueSets,
    gonorrheaValueSets,
    customValueSets,
  ].flat();
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

    (getAllValueSets as jest.Mock).mockReturnValue({ items: valueSets });

    (getCustomValueSetById as jest.Mock).mockReturnValue({
      items: customValueSets[0],
    });
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

    expect(cancerVsRow.textContent).toContain(cancerValueSets[0].valueset_name);
    expect(customVsRow.textContent).toContain(customValueSets[0].valueset_name);

    expect(cancerVsRow.textContent).not.toContain(cancerValueSets[0].author);
    expect(customVsRow.textContent).toContain(customValueSets[0].author);

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
      const customCodesPanel = screen.getByTestId("table-codes").parentElement;

      const deleteButton = (customCodesPanel as Element).getElementsByClassName(
        "usa-button",
      )[1];

      (deleteButton as HTMLElement).click();

      const modal = screen.getByTestId("modalWindow");
      expect(modal).toBeVisible();
      expect(modal).toHaveTextContent(
        `Are you sure you want to delete the value set "${customValueSets[0].valueset_name}?"`,
      );
    });
  });
});
