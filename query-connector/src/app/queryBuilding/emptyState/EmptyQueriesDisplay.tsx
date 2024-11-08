import { Button, Icon } from "@trussworks/react-uswds";
import { useEffect, useState } from "react";
import styles from "../queryBuilding.module.scss";
import { useRouter } from "next/navigation";
import classNames from "classnames";
import WorkSpaceSetUpView from "../loadingState/WorkspaceSetUp";
import { createDibbsDB } from "../../../db-creation";
/**
 * Empty-state component for query building
 * @returns the EmptyQueriesDisplay to render the empty state status
 */
export const EmptyQueriesDisplay: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    // DB Creation Function
    console.log("Creating DB...");

    await new Promise((r) => setTimeout(r, 5000)); //remove once DB creation is implemented
    await createDibbsDB();

    // Stop loading and redirect once function is complete
    setLoading(false);

    // Redirect to query building page
    // router.push("/queryBuilding/buildFromTemplates");
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
          styles.emptyStateQueryContainer
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
          <div className={styles.buttonContainer}>
            <Button
              onClick={() => handleClick()}
              className={styles.createQueryButton}
              type={"button"}
            >
              Create Query
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmptyQueriesDisplay;
