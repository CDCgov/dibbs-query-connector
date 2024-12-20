"use client";

import { getCustomQueries } from "@/app/database-service";
import { CustomUserQuery } from "@/app/query-building";
import LoadingView from "@/app/query/components/LoadingView";
import {
  useContext,
  useState,
  useEffect,
  SetStateAction,
  Dispatch,
} from "react";
import { ToastContainer } from "react-toastify";
import EmptyQueriesDisplay from "./EmptyQueriesDisplay";
import UserQueriesDisplay from "./UserQueriesDisplay";
import { SelectedQueryDetails, SelectedQueryState } from "./utils";
import styles from "./querySelection.module.scss";
import { BuildStep } from "@/app/constants";
import { DataContext } from "@/app/DataProvider";

type QuerySelectionProps = {
  selectedQuery: SelectedQueryState;
  setBuildStep: Dispatch<SetStateAction<BuildStep>>;
  setSelectedQuery: Dispatch<SetStateAction<SelectedQueryDetails>>;
};

/**
 * Component for Query Building Flow
 * @param root0 - params
 * @param root0.selectedQuery - the query object we're building
 * @param root0.setBuildStep - setter function to progress the stage of the query
 * building flow
 * @param root0.setSelectedQuery - setter function to update the query for editing
 * @returns The Query Building component flow
 */
const QuerySelection: React.FC<QuerySelectionProps> = ({
  selectedQuery,
  setBuildStep,
  setSelectedQuery,
}) => {
  const context = useContext(DataContext);
  const [loading, setLoading] = useState(true);

  // Check whether custom queries exist in DB
  useEffect(() => {
    console.log(context?.data);

    if (context?.data === null || context?.data === undefined) {
      const fetchQueries = async () => {
        try {
          console.log("here");
          const queries = await getCustomQueries();
          console.log("here version 2");

          context?.setData(queries);
        } catch (error) {
          console.error("Failed to fetch queries:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchQueries();
    } else {
      setLoading(false); // Data already exists, no need to fetch again
    }
  }, [context]);

  if (loading) {
    return <LoadingView loading={true} />;
  }

  const queries = (context?.data || []) as CustomUserQuery[];

  return (
    <>
      {queries.length === 0 ? (
        <div className="main-container">
          <h1 className={styles.queryTitle}>My queries</h1>
          <EmptyQueriesDisplay />
        </div>
      ) : (
        <div className="main-container__wide">
          <ToastContainer position="bottom-left" icon={false} />
          <UserQueriesDisplay
            queries={queries}
            selectedQuery={selectedQuery}
            setSelectedQuery={setSelectedQuery}
            setBuildStep={setBuildStep}
          />
        </div>
      )}
    </>
  );
};

export default QuerySelection;
