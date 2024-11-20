"use client";
import { useContext, useEffect, useState } from "react";
import UserQueriesDisplay from "./dataState/UserQueriesDisplay";
import EmptyQueriesDisplay from "./emptyState/EmptyQueriesDisplay";
import { CustomUserQuery } from "@/app/query-building";
import { getCustomQueries } from "@/app/database-service";
import { DataContext } from "@/app/utils";
import styles from "@/app/queryBuilding/queryBuilding.module.scss";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  const context = useContext(DataContext);
  const [loading, setLoading] = useState(true);

  // Check whether custom queries exist in DB
  // TODO: We will need to support re-running fetchQueries from DB if/when queries are added/deleted/edited
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
    return <div>Loading...</div>;
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
          <UserQueriesDisplay queries={queries} />
        </div>
      )}
    </>
  );
};

export default QueryBuilding;
