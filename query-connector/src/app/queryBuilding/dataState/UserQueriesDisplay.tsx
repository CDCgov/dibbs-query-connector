import React, { useState, useContext, useRef } from "react";
import { Button, Icon, Table } from "@trussworks/react-uswds";
import {
  Modal,
  ModalHeading,
  ModalFooter,
  ModalRef,
} from "@trussworks/react-uswds";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "@/app/queryBuilding/queryBuilding.module.scss";
import { CustomUserQuery } from "@/app/query-building";
import { deleteQueryById } from "@/app/database-service";
import { DataContext } from "@/app/utils";

interface UserQueriesDisplayProps {
  queries: CustomUserQuery[];
}

/**
 * Component for query building when user-generated queries already exist
 * @param root0 - The props object.
 * @param root0.queries - Array of user-generated queries to display.
 * @returns the UserQueriesDisplay to render the queries with edit/delete options
 */
export const UserQueriesDisplay: React.FC<UserQueriesDisplayProps> = ({
  queries: initialQueries,
}) => {
  const router = useRouter();
  const context = useContext(DataContext);
  const [queries, setQueries] = useState<CustomUserQuery[]>(initialQueries);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<ModalRef>(null);
  const [selectedQuery, setSelectedQuery] = useState<{
    queryName: string;
    queryId: string;
  } | null>(null);

  const handleDelete = async (queryName: string, queryId: string) => {
    const result = await deleteQueryById(queryId);
    if (result.success) {
      toast.error(`${queryName} (${queryId}) has been deleted.`, {
        autoClose: 2000,
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

  const confirmDelete = (queryName: string, queryId: string) => {
    setSelectedQuery({ queryName, queryId });
    modalRef.current?.toggleModal();
  };

  const handleCopy = (queryName: string, queryId: string) => {
    navigator.clipboard
      .writeText(queryId)
      .then(() => {
        toast.success(`${queryName} (${queryId}) copied successfully!`, {
          autoClose: 2000,
        });
      })
      .catch((error) => {
        console.error("Failed to copy text:", error);
        toast.error("Failed to copy the ID. Please try again.");
      });
  };

  const handleClick = async () => {
    setLoading(true);

    // Redirect to query updating/editing page
    router.push("/queryBuilding/buildFromTemplates");
  };

  return (
    <div>
      <ToastContainer position="bottom-left" />
      <Modal
        ref={modalRef}
        id="delete-confirmation-modal"
        aria-labelledby="modal-heading"
        aria-describedby="modal-description"
      >
        <ModalHeading id="modal-heading">Confirm Deletion</ModalHeading>
        <div className="usa-prose">
          <p id="modal-description">
            Are you sure you want to delete "
            {selectedQuery ? selectedQuery.queryName : ""}" for all users? This
            action cannot be undone.
          </p>
        </div>
        <ModalFooter>
          <Button
            type="button"
            className="usa-button--secondary"
            onClick={() => {
              if (selectedQuery) {
                handleDelete(selectedQuery.queryName, selectedQuery.queryId);
              }
              modalRef.current?.toggleModal();
            }}
          >
            Delete
          </Button>
          <Button
            type="button"
            className="usa-button--outline"
            onClick={() => modalRef.current?.toggleModal()}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
      <div className="display-flex flex-justify-between flex-align-center width-full margin-bottom-4">
        <h1 className="{styles.queryTitle} flex-align-center">My queries</h1>
        <div className="margin-left-auto">
          <Button
            onClick={handleClick}
            className={styles.createQueryButton}
            type="button"
          >
            Create query
          </Button>
        </div>
      </div>
      <div className={styles.customQueryWrapper}>
        <Table className={styles.customQueryTable}>
          <thead>
            <tr>
              <th scope="col">NAME</th>
              <th scope="col">CONDITIONS</th>
            </tr>
          </thead>
          <tbody>
            {queries.map((query, index) => (
              <tr key={index} className="tableRowWithHover">
                <td title={query.query_name}>{query.query_name}</td>
                <td title={query.query_name}>{query.query_name}</td>
                {/* TODO: Use conditions_list once available */}
                <td>
                  <div className="table-cell-buttons">
                    <Button
                      type="button"
                      className="usa-button--unstyled text-bold text-no-underline"
                      onClick={() => console.log("Edit", query.query_id)}
                    >
                      <span className="icon-text padding-right-4">
                        <Icon.Edit className="height-3 width-3" />
                        <span>Edit</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      className="usa-button--unstyled text-bold text-no-underline"
                      onClick={() =>
                        confirmDelete(query.query_name, query.query_id)
                      }
                    >
                      <span className="icon-text padding-right-4">
                        <Icon.Delete className="height-3 width-3" />
                        <span>Delete</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      className="usa-button--unstyled text-bold text-no-underline"
                      onClick={() =>
                        handleCopy(query.query_name, query.query_id)
                      }
                    >
                      <span className="icon-text padding-right-1">
                        <Icon.ContentCopy className="height-3 width-3" />
                        <span>Copy ID</span>
                      </span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default UserQueriesDisplay;
