"use client";
import UserQueriesDisplay from "./dataState/UserQueriesDisplay";
import EmptyQueriesDisplay from "./emptyState/EmptyQueriesDisplay";
import { CustomUserQuery } from "@/app/query-building";
import styles from "@/app/queryBuilding/queryBuilding.module.scss";
import { useEffect, useState } from "react";
import { getCustomQueries } from "@/app/database-service";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  const [queries, setQueries] = useState<CustomUserQuery[]>([]);
  const [loading, setLoading] = useState(true);

  // Check whether custom queries exist in DB
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const data = await getCustomQueries();
        setQueries(data);
      } catch (error) {
        console.error("Failed to fetch queries:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueries();
    console.log(queries);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

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
