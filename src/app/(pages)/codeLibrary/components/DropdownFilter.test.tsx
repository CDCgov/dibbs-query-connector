import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import DropdownFilter from "./DropdownFilter";
import {
  mockAdmin,
  mockGroupBasic,
  mockStandard,
  mockSuperAdmin,
} from "../../userManagement/test-utils";
import { emptyFilterSearch, emptyVsAuthorMapItem } from "../utils";
import * as UserGroupManagementBackend from "@/app/backend/usergroup-management";
import React, { createRef } from "react";

jest.mock("next-auth/react");

jest.mock(
  "@/app/ui/components/withAuth/WithAuth",
  () =>
    ({ children }: React.PropsWithChildren) => <div>{children}</div>,
);

jest.mock("@/app/backend/usergroup-management", () => ({
  getAllUserGroups: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  getAllGroupMembers: jest.fn().mockResolvedValue({ items: [], totalItems: 0 }),
}));

const mockRef = createRef<HTMLDivElement>();

describe("DropdownFilter", () => {
  it("renders correctly", async () => {
    jest
      .spyOn(UserGroupManagementBackend, "getAllGroupMembers")
      .mockResolvedValueOnce({
        items: [mockAdmin, mockStandard, mockSuperAdmin],
        totalItems: 3,
      });
    jest
      .spyOn(UserGroupManagementBackend, "getAllUserGroups")
      .mockResolvedValueOnce({
        items: [mockGroupBasic],
        totalItems: 1,
      });

    render(
      <RootProviderMock currentPage="/codeLibrary">
        <DropdownFilter
          currentUser={mockAdmin}
          filterSearch={{
            category: undefined,
            codeSystem: "",
            creators: emptyVsAuthorMapItem,
          }}
          setFilterSearch={jest.fn()}
          setShowFilters={jest.fn()}
          allCreators={["DIBBs", "QC Admin"]}
          loading={false}
          filterCount={0}
          setTriggerFocus={jest.fn()}
          focusRef={mockRef}
        />
      </RootProviderMock>,
    );

    const selectDropdowns = await screen.findAllByRole("combobox");
    expect(selectDropdowns[0].id).toBe("category");
    expect(selectDropdowns[1].id).toBe("code-system");
    expect(selectDropdowns[2].id).toBe("creator");

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent("Created by me");
    expect(buttons[1]).toHaveTextContent("Created by my team");
    expect(buttons[2]).toHaveTextContent("Close");
    expect(document.body).toMatchSnapshot();
  });

  it("renders a 'clear filters' button when filters are applied", async () => {
    render(
      <RootProviderMock currentPage="/auditLogs">
        <DropdownFilter
          currentUser={mockAdmin}
          filterSearch={{
            category: "labs",
            codeSystem: "",
            creators: emptyVsAuthorMapItem,
          }}
          setFilterSearch={jest.fn()}
          setShowFilters={jest.fn()}
          allCreators={["DIBBs", "QC Admin"]}
          loading={false}
          filterCount={1}
          setTriggerFocus={jest.fn()}
          focusRef={mockRef}
        />
      </RootProviderMock>,
    );

    const selectDropdowns = await screen.findAllByRole("combobox");
    expect(selectDropdowns[0].id).toBe("category");
    expect(selectDropdowns[1].id).toBe("code-system");
    expect(selectDropdowns[2].id).toBe("creator");

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(buttons[2]).toHaveTextContent("Clear all filters");

    expect(document.body).toMatchSnapshot();
  });

  const renderFilter = (
    overrides: Partial<{
      setFilterSearch: jest.Mock;
      setShowFilters: jest.Mock;
      setTriggerFocus: jest.Mock;
      filterCount: number;
      category: "labs" | "conditions" | "medications" | undefined;
    }> = {},
  ) => {
    const focusRef = createRef<HTMLDivElement>();
    const setFilterSearch = overrides.setFilterSearch ?? jest.fn();
    const setShowFilters = overrides.setShowFilters ?? jest.fn();
    const setTriggerFocus = overrides.setTriggerFocus ?? jest.fn();

    const utils = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <DropdownFilter
          currentUser={mockAdmin}
          filterSearch={{
            category: overrides.category,
            codeSystem: "",
            creators: emptyVsAuthorMapItem,
          }}
          setFilterSearch={setFilterSearch}
          setShowFilters={setShowFilters}
          allCreators={["DIBBs", "QC Admin"]}
          loading={false}
          filterCount={overrides.filterCount ?? 0}
          setTriggerFocus={setTriggerFocus}
          focusRef={focusRef}
        />
      </RootProviderMock>,
    );

    return { ...utils, setFilterSearch, setShowFilters, setTriggerFocus };
  };

  it("updates the filter search when the dropdowns change", async () => {
    const { user, setFilterSearch } = renderFilter();

    const dropdowns = await screen.findAllByRole("combobox");

    await user.selectOptions(dropdowns[0], "labs");
    expect(setFilterSearch).toHaveBeenCalledWith(
      expect.objectContaining({ category: "labs" }),
    );

    await user.selectOptions(dropdowns[1], "http://loinc.org");
    expect(setFilterSearch).toHaveBeenCalledWith(
      expect.objectContaining({ codeSystem: "http://loinc.org" }),
    );

    await user.selectOptions(dropdowns[2], "QC Admin");
    expect(setFilterSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        creators: expect.objectContaining({ "QC Admin": expect.anything() }),
      }),
    );
  });

  it("applies the 'Created by me' and 'Created by my team' shortcuts", async () => {
    const setFilterSearch = jest.fn();
    const focusRef = createRef<HTMLDivElement>();
    const { user } = renderWithUser(
      <RootProviderMock currentPage="/codeLibrary">
        <DropdownFilter
          currentUser={mockAdmin}
          filterSearch={{
            category: undefined,
            codeSystem: "",
            creators: emptyVsAuthorMapItem,
          }}
          setFilterSearch={setFilterSearch}
          setShowFilters={jest.fn()}
          // include the current user so the "created by me" shortcut resolves
          allCreators={["Lily Potter", "QC Admin"]}
          loading={false}
          filterCount={0}
          setTriggerFocus={jest.fn()}
          focusRef={focusRef}
        />
      </RootProviderMock>,
    );

    await screen.findAllByRole("combobox");

    // matching creator -> populated results branch
    await user.click(screen.getByText("Created by me"));
    expect(setFilterSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        creators: { "Lily Potter": ["Lily Potter"] },
      }),
    );

    setFilterSearch.mockClear();

    // empty team -> "no creators to filter" fallback branch
    await user.click(screen.getByText("Created by my team"));
    expect(setFilterSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        creators: { "No creators to filter": ["No creators to filter"] },
      }),
    );
  });

  it("clears all filters when the clear button is clicked", async () => {
    const { user, setFilterSearch } = renderFilter({ filterCount: 2 });

    await screen.findAllByRole("combobox");
    await user.click(screen.getByText("Clear all filters"));

    expect(setFilterSearch).toHaveBeenCalledWith(emptyFilterSearch);
  });

  it("closes the dropdown when the Close button is clicked", async () => {
    const { user, setShowFilters, setTriggerFocus } = renderFilter();

    await screen.findAllByRole("combobox");
    await user.click(screen.getByText("Close"));

    expect(setShowFilters).toHaveBeenCalledWith(false);
    expect(setTriggerFocus).toHaveBeenCalled();
  });

  it("closes the dropdown when the Escape key is pressed", async () => {
    const { setShowFilters, setTriggerFocus } = renderFilter();

    await screen.findAllByRole("combobox");
    fireEvent.keyUp(document, { key: "Escape" });

    expect(setShowFilters).toHaveBeenCalledWith(false);
    expect(setTriggerFocus).toHaveBeenCalled();
  });

  it("closes the dropdown when clicking outside of it", async () => {
    const { setShowFilters } = renderFilter();

    await screen.findAllByRole("combobox");
    fireEvent.mouseDown(document.body);

    expect(setShowFilters).toHaveBeenCalledWith(false);
  });

  it("falls back to usernames when group members have no full name", async () => {
    jest
      .spyOn(UserGroupManagementBackend, "getAllUserGroups")
      .mockResolvedValueOnce({
        items: [
          {
            ...mockGroupBasic,
            members: [{ username: "ronweasley" } as never],
          },
        ],
        totalItems: 1,
      });
    jest
      .spyOn(UserGroupManagementBackend, "getAllGroupMembers")
      .mockResolvedValueOnce({
        items: [{ username: "nevillelongbottom" } as never],
        totalItems: 1,
      });

    renderFilter();

    // the group name becomes a creator option once the members resolve
    await waitFor(() => {
      expect(
        screen.getByRole("option", { name: mockGroupBasic.name }),
      ).toBeInTheDocument();
    });
  });
});
