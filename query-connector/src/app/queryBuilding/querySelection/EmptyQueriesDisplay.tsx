import { Button } from "@trussworks/react-uswds";
import { Dispatch, SetStateAction, useState } from "react";
import styles from "./querySelection.module.scss";
import classNames from "classnames";
import WorkSpaceSetUpView from "./WorkspaceSetUp";
import { createDibbsDB } from "@/app/backend/dbCreation/db-creation";
import { BuildStep } from "@/app/constants";

type EmptyQueryProps = {
  setBuildStep: Dispatch<SetStateAction<BuildStep>>;
};
/**
 * Empty-state component for query building
 * @returns the EmptyQueriesDisplay to render the empty state status
 */
export const EmptyQueriesDisplay: React.FC<EmptyQueryProps> = ({
  setBuildStep,
}) => {
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
          onClick={() => setBuildStep("condition")}
          className={styles.createQueryButton}
          type={"button"}
        >
          Build your first query
        </Button>
      </div>
    </div>
  );
};

export default EmptyQueriesDisplay;
