import { Button } from "@trussworks/react-uswds";
import { useState } from "react";
import styles from "./querySelection.module.scss";
import classNames from "classnames";
import WorkSpaceSetUpView from "./WorkspaceSetUp";
import { createDibbsDB } from "@/app/backend/db-creation/service";

type EmptyQueryProps = {
  goForward: () => void;
};
/**
 * Empty-state component for query building
 * @param root0 - params
 * @param root0.goForward - navigation function to go to the next page
 * @returns the EmptyQueriesDisplay to render the empty state status
 */
export const EmptyQueriesDisplay: React.FC<EmptyQueryProps> = ({
  goForward,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    // DB Creation Function
    console.log("Creating DB...");

    const { reload } = await createDibbsDB();

    // Stop loading and redirect once function is complete
    setLoading(false);

    if (reload) {
      // Refresh query building page to display the now seeded values
      location.reload();
    } else {
      goForward();
    }
  };

  if (loading) {
    return <WorkSpaceSetUpView />;
  }

  return (
    <div data-testid={"empty-state-container"}>
      <h1 className={styles.queryTitle}>Query Library</h1>

      <div className={classNames("bg-gray-5", styles.emptyStateQueryContainer)}>
        <div className="display-flex flex-column flex-align-left">
          <h2 className={styles.emptyQueryTitle}>Start with Query Builder</h2>
          <h3 className={styles.emptyQuerySubtitle}>
            Create custom queries that your staff can use to search for relevant
            data
          </h3>

          <ul className={styles.emptyQueryExplainer}>
            <li>
              <strong>Leverage</strong> our pre-populated templates with public
              health codes from LOINC, ICD-10, SNOMED, and more.
            </li>
            <li>
              <strong>Decide</strong> which codes to include in each query.
            </li>
            <li>
              <strong>Combine</strong> codes from different conditions.
            </li>
          </ul>
          <Button
            onClick={async () => {
              await handleClick();
            }}
            className={styles.createQueryButton}
            type={"button"}
          >
            Build your first query
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmptyQueriesDisplay;
