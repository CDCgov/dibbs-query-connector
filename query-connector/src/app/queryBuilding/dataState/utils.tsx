import { ModalRef } from "@/app/query/designSystem/modal/Modal";
import { DeleteModal } from "@/app/query/designSystem/modal/deleteModal";
import "react-toastify/dist/ReactToastify.css";
import { RefObject } from "react";
import { CustomUserQuery } from "@/app/query-building";
import { deleteQueryById } from "@/app/database-service";
import { useRouter } from "next/navigation";
import { DataContextValue } from "@/app/utils";
import { showToastConfirmation } from "@/app/query/designSystem/redirectToast/RedirectToast";

/**
 * Handles deleting a user query.
 * @param queryName - The name of the query to delete.
 * @param queryId - The ID of the query to delete.
 * @param queries - The current list of user queries.
 * @param setQueries - Function to update the state of queries.
 * @param context - The data context used to update shared state.
 */
export const handleDelete = async (
  queryName: string,
  queryId: string,
  queries: CustomUserQuery[],
  setQueries: React.Dispatch<React.SetStateAction<CustomUserQuery[]>>,
  context: DataContextValue | undefined,
) => {
  const result = await deleteQueryById(queryId);
  if (result.success) {
    showToastConfirmation({
      heading: `${queryName} (${queryId}) has been deleted.`,
      variant: "error",
    });
    const updatedQueries = queries.filter(
      (query) => query.query_id !== queryId,
    );
    setQueries(updatedQueries);

    if (context) {
      context.setData(updatedQueries);
    }
  } else {
    console.error(result.error);
  }
};

/**
 * Confirms the deletion of a user query by toggling a modal.
 * @param queryName - The name of the query to confirm deletion for.
 * @param queryId - The ID of the query to confirm deletion for.
 * @param setSelectedQuery - Function to set the currently selected query for deletion.
 * @param modalRef - Reference to the modal component.
 */
export const confirmDelete = (
  queryName: string,
  queryId: string,
  setSelectedQuery: React.Dispatch<
    React.SetStateAction<{ queryName: string; queryId: string } | null>
  >,
  modalRef: RefObject<ModalRef>,
) => {
  setSelectedQuery({ queryName, queryId });
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
        heading: `${queryName} (${queryId}) copied successfully!`,
      });
    })
    .catch((error) => {
      console.error("Failed to copy text:", error);
    });
};

/**
 * Handles the creation of a new query by redirecting to the query building page.
 * @param router - Next.js router for navigation.
 * @param setLoading - Function to set the loading state.
 */
export const handleClick = async (
  router: ReturnType<typeof useRouter>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  setLoading(true);

  // Redirect to query updating/editing page
  router.push("/queryBuilding/buildFromTemplates");
};

/**
 * Renders a modal to confirm the deletion of a user query.
 * @param modalRef - Reference to the modal component.
 * @param selectedQuery - The currently selected query for deletion.
 * @param handleDelete - Function to handle the deletion workflow.
 * @param queries - The current list of user queries.
 * @param setQueries - Function to update the state of queries.
 * @param context - The data context used to update shared state.
 * @returns The JSX element for the modal.
 */
export const renderModal = (
  modalRef: RefObject<ModalRef>,
  selectedQuery: { queryName: string; queryId: string } | null,
  handleDelete: (
    queryName: string,
    queryId: string,
    queries: CustomUserQuery[],
    setQueries: React.Dispatch<React.SetStateAction<CustomUserQuery[]>>,
    context: DataContextValue,
  ) => void,
  queries: CustomUserQuery[],
  setQueries: React.Dispatch<React.SetStateAction<CustomUserQuery[]>>,
  context: DataContextValue,
): JSX.Element => {
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
            context,
          );
        }
      }}
    />
  );
};
