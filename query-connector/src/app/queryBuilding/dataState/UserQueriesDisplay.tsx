import React, {
  useState,
  useContext,
  useRef,
  createContext,
  Dispatch,
  SetStateAction,
} from "react";
import { Button, Icon, Table } from "@trussworks/react-uswds";
import { ModalRef } from "@/app/query/designSystem/modal/Modal";
import styles from "@/app/queryBuilding/queryBuilding.module.scss";
import { CustomUserQuery } from "@/app/query-building";
import { DataContext } from "@/app/utils";
import {
  handleDelete,
  confirmDelete,
  handleCopy,
  handleClick,
  renderModal,
  SelectedQueryState,
} from "@/app/queryBuilding/dataState/utils";
import { useRouter } from "next/navigation";

interface UserQueriesDisplayProps {
  queries: CustomUserQuery[];
  handleEdit: (queryName: string, queryId: string) => void;
  selectedQuery: SelectedQueryState;
  setSelectedQuery: Dispatch<SetStateAction<SelectedQueryState>>;
}

/**
 * Component for query building when user-generated queries already exist
 * @param root0 - The props object.
 * @param root0.queries - Array of user-generated queries to display.
 * @returns the UserQueriesDisplay to render the queries with edit/delete options
 */
export const UserQueriesDisplay: React.FC<UserQueriesDisplayProps> = ({
  queries: initialQueries,
  handleEdit,
  selectedQuery,
  setSelectedQuery,
}) => {
  const context = useContext(DataContext);
  const [queries, setQueries] = useState<CustomUserQuery[]>(initialQueries);
  const [_, setLoading] = useState(false);
  const modalRef = useRef<ModalRef>(null);
  const router = useRouter();

  return (
    <div>
      {context &&
        renderModal(
          modalRef,
          selectedQuery,
          handleDelete,
          queries,
          setQueries,
          context,
        )}
      <div className="display-flex flex-justify-between flex-align-center width-full margin-bottom-4">
        <h1 className="flex-align-center">My queries</h1>
        <div className="margin-left-auto">
          <Button
            onClick={() => handleClick(router, setLoading)}
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
                <td title={query.conditions_list}>{query.conditions_list}</td>
                <td>
                  <div className="table-cell-buttons">
                    <Button
                      type="button"
                      className="usa-button--unstyled text-bold text-no-underline"
                      onClick={() =>
                        handleEdit(query.query_name, query.query_id)
                      }
                    >
                      <span className="icon-text padding-right-4 display-flex flex-align-center">
                        <Icon.Edit className="height-3 width-3" />
                        <span id={query.query_id} className="padding-left-05">
                          Edit
                        </span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      className="usa-button--unstyled text-bold text-no-underline"
                      onClick={() =>
                        confirmDelete(
                          query.query_name,
                          query.query_id,
                          setSelectedQuery,
                          modalRef,
                        )
                      }
                    >
                      <span className="icon-text padding-right-4 display-flex flex-align-center">
                        <Icon.Delete className="height-3 width-3" />
                        <span className="padding-left-05">Delete</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      className="usa-button--unstyled text-bold text-no-underline"
                      onClick={() =>
                        handleCopy(query.query_name, query.query_id)
                      }
                    >
                      <span className="icon-text padding-right-1 display-flex flex-align-center">
                        <Icon.ContentCopy className="height-3 width-3" />
                        <span className="padding-left-05">Copy ID</span>
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
