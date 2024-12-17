import { Button, Icon } from "@trussworks/react-uswds";
import { useState } from "react";
import styles from "./querySelection.module.scss";
import classNames from "classnames";
import WorkSpaceSetUpView from "./WorkspaceSetUp";
import { createDibbsDB } from "@/db-creation";
/**
 * Empty-state component for query building
 * @returns the EmptyQueriesDisplay to render the empty state status
 */
export const EmptyQueriesDisplay: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    // DB Creation Function
    console.log("Creating DB...");

    await createDibbsDB();

    // Stop loading and redirect once function is complete
    setLoading(false);

    // Refresh query building page to display the now seeded values
    location.reload();
  };

  if (loading) {
    return <WorkSpaceSetUpView loading={loading} />;
  }

  return (
    <>
      <div
        className={classNames(
          "bg-gray-5",
          "display-flex",
          "flex-align-center",
          "flex-justify-center",
          styles.emptyStateQueryContainer,
        )}
      >
        <div className="display-flex flex-column flex-align-center">
          <Icon.GridView
            aria-label="Icon of four boxes in a grid to indicate empty query state"
            className={styles.emptyQueryIcon}
          ></Icon.GridView>
          <h2 className={styles.emptyQueryTitle}>
            No custom queries available
          </h2>
          <Button
            onClick={() => handleClick()}
            className={styles.createQueryButton}
            type={"button"}
          >
            Create Query
          </Button>
        </div>
      </div>
    </>
  );
};

export default EmptyQueriesDisplay;
