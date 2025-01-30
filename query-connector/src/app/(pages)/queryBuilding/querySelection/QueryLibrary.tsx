import React, {
  useState,
  useContext,
  useRef,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";
import { Button, Icon } from "@trussworks/react-uswds";
import Table from "@/app/ui/designSystem/table/Table";
import { ModalRef } from "@/app/ui/designSystem/modal/Modal";
import styles from "./querySelection.module.scss";
import { CustomUserQuery } from "@/app/shared/constants";

import { BuildStep } from "@/app/shared/constants";
import {
  SelectedQueryState,
  renderModal,
  handleDelete,
  handleCreationConfirmation,
  confirmDelete,
  handleCopy,
  SelectedQueryDetails,
} from "./utils";
import LoadingView from "@/app/ui/designSystem/LoadingView";
import { DataContext } from "@/app/shared/DataProvider";
import classNames from "classnames";
import { getConditionsData } from "@/app/shared/database-service";
import { ConditionsMap } from "../utils";

interface UserQueriesDisplayProps {
  queries: CustomUserQuery[];
  selectedQuery: SelectedQueryState;
  setSelectedQuery: Dispatch<SetStateAction<SelectedQueryDetails>>;
  setBuildStep: Dispatch<SetStateAction<BuildStep>>;
}

/**
 * Component for query building when user-generated queries already exist
 * @param root0 - The props object.
 * @param root0.queries - Array of user-generated queries to display.
 * @param root0.selectedQuery - the query object we're building
 * @param root0.setBuildStep - setter function to progress the stage of the query
 * building flow
 * @param root0.setSelectedQuery - setter function to update the query for editing
 * @returns the UserQueriesDisplay to render the queries with edit/delete options
 */
export const MyQueriesDisplay: React.FC<UserQueriesDisplayProps> = ({
  queries: initialQueries,
  selectedQuery,
  setSelectedQuery,
  setBuildStep,
}) => {
  const queriesContext = useContext(DataContext);
  const [queries, setQueries] = useState<CustomUserQuery[]>(initialQueries);
  const [loading, setLoading] = useState(false);
  const [conditionIdToDetailsMap, setConditionIdToDetailsMap] =
    useState<ConditionsMap>();

  const modalRef = useRef<ModalRef>(null);
  const handleEdit = (queryName: string, queryId: string) => {
    setSelectedQuery({
      queryName: queryName,
      queryId: queryId,
    });
    setBuildStep("condition");
  };

  useEffect(() => {
    let isSubscribed = true;

    async function fetchConditionsAndUpdateState() {
      const { conditionIdToNameMap } = await getConditionsData();

      if (isSubscribed) {
        setConditionIdToDetailsMap(conditionIdToNameMap);
      }
    }

    fetchConditionsAndUpdateState().catch(console.error);
    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <div>
      {<LoadingView loading={loading} />}
      {queriesContext &&
        renderModal(
          modalRef,
          selectedQuery,
          handleDelete,
          queries,
          setQueries,
          queriesContext,
          setSelectedQuery,
        )}
      <div className="display-flex flex-justify-between flex-align-center width-full margin-bottom-4">
        <h1 className="flex-align-center">Query Library</h1>
        <div className="margin-left-auto">
          <Button
            onClick={() =>
              handleCreationConfirmation(
                () => setBuildStep("condition"),
                setLoading,
              )
            }
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
            <tr className={styles.myQueriesRow}>
              <th scope="col">NAME</th>
              <th scope="col">CONDITIONS</th>
            </tr>
          </thead>
          <tbody>
            {conditionIdToDetailsMap &&
              queries.map((query, index) => (
                <tr
                  key={index}
                  className={classNames(
                    styles.myQueriesRow,
                    "tableRowWithHover",
                  )}
                >
                  <td title={query.query_name}>{query.query_name}</td>

                  <td
                    title={query.conditions_list
                      ?.map((id) => {
                        return conditionIdToDetailsMap[id].name;
                      })
                      .join(", ")}
                  >
                    {query.conditions_list
                      ?.map((id) => {
                        return conditionIdToDetailsMap[id].name;
                      })
                      .join(", ")}
                  </td>
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
                          <Icon.Edit
                            className="height-3 width-3"
                            aria-label="Pencil icon indicating edit ability"
                          />
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
                          <Icon.Delete
                            className="height-3 width-3"
                            aria-label="trashcan icon indicating deletion"
                          />
                          <span className="padding-left-05">Delete</span>
                        </span>
                      </Button>
                      <Button
                        type="button"
                        className="usa-button--unstyled text-bold text-no-underline"
                        onClick={() =>
                          handleCopy(query.query_name, query.query_id)
                        }
                        data-testid={`copy-${query.query_id}`}
                      >
                        <span className="icon-text padding-right-1 display-flex flex-align-center">
                          <Icon.ContentCopy
                            className="height-3 width-3"
                            aria-label="Stacked paper icon indidcating copy"
                          />
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

export default MyQueriesDisplay;
