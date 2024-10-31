"use client";
import { Button, Fieldset, Label, TextInput } from "@trussworks/react-uswds";
import { useState } from "react";
import styles from "./query.module.scss";
import EmptyQueriesDisplay from "./emptyState/EmptyQueriesDisplay";
type QueryBuilding = {};
export const QueryBuilding: React.FC<QueryBuilding> = ({}) => {
  const [queryName, setQueryName] = useState<string>();

  function handleSubmit() {}
  return (
    <div className="main-container">
      <h1 className={styles.queryTitle}>My queries</h1>
      <EmptyQueriesDisplay></EmptyQueriesDisplay>
    </div>
  );
};

export default QueryBuilding;
