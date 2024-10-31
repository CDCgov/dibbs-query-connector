"use client";
import styles from "./query.module.scss";
import EmptyQueriesDisplay from "./emptyState/EmptyQueriesDisplay";
/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
export const QueryBuilding: React.FC = () => {
  return (
    <div className="main-container">
      <h1 className={styles.queryTitle}>My queries</h1>
      <EmptyQueriesDisplay></EmptyQueriesDisplay>
    </div>
  );
};

export default QueryBuilding;
