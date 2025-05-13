import { ModalRef } from "@/app/ui/designSystem/modal/Modal";
import { DeleteModal } from "@/app/ui/designSystem/modal/deleteModal";
import { RefObject, useContext } from "react";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { DataContext, DataContextValue } from "@/app/shared/DataProvider";
import { deleteQueryById } from "@/app/backend/query-building/service";
import { CustomUserQuery } from "@/app/models/entities/query";

/**
 * Handles deleting a user query.
 * @param queryName - The name of the query to delete.
 * @param queryId - The ID of the query to delete.
 * @param queries - The current list of user queries.
 * @param setQueries - Function to update the state of queries.
 * @param context - The data context used to update shared state.
 */
export const handleDelete = async (
  queryName: string | undefined,
  queryId: string | undefined,
  queries: CustomUserQuery[],
  setQueries: React.Dispatch<React.SetStateAction<CustomUserQuery[]>>,
  context: DataContextValue,
) => {
  if (queryId) {
    const result = await deleteQueryById(queryId);
    if (result.success) {
      showToastConfirmation({
        body: `${queryName} has been deleted.`,
        variant: "success",
        duration: 2000,
      });
      const updatedQueries = queries.filter(
        (query) => query.queryId !== queryId,
      );
      setQueries(updatedQueries);

      if (context?.setData) {
        context.setData(updatedQueries);
      }
    } else {
      console.error(result.error);
    }
  } else {
    showToastConfirmation({
      heading: `Something went wrong`,
      body: `${queryName} couldn't be deleted. Please try again or contact us if the error persists`,
      variant: "error",
      duration: 2000,
    });
  }
};

/**
 * Confirms the deletion of a user query by toggling a modal.
 * @param queryName - The name of the query to confirm deletion for.
 * @param queryId - The ID of the query to confirm deletion for.
 * @param modalRef - Reference to the modal component.
 */
export const confirmDelete = (
  queryName: string,
  queryId: string,
  modalRef: RefObject<ModalRef>,
) => {
  const queryContext = useContext(DataContext);
  if (!queryContext?.setSelectedQuery) {
    throw new Error(
      "confirmDelete must be used within a DataProvider with selectedQuery set",
    );
  }
  queryContext.setSelectedQuery({ queryName, queryId });
  modalRef.current?.toggleModal();
};

/**
 * Copies the query ID to the clipboard.
 * @param queryName - The name of the query to copy the ID for.
 * @param queryId - The ID of the query to copy.
 */
export const handleCopy = (queryName: string, queryId: string) => {
  navigator.clipboard
    .writeText(queryId)
    .then(() => {
      showToastConfirmation({
        body: `${queryName} ID copied successfully!`,
        duration: 2000,
      });
    })
    .catch((error) => {
      console.error("Failed to copy text:", error);
    });
};

/**
 *  Renders a modal to confirm the deletion of a user query.
 * @param modalRef - Reference to the modal component.
 * clean up the internal state after deletion.
 * @param queries - The current list of user queries.
 * @param setQueries - Function to update the state of queries.
 * @returns The JSX element for the modal.
 */
export const renderModal = (
  modalRef: RefObject<ModalRef>,
  queries: CustomUserQuery[],
  setQueries: React.Dispatch<React.SetStateAction<CustomUserQuery[]>>,
): JSX.Element => {
  const queryContext = useContext(DataContext);
  if (!queryContext?.selectedQuery || !queryContext?.setSelectedQuery) {
    throw new Error(
      "renderModal must be used within a DataProvider with selectedQuery set",
    );
  }
  const selectedQuery = queryContext.selectedQuery;
  const setSelectedQuery = queryContext.setSelectedQuery;

  return (
    <DeleteModal
      modalRef={modalRef}
      heading="Confirm Deletion"
      description={`Are you sure you want to delete "${
        selectedQuery ? selectedQuery.queryName : ""
      }"? This action cannot be undone.`}
      onDelete={() => {
        if (selectedQuery) {
          handleDelete(
            selectedQuery.queryName,
            selectedQuery.queryId,
            queries,
            setQueries,
            queryContext as DataContextValue,
          );
          setSelectedQuery({ queryName: undefined, queryId: undefined });
        }
      }}
    />
  );
};

export type SelectedQueryDetails = {
  queryName?: string;
  queryId?: string;
};
export type SelectedQueryState = SelectedQueryDetails | null;
