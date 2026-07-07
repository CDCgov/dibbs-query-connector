import { render, screen, waitFor } from "@testing-library/react";
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
  deleteCustomConcept,
  getAllValueSets,
  getCustomValueSetById,
  insertCustomValueSet,
} from "@/app/backend/custom-code-service";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

jest.mock("next-auth/react");

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

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

jest.mock("@/app/backend/usergroup-management", () => ({
  getAllUserGroups: jest.fn(),
  getAllGroupMembers: jest.fn(),
}));

jest.mock("@/app/backend/custom-code-service", () => ({
  getAllValueSets: jest.fn().mockReturnValue({ items: [] }),
  getCustomValueSetById: jest.fn(),
  insertCustomValueSet: jest.fn(),
  deleteCustomConcept: jest.fn(),
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
    (deleteCustomConcept as jest.Mock).mockResolvedValue({ success: true });
  });

  beforeEach(() => {
    (showToastConfirmation as jest.Mock).mockClear();
    (insertCustomValueSet as jest.Mock).mockClear();
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

  it("returns to the manage view when the back link is clicked", async () => {
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

    await screen.findAllByTestId("addCode-inputs");
    await user.click(screen.getByTestId("backArrowLink"));
    expect(setMode).toHaveBeenCalledWith("manage");
  });

  it("shows validation errors when saving an empty form", async () => {
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

    const actionButton = screen.getAllByRole("button")[0];
    await user.click(actionButton);

    expect(
      await screen.findByText("Enter a name for the value set."),
    ).toBeInTheDocument();
    expect(screen.getByText("Select a category.")).toBeInTheDocument();
    expect(screen.getByText("Select a code system.")).toBeInTheDocument();
    // invalid form should not advance to edit mode nor call the backend
    expect(setMode).not.toHaveBeenCalledWith("edit");
    expect(insertCustomValueSet).not.toHaveBeenCalled();
  });

  it("captures code values entered into the code rows and saves them", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"create"}
          setMode={jest.fn()}
          activeValueSet={emptyValueSet}
        />
      </RootProviderMock>,
    );

    const nameInput = screen.getAllByRole("textbox")[0];
    const dropdowns = screen.getAllByRole("combobox");

    await user.type(nameInput, "My value set");
    await user.selectOptions(dropdowns[0], "labs");
    await user.selectOptions(dropdowns[1], "http://loinc.org");

    const codeNumInput = document.getElementById(
      "code-id-0",
    ) as HTMLInputElement;
    const codeNameInput = document.getElementById(
      "code-name-0",
    ) as HTMLInputElement;

    await user.type(codeNumInput, "12345");
    await user.type(codeNameInput, "Glucose");

    expect(codeNumInput).toHaveValue("12345");
    expect(codeNameInput).toHaveValue("Glucose");

    await user.click(screen.getAllByRole("button")[0]);

    await waitFor(() => {
      expect(insertCustomValueSet).toHaveBeenCalled();
    });
    // the entered concept should be passed through to the backend
    const savedVs = (insertCustomValueSet as jest.Mock).mock.calls[0][0];
    expect(savedVs.concepts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "12345", display: "Glucose" }),
      ]),
    );
  });

  it("shows an error toast when saving fails", async () => {
    (insertCustomValueSet as jest.Mock).mockImplementationOnce(() => {
      throw new Error("db down");
    });

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"create"}
          setMode={jest.fn()}
          activeValueSet={emptyValueSet}
        />
      </RootProviderMock>,
    );

    const nameInput = screen.getAllByRole("textbox")[0];
    const dropdowns = screen.getAllByRole("combobox");

    await user.type(nameInput, "Broken set");
    await user.selectOptions(dropdowns[0], "labs");
    await user.selectOptions(dropdowns[1], "http://loinc.org");
    await user.click(screen.getAllByRole("button")[0]);

    await waitFor(() => {
      expect(showToastConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "error" }),
      );
    });
  });

  it("skips the refresh when the saved value set can no longer be found", async () => {
    (getCustomValueSetById as jest.Mock).mockReturnValueOnce({
      items: [],
      totalItems: 0,
    });

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"create"}
          setMode={jest.fn()}
          activeValueSet={emptyValueSet}
        />
      </RootProviderMock>,
    );

    const nameInput = screen.getAllByRole("textbox")[0];
    const dropdowns = screen.getAllByRole("combobox");

    await user.type(nameInput, "Missing set");
    await user.selectOptions(dropdowns[0], "labs");
    await user.selectOptions(dropdowns[1], "http://loinc.org");
    await user.click(screen.getAllByRole("button")[0]);

    await waitFor(() => {
      expect(insertCustomValueSet).toHaveBeenCalled();
    });
    // the refresh returns early, but the save still confirms success
    await waitFor(() => {
      expect(showToastConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining("successfully added"),
        }),
      );
    });
  });

  it("logs an error when the current user cannot be fetched", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (getUserByUsername as jest.Mock).mockRejectedValueOnce(
      new Error("no user"),
    );

    render(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"create"}
          setMode={jest.fn()}
          activeValueSet={emptyValueSet}
        />
      </RootProviderMock>,
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to fetch current user"),
      );
    });

    consoleSpy.mockRestore();
    (getUserByUsername as jest.Mock).mockResolvedValue({ items: [mockAdmin] });
  });

  it("keeps existing data in state when switching from create to edit mode", async () => {
    const { rerender } = render(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"create"}
          setMode={jest.fn()}
          activeValueSet={emptyValueSet}
        />
      </RootProviderMock>,
    );

    await screen.findAllByTestId("addCode-inputs");
    expect(screen.getAllByRole("heading")[0]).toHaveTextContent(
      "New value set",
    );

    rerender(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"edit"}
          setMode={jest.fn()}
          activeValueSet={emptyValueSet}
        />
      </RootProviderMock>,
    );

    expect(screen.getAllByRole("heading")[0]).toHaveTextContent(
      "Edit value set",
    );
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

  beforeEach(() => {
    (showToastConfirmation as jest.Mock).mockClear();
    (deleteCustomConcept as jest.Mock).mockReset();
    (getCustomValueSetById as jest.Mock).mockReturnValue({
      items: customValueSets,
    });
  });

  it("removes a code row and confirms with a toast on success", async () => {
    (deleteCustomConcept as jest.Mock).mockResolvedValue({ success: true });

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"edit"}
          setMode={jest.fn()}
          activeValueSet={mockDibbsValueSets[0]}
        />
      </RootProviderMock>,
    );

    await screen.findAllByTestId("addCode-inputs");
    const deleteButton = screen
      .getByTestId("delete-custom-code-0")
      .closest("button") as HTMLButtonElement;

    await user.click(deleteButton);

    await waitFor(() => {
      expect(deleteCustomConcept).toHaveBeenCalled();
    });
    expect(showToastConfirmation).toHaveBeenCalledWith(
      expect.objectContaining({ body: expect.stringContaining("removed") }),
    );
  });

  it("shows an error toast when removing a code fails", async () => {
    (deleteCustomConcept as jest.Mock).mockResolvedValue({ success: false });

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <CustomValueSetForm
          mode={"edit"}
          setMode={jest.fn()}
          activeValueSet={mockDibbsValueSets[0]}
        />
      </RootProviderMock>,
    );

    await screen.findAllByTestId("addCode-inputs");
    const deleteButton = screen
      .getByTestId("delete-custom-code-0")
      .closest("button") as HTMLButtonElement;

    await user.click(deleteButton);

    await waitFor(() => {
      expect(showToastConfirmation).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "error" }),
      );
    });
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
