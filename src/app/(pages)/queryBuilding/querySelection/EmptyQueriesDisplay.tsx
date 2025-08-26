import { Button } from "@trussworks/react-uswds";
import { Dispatch, SetStateAction, useState } from "react";
import styles from "./querySelection.module.scss";
import classNames from "classnames";
import WorkSpaceSetUpView from "./WorkspaceSetUp";
import { createDibbsDB } from "@/app/backend/db-creation/service";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import Link from "next/link";
import { MISSING_API_KEY_LITERAL } from "@/app/constants";

type EmptyQueryProps = {
  setDbSeeded: Dispatch<SetStateAction<boolean>>;
};
/**
 * Empty-state component for query building
 * @param root0 - params
 * @param root0.setDbSeeded - callback function to set the seeded state of the DB
 * @returns the EmptyQueriesDisplay to render the empty state status
 */
export const EmptyQueriesDisplay: React.FC<EmptyQueryProps> = ({
  setDbSeeded,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    // DB Creation Function
    console.log("Creating DB...");

    const { success, message, reload, cause } = await createDibbsDB();

    if (!success) {
      let body: string | React.ReactNode =
        `Please try again or contact us for more help: ${message}`;

      if (cause === MISSING_API_KEY_LITERAL) {
        const docLink = (
          <Link href="/docs/development#obtaining-api-and-license-keys">
            API key documentation
          </Link>
        );
        body = (
          <span>
            {message}: {docLink}
          </span>
        );
      }
      showToastConfirmation({
        heading: "Something went wrong.",
        body: body,
        variant: "error",
        autoClose: false,
      });
    }
    // Stop loading and redirect once function is complete
    setLoading(false);
    setDbSeeded(success);

    if (reload) {
      // Refresh query building page to display the now seeded values
      location.reload();
    }
  };

  if (loading) {
    return <WorkSpaceSetUpView />;
  }

  return (
    <div data-testid={"empty-state-container"}>
      <h1 className={styles.queryTitle}>Query repository</h1>

      <div
        className={classNames(
          "background-dark",
          styles.emptyStateQueryContainer,
        )}
      >
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
