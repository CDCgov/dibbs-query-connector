"use client";
import { Button, Fieldset, Label, TextInput } from "@trussworks/react-uswds";
import { useState } from "react";
import styles from "./query.module.scss";
type QueryBuilding = {};
export const QueryBuilding: React.FC<QueryBuilding> = ({}) => {
  const [queryName, setQueryName] = useState<string>();

  function handleSubmit() {}
  return (
    <div className="main-container">
      <Fieldset className={styles.queryBuildingContainer}>
        <Label aria-label="queryName" htmlFor={"queryNameInput"}>
          Query Name:
        </Label>
        <TextInput
          id="queryNameInput"
          name="queryNameInput"
          type="text"
          onChange={(event) => {
            setQueryName(event.target.value);
          }}
        />
        <Button onClick={handleSubmit} type={"button"}>
          Submit
        </Button>
      </Fieldset>
    </div>
  );
};

export default QueryBuilding;
