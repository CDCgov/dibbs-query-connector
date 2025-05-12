import { render, screen } from "@testing-library/react";
import { RootProviderMock } from "@/app/tests/unit/setup";
import { mockDibbsValueSets } from "../../queryBuilding/fixtures";
import CustomValueSetForm from "./CustomValueSetForm";
import { getAllUsers, getUserByUsername } from "@/app/backend/user-management";
import { getAllGroupMembers } from "@/app/backend/usergroup-management";
import { mockAdmin } from "../../userManagement/test-utils";

jest.mock("next-auth/react");

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

jest.mock("@/app/backend/usergroup-management", () => ({
  getAllGroupMembers: jest.fn(),
}));
jest.mock("@/app/backend/user-management", () => ({
  getAllUsers: jest.fn(),
  getUserByUsername: jest.fn(),
}));

describe("CustomValueSetForm", () => {
  beforeAll(() => {
    (getAllUsers as jest.Mock).mockResolvedValue([]);
    (getAllGroupMembers as jest.Mock).mockResolvedValue([]);
    (getUserByUsername as jest.Mock).mockResolvedValue(mockAdmin);
  });

  it("renders an empty form to add a new value set", async () => {
    render(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm mode={"create"} setMode={jest.fn()} />
      </RootProviderMock>,
    );
    const header = screen.getAllByRole("heading")[0];
    const nameInput = screen.getAllByRole("textbox")[0];
    const dropdowns = screen.getAllByRole("combobox");
    const addCodeInputs = await screen.findAllByTestId("addCode-inputs");

    expect(header).toHaveTextContent("New value set");
    expect(nameInput).not.toHaveValue();
    dropdowns.forEach((dropdown) => {
      expect(dropdown).not.toHaveValue();
    });
    expect(addCodeInputs[0]).not.toHaveValue();
    expect(document.body).toMatchSnapshot();
  });

  it("renders a form to edit an existing value set", async () => {
    render(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"edit"}
          setMode={jest.fn()}
          activeValueSet={mockDibbsValueSets[0]}
        />
      </RootProviderMock>,
    );

    const header = screen.getAllByRole("heading")[0];
    const nameInput = screen.getAllByRole("textbox")[0];
    const dropdowns = screen.getAllByRole("combobox");
    const addCodeRows = await screen.findAllByTestId("addCode-inputs");
    const codeNum =
      addCodeRows[0].firstElementChild?.getElementsByClassName("usa-input")[0];
    const codeName =
      addCodeRows[0].firstElementChild?.nextElementSibling?.getElementsByClassName(
        "usa-input",
      )[0];

    expect(header).toHaveTextContent("Edit value set");
    expect(nameInput).toHaveValue(mockDibbsValueSets[0].valueSetName);
    expect(dropdowns[0]).toHaveValue(mockDibbsValueSets[0].dibbsConceptType);
    expect(dropdowns[1]).toHaveValue(mockDibbsValueSets[0].system);

    expect(codeName).toHaveValue(mockDibbsValueSets[0].concepts[0].display);
    expect(codeNum).toHaveValue(mockDibbsValueSets[0].concepts[0].code);

    expect(document.body).toMatchSnapshot();
  });
});
