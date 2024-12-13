"use client";
import { useContext, useEffect, useState } from "react";
import UserQueriesDisplay from "./dataState/UserQueriesDisplay";
import EmptyQueriesDisplay from "./emptyState/EmptyQueriesDisplay";
import { CustomUserQuery } from "@/app/query-building";
import { getCustomQueries } from "@/app/database-service";
import { DataContext } from "@/app/utils";
import styles from "@/app/queryBuilding/queryBuilding.module.scss";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingView from "../query/components/LoadingView";
import { SelectedQueryContext, SelectedQueryState } from "./dataState/utils";
import { useRouter } from "next/navigation";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  const context = useContext(DataContext);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [selectedQuery, setSelectedQuery] = useState<SelectedQueryState>(null);

  const handleEdit = (queryName: string, queryId: string) => {
    console.log(queryName, queryId);
    setSelectedQuery({
      queryName: queryName,
      queryId: queryId,
    });
    router.push("/queryBuilding/buildFromTemplates");
  };

  // Check whether custom queries exist in DB
  useEffect(() => {
    if (context?.data === null) {
      const fetchQueries = async () => {
        try {
          const queries = await getCustomQueries();
          context.setData(queries);
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
    <SelectedQueryContext.Provider value={selectedQuery}>
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
            handleEdit={handleEdit}
          />
        </div>
      )}
    </SelectedQueryContext.Provider>
  );
};

export default QueryBuilding;
