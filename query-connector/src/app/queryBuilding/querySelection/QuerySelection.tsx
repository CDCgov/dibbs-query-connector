"use client";

import { getCustomQueries } from "@/app/database-service";
import { CustomUserQuery } from "@/app/query-building";
import LoadingView from "@/app/designSystem/LoadingView";
import {
  useContext,
  useState,
  useEffect,
  SetStateAction,
  Dispatch,
} from "react";
import EmptyQueriesDisplay from "./EmptyQueriesDisplay";
import MyQueriesDisplay from "./QueryLibrary";
import { SelectedQueryDetails, SelectedQueryState } from "./utils";
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
  const queriesContext = useContext(DataContext);
  const [loading, setLoading] = useState(true);

  // Check whether custom queries exist in DB
  useEffect(() => {
    if (queriesContext?.data === null || queriesContext?.data === undefined) {
      const fetchQueries = async () => {
        try {
          const queries = await getCustomQueries();
          queriesContext?.setData(queries);
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
  }, [queriesContext]);

  if (loading) {
    return <LoadingView loading={true} />;
  }

  const queries = (queriesContext?.data || []) as CustomUserQuery[];
  return (
    <>
      {queries.length === 0 ? (
        <div className="main-container__wide">
          <EmptyQueriesDisplay
            goForward={() => {
              setBuildStep("condition");
            }}
          />
        </div>
      ) : (
        <div className="main-container__wide">
          <MyQueriesDisplay
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
