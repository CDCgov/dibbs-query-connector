import { render, screen } from "@testing-library/react";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import {
  cancerValueSets,
  customValueSets,
  gonorrheaValueSets,
  mockDibbsValueSets,
} from "../../queryBuilding/fixtures";
import CustomValueSetForm from "./CustomValueSetForm";
import { getAllUsers, getUserByUsername } from "@/app/backend/user-management";
import { getAllGroupMembers } from "@/app/backend/usergroup-management";
import { mockAdmin } from "../../userManagement/test-utils";
import { emptyValueSet } from "../utils";
import {
  getCustomValueSetById,
  insertCustomValueSet,
} from "@/app/backend/custom-code-service";
import { getAllValueSets } from "@/app/backend/seeding/service";

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

jest.mock("@/app/backend/seeding/service", () => ({
  getAllValueSets: jest.fn().mockReturnValue({ items: [] }),
}));

jest.mock("@/app/backend/usergroup-management", () => ({
  getAllUserGroups: jest.fn(),
  getAllGroupMembers: jest.fn(),
}));

jest.mock("@/app/backend/custom-code-service", () => ({
  getCustomValueSetById: jest.fn(),
  insertCustomValueSet: jest.fn(),
}));

describe("Create custom valueSet form", () => {
  beforeAll(() => {
    const valueSets = [
      cancerValueSets,
      gonorrheaValueSets,
      customValueSets,
    ].flat();

    (getAllUsers as jest.Mock).mockResolvedValue({ items: [], totalItems: 0 });
    (getAllGroupMembers as jest.Mock).mockResolvedValue({
      items: [],
      totalItems: 0,
    });
    (getUserByUsername as jest.Mock).mockResolvedValue({ items: [mockAdmin] });

    (getAllValueSets as jest.Mock).mockReturnValue({ items: valueSets });
    (insertCustomValueSet as jest.Mock).mockReturnValue({ success: true });

    (getCustomValueSetById as jest.Mock).mockReturnValue({
      items: customValueSets,
    });
  });

  it("renders an empty form to add a new value set", async () => {
    render(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"create"}
          setMode={jest.fn()}
          activeValueSet={emptyValueSet}
        />
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

  it("renders an additional row of code inputs on button click", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"create"}
          setMode={jest.fn()}
          activeValueSet={emptyValueSet}
        />
      </RootProviderMock>,
    );
    const addCodeButton = (await screen.findAllByRole("button")).filter((b) =>
      b.classList.contains("addCodeBtn"),
    );
    expect(await screen.findAllByTestId("addCode-inputs")).toHaveLength(1);
    await user.click(addCodeButton[0]);
    expect(await screen.findAllByTestId("addCode-inputs")).toHaveLength(2);
  });

  it("switches to edit mode after saving a new value set", async () => {
    const setMode = jest.fn();
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"create"}
          setMode={setMode}
          activeValueSet={emptyValueSet}
        />
      </RootProviderMock>,
    );

    const header = screen.getAllByRole("heading")[0];
    const nameInput = screen.getAllByRole("textbox")[0];
    const dropdowns = screen.getAllByRole("combobox");
    const actionButton = screen.getAllByRole("button")[0];

    expect(header).toHaveTextContent("New value set");
    expect(actionButton).toHaveTextContent("Save value set");

    await user.type(nameInput, "some name");
    await user.selectOptions(dropdowns[0], "labs");
    await user.selectOptions(dropdowns[1], "http://hl7.org/fhir/sid/cvx");
    expect(document.body).toMatchSnapshot();

    await user.click(actionButton);
    expect(setMode).toHaveBeenCalledWith("edit");
  });
});

describe("Edit custom valueSet form", () => {
  beforeAll(() => {
    (getAllUsers as jest.Mock).mockResolvedValue({ items: [], totalItems: 0 });
    (getAllGroupMembers as jest.Mock).mockResolvedValue({
      items: [],
      totalItems: 0,
    });
    (getUserByUsername as jest.Mock).mockResolvedValue({ items: [mockAdmin] });
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
