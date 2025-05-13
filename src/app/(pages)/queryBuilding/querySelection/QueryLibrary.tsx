import React, {
  useState,
  useContext,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { Button, Icon } from "@trussworks/react-uswds";
import Table from "@/app/ui/designSystem/table/Table";
import { ModalRef } from "@/app/ui/designSystem/modal/Modal";
import styles from "./querySelection.module.scss";
import { BuildStep } from "@/app/shared/constants";
import { renderModal, confirmDelete, handleCopy } from "./utils";
import { DataContext } from "@/app/shared/DataProvider";
import classNames from "classnames";
import { getConditionsData } from "@/app/shared/database-service";
import { ConditionsMap } from "../utils";
import { CustomUserQuery } from "@/app/models/entities/query";
import {
  CUSTOM_CONDITION_NAME,
  CUSTOM_VALUESET_ARRAY_ID,
} from "@/app/shared/constants";

interface UserQueriesDisplayProps {
  queries: CustomUserQuery[];
  setBuildStep: Dispatch<SetStateAction<BuildStep>>;
}

/**
 * Component for query building when user-generated queries already exist
 * @param root0 - The props object.
 * @param root0.queries - Array of user-generated queries to display.
 * @param root0.setBuildStep - setter function to progress the stage of the query
 * building flow
 * @returns the UserQueriesDisplay to render the queries with edit/delete options
 */
export const MyQueriesDisplay: React.FC<UserQueriesDisplayProps> = ({
  queries: initialQueries,
  setBuildStep,
}) => {
  const queryContext = useContext(DataContext);
  if (!queryContext?.setSelectedQuery) {
    throw new Error("MyQueriesDisplay must be used within a DataProvider");
  }

  const [queries, setQueries] = useState<CustomUserQuery[]>(initialQueries);
  const [conditionIdToDetailsMap, setConditionIdToDetailsMap] =
    useState<ConditionsMap>();
  const modalRef = useRef<ModalRef>(null);

  const handleEdit = (queryName: string, queryId: string) => {
    if (queryContext.setSelectedQuery) {
      queryContext.setSelectedQuery({ queryName, queryId });
    }
    setBuildStep("valueset");
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
      {renderModal(modalRef, queries, setQueries)}
      <div className="display-flex flex-justify-between flex-align-center width-full margin-bottom-4">
        <h1 className="flex-align-center margin-0">Query Library</h1>
        <div className="margin-left-auto">
          <Button
            onClick={() => setBuildStep("condition")}
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
              queries.map((query) => (
                <tr
                  key={query.queryId}
                  className={classNames(
                    styles.myQueriesRow,
                    "tableRowWithHover",
                  )}
                  data-testid={`query-row-${query.queryId}`}
                >
                  <td title={query.queryName}>{query.queryName}</td>

                  <td
                    title={
                      query.conditionsList?.includes(
                        CUSTOM_VALUESET_ARRAY_ID,
                      ) && query.conditionsList.length === 1
                        ? CUSTOM_CONDITION_NAME
                        : query.conditionsList
                            ?.map(
                              (id) =>
                                conditionIdToDetailsMap[id]?.name ||
                                (id === CUSTOM_VALUESET_ARRAY_ID
                                  ? CUSTOM_CONDITION_NAME
                                  : ""),
                            )
                            .filter(Boolean)
                            .join(", ")
                    }
                  >
                    {query.conditionsList?.includes(CUSTOM_VALUESET_ARRAY_ID) &&
                    query.conditionsList.length === 1
                      ? CUSTOM_CONDITION_NAME
                      : query.conditionsList
                          ?.map(
                            (id) =>
                              conditionIdToDetailsMap[id]?.name ||
                              (id === CUSTOM_VALUESET_ARRAY_ID
                                ? CUSTOM_CONDITION_NAME
                                : ""),
                          )
                          .filter(Boolean)
                          .join(", ")}
                  </td>
                  <td>
                    <div className="table-cell-buttons">
                      <Button
                        type="button"
                        className="usa-button--unstyled text-bold text-no-underline"
                        onClick={() =>
                          handleEdit(query.queryName, query.queryId)
                        }
                      >
                        <span className="icon-text padding-right-4 display-flex flex-align-center">
                          <Icon.Edit
                            className="height-3 width-3"
                            aria-label="Pencil icon indicating edit ability"
                          />
                          <span className="padding-left-05">Edit</span>
                        </span>
                      </Button>
                      <Button
                        type="button"
                        className="usa-button--unstyled text-bold text-no-underline"
                        onClick={() =>
                          confirmDelete(
                            query.queryName,
                            query.queryId,
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
                          handleCopy(query.queryName, query.queryId)
                        }
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
