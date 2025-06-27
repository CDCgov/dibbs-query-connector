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
import {
  renderModal,
  handleDelete,
  SelectedQueryDetails,
  confirmDelete,
  handleCopy,
} from "./utils";
import { DataContext, DataContextValue } from "@/app/shared/DataProvider";
import classNames from "classnames";
import { getConditionsData } from "@/app/shared/database-service";
import { ConditionsMap, EMPTY_QUERY_SELECTION } from "../utils";
import { CustomUserQuery } from "@/app/models/entities/query";
import {
  CUSTOM_CONDITION_NAME,
  CUSTOM_VALUESET_ARRAY_ID,
} from "@/app/shared/constants";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import LoadingRow from "@/app/ui/components/loading/loadingRow";

interface UserQueriesDisplayProps {
  queries: CustomUserQuery[];
  setBuildStep: Dispatch<SetStateAction<BuildStep>>;
  setQueries: Dispatch<SetStateAction<CustomUserQuery[] | undefined>>;
  loading: boolean;
}

/**
 * Component for query building when user-generated queries already exist
 * @param root0 - The props object.
 * @param root0.queries - Array of user-generated queries to display.
 * @param root0.loading - Whether the queries are still being fetched.
 * @param root0.setQueries - setter function to update query list.
 * @param root0.setBuildStep - setter function to progress the stage of the query
 * building flow
 * @returns the UserQueriesDisplay to render the queries with edit/delete options
 */
export const MyQueriesDisplay: React.FC<UserQueriesDisplayProps> = ({
  queries,
  setBuildStep,
  loading,
  setQueries,
}) => {
  const queryContext = useContext(DataContext) || ({} as DataContextValue);

  const [conditionIdToDetailsMap, setConditionIdToDetailsMap] =
    useState<ConditionsMap>();
  const modalRef = useRef<ModalRef>(null);

  const handleEdit = (queryName: string, queryId: string) => {
    try {
      if (!queryContext?.setSelectedQuery) {
        throw new Error("Missing DataContext or setSelectedQuery");
      }

      queryContext.setSelectedQuery({ queryName, queryId });
      setBuildStep("valueset");
    } catch (err) {
      console.error("Failed to handle edit:", err);
      showToastConfirmation({
        heading: "Something went wrong",
        body: `Unable to edit the query. Please refresh the page or try again.`,
        variant: "error",
      });
    }
  };

  const [deletedQuery, setDeletedQuery] = useState<SelectedQueryDetails>({
    queryName: undefined,
    queryId: undefined,
  });

  const MEDICAL_RECORD_SECTION_NAME = "Additional custom fields";

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
      {renderModal(
        modalRef,
        deletedQuery,
        handleDelete,
        queries,
        setQueries,
        queryContext,
        setDeletedQuery,
      )}
      <div className="display-flex flex-justify-between flex-align-center width-full margin-bottom-4">
        <h1 className="flex-align-center margin-0">Query repository</h1>
        <div className="margin-left-auto">
          <Button
            onClick={() => {
              setBuildStep("condition");
              queryContext?.setSelectedQuery?.(
                structuredClone(EMPTY_QUERY_SELECTION),
              );
              queryContext?.setData?.(null);
            }}
            className={styles.createQueryButton}
            type="button"
            tabIndex={0}
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
          {loading ? (
            <tbody data-testid={"repository-loading-skeleton"}>
              <LoadingRow numCells={3} />
              <LoadingRow numCells={3} />
              <LoadingRow numCells={3} />
            </tbody>
          ) : (
            <tbody>
              {conditionIdToDetailsMap &&
                queries
                  .sort((a, b) => (a.queryName[0] > b.queryName[0] ? 1 : -1))
                  .map((query) => {
                    const hasCustomOnly =
                      query.conditionsList?.includes(
                        CUSTOM_VALUESET_ARRAY_ID,
                      ) && query.conditionsList.length === 1;

                    const hasMedicalSection =
                      query.medicalRecordSections &&
                      Object.values(query.medicalRecordSections).some(Boolean);

                    const conditionNames = hasCustomOnly
                      ? [CUSTOM_CONDITION_NAME]
                      : [
                          ...(query.conditionsList?.map(
                            (id) =>
                              conditionIdToDetailsMap[id]?.name ||
                              (id === CUSTOM_VALUESET_ARRAY_ID
                                ? CUSTOM_CONDITION_NAME
                                : ""),
                          ) ?? []),
                          ...(hasMedicalSection
                            ? [MEDICAL_RECORD_SECTION_NAME]
                            : []),
                        ].filter(Boolean);

                    return (
                      <tr
                        key={query.queryId}
                        className={classNames(
                          styles.myQueriesRow,
                          "tableRowWithHover",
                        )}
                        tabIndex={0}
                        data-testid={`query-row-${query.queryId}`}
                      >
                        <td title={query.queryName}>{query.queryName}</td>
                        <td title={conditionNames.join(", ")}>
                          {conditionNames.join(", ")}
                        </td>
                        <td>
                          <div className="display-flex flex-justify-end">
                            <Button
                              tabIndex={0}
                              type="button"
                              className="usa-button--unstyled text-bold text-no-underline padding-right-3"
                              data-testid={`edit-query-${query.queryId}`}
                              onClick={() =>
                                handleEdit(query.queryName, query.queryId)
                              }
                            >
                              <span className="icon-text display-flex flex-align-center">
                                <Icon.Edit
                                  className="height-3 width-3"
                                  aria-label="Pencil icon indicating edit ability"
                                />
                                <span className="padding-left-05">Edit</span>
                              </span>
                            </Button>
                            <Button
                              tabIndex={0}
                              type="button"
                              className="usa-button--unstyled text-bold text-no-underline padding-right-2"
                              onClick={() =>
                                handleCopy(query.queryName, query.queryId)
                              }
                            >
                              <span className="icon-text display-flex flex-align-center">
                                <Icon.ContentCopy
                                  className="height-3 width-3"
                                  aria-label="Stacked paper icon indidcating copy"
                                />
                                <span className="padding-left-05">Copy ID</span>
                              </span>
                            </Button>
                            <Button
                              tabIndex={0}
                              type="button"
                              className="usa-button--unstyled text-bold text-no-underline destructive-primary padding-right-2"
                              onClick={() =>
                                confirmDelete(
                                  query.queryName,
                                  query.queryId,
                                  setDeletedQuery,
                                  modalRef,
                                )
                              }
                            >
                              <span className="icon-text display-flex flex-align-center">
                                <Icon.Delete
                                  className="height-3 width-3"
                                  aria-label="trashcan icon indicating deletion"
                                />
                                <span className="padding-left-05">Delete</span>
                              </span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          )}
        </Table>
      </div>
    </div>
  );
};

export default MyQueriesDisplay;
