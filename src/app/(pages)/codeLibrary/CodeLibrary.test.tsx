import { screen, render, act } from "@testing-library/react";
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
import { getAllGroupMembers } from "@/app/backend/usergroup-management";
import { mockAdmin } from "../userManagement/test-utils";
import { getCustomValueSetById } from "@/app/shared/custom-code-service";

jest.mock("next-auth/react");

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

jest.mock(".../../../shared/database-service", () => ({
  getAllValueSets: jest.fn().mockReturnValue({ items: [] }),
  getConditionsData: jest.fn().mockReturnValue({}),
  groupConditionConceptsIntoValueSets: jest.fn().mockReturnValue([]),
}));

jest.mock("@/app/backend/usergroup-management", () => ({
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
    expect(screen.getByTestId("table-valuesets")).toBeInTheDocument();

    const header = screen
      .getAllByRole("heading")
      .find((heading) => heading.classList.contains("header__title"));
    const infoAlert = screen.queryAllByTestId("alert")[0];

    expect(header).toHaveTextContent("Manage codes");
    expect(infoAlert).toHaveTextContent(
      "Value sets are an organizational structure for easy management of codes. Every code belongs to a value set.",
    );

    const tableBody = screen.getByTestId("table-valuesets");
    expect(tableBody.childNodes[0]).toHaveTextContent(
      cancerValueSets[1].valueset_name,
    );
    expect(tableBody.childNodes[1]).toHaveTextContent(
      gonorrheaValueSets[1].valueset_name,
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

    expect(screen.getByTestId("table-valuesets")).toBeInTheDocument();
    const tableBody = screen.getByTestId("table-valuesets");
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
