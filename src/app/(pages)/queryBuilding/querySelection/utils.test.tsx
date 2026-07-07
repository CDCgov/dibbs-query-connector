import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import {
  handleDelete,
  confirmDelete,
  handleCopy,
  renderModal,
  SelectedQueryDetails,
} from "./utils";
import { deleteQueryById } from "@/app/backend/query-building/service";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { ModalRef } from "@/app/ui/designSystem/modal/Modal";
import { CustomUserQuery } from "@/app/models/entities/query";
import { DataContextValue } from "@/app/utils/DataProvider";

jest.mock("@/app/backend/query-building/service", () => ({
  deleteQueryById: jest.fn(),
}));

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

const mockDeleteQueryById = deleteQueryById as jest.Mock;
const mockToast = showToastConfirmation as jest.Mock;

const QUERIES: CustomUserQuery[] = [
  { queryId: "id-1", queryName: "Query One", conditionsList: ["1"] },
  { queryId: "id-2", queryName: "Query Two", conditionsList: ["2"] },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("handleDelete", () => {
  it("deletes a query, shows a success toast, and updates state on success", async () => {
    mockDeleteQueryById.mockResolvedValue({ success: true });
    const setQueries = jest.fn();
    const setData = jest.fn();
    const context = { setData } as unknown as DataContextValue;

    await handleDelete("Query One", "id-1", QUERIES, setQueries, context);

    expect(mockDeleteQueryById).toHaveBeenCalledWith("id-1");
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "Query One has been deleted.",
        variant: "success",
      }),
    );
    // updated queries should exclude the deleted one
    const updated = setQueries.mock.calls[0][0];
    expect(updated).toEqual([QUERIES[1]]);
    expect(setData).toHaveBeenCalledWith([QUERIES[1]]);
  });

  it("works when context has no setData", async () => {
    mockDeleteQueryById.mockResolvedValue({ success: true });
    const setQueries = jest.fn();

    await handleDelete("Query One", "id-1", QUERIES, setQueries, undefined);

    expect(setQueries).toHaveBeenCalledWith([QUERIES[1]]);
  });

  it("shows an error toast when the delete call fails", async () => {
    mockDeleteQueryById.mockResolvedValue({ success: false });
    const setQueries = jest.fn();

    await handleDelete(
      "Query One",
      "id-1",
      QUERIES,
      setQueries,
      {} as DataContextValue,
    );

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        heading: "Something went wrong",
        variant: "error",
      }),
    );
    expect(setQueries).not.toHaveBeenCalled();
  });

  it("shows an error toast when there is no queryId", async () => {
    const setQueries = jest.fn();

    await handleDelete(
      "Query One",
      undefined,
      QUERIES,
      setQueries,
      {} as DataContextValue,
    );

    expect(mockDeleteQueryById).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "error" }),
    );
  });
});

describe("confirmDelete", () => {
  it("sets the selected query and toggles the modal", () => {
    const setSelectedQuery = jest.fn();
    const toggleModal = jest.fn();
    const modalRef = { current: { toggleModal } as unknown as ModalRef };

    confirmDelete("Query One", "id-1", setSelectedQuery, modalRef);

    expect(setSelectedQuery).toHaveBeenCalledWith({
      queryName: "Query One",
      queryId: "id-1",
    });
    expect(toggleModal).toHaveBeenCalled();
  });
});

describe("handleCopy", () => {
  it("copies the query id and shows a success toast", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    handleCopy("Query One", "id-1");

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("id-1");
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ body: "Query One ID copied successfully!" }),
      );
    });
  });

  it("logs an error when the clipboard write fails", async () => {
    const writeText = jest.fn().mockRejectedValue(new Error("nope"));
    Object.assign(navigator, { clipboard: { writeText } });
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    handleCopy("Query One", "id-1");

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to copy text:",
        expect.any(Error),
      );
    });
    errorSpy.mockRestore();
  });
});

describe("renderModal", () => {
  const Harness = ({
    selectedQuery,
    handleDeleteFn,
    setSelectedQuery,
  }: {
    selectedQuery: SelectedQueryDetails | null;
    handleDeleteFn: jest.Mock;
    setSelectedQuery: jest.Mock;
  }) => {
    const modalRef = useRef<ModalRef>(null);
    return (
      <>
        {renderModal(
          modalRef,
          selectedQuery,
          handleDeleteFn,
          QUERIES,
          jest.fn(),
          {} as DataContextValue,
          setSelectedQuery,
        )}
      </>
    );
  };

  it("renders the confirmation description with the selected query name", () => {
    render(
      <Harness
        selectedQuery={{ queryName: "Query One", queryId: "id-1" }}
        handleDeleteFn={jest.fn()}
        setSelectedQuery={jest.fn()}
      />,
    );

    expect(
      screen.getByText(/Are you sure you want to delete "Query One"/),
    ).toBeInTheDocument();
  });

  it("invokes handleDelete and resets the selected query when Delete is clicked", async () => {
    const user = userEvent.setup();
    const handleDeleteFn = jest.fn();
    const setSelectedQuery = jest.fn();

    render(
      <Harness
        selectedQuery={{ queryName: "Query One", queryId: "id-1" }}
        handleDeleteFn={handleDeleteFn}
        setSelectedQuery={setSelectedQuery}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(handleDeleteFn).toHaveBeenCalledWith(
      "Query One",
      "id-1",
      QUERIES,
      expect.any(Function),
      expect.anything(),
    );
    expect(setSelectedQuery).toHaveBeenCalledWith({
      queryName: undefined,
      queryId: undefined,
    });
  });

  it("does not call handleDelete when there is no selected query", async () => {
    const user = userEvent.setup();
    const handleDeleteFn = jest.fn();

    render(
      <Harness
        selectedQuery={null}
        handleDeleteFn={handleDeleteFn}
        setSelectedQuery={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(handleDeleteFn).not.toHaveBeenCalled();
  });
});
