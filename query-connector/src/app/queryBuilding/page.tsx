"use client";
import UserQueriesDisplay from "./dataState/UserQueriesDisplay";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  return (
    <div className="main-container__wide">
      {/* Display when no user-generated queries */}
      {/* <h1 className={styles.queryTitle}>My queries</h1>
      <EmptyQueriesDisplay></EmptyQueriesDisplay> */}
      <UserQueriesDisplay></UserQueriesDisplay>
    </div>
  );
};

export default QueryBuilding;
