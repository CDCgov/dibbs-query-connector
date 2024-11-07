import { Button, Icon } from "@trussworks/react-uswds";
import styles from "../queryBuilding.module.scss";
import { useRouter } from "next/navigation";
import classNames from "classnames";

/**
 * Empty-state component for query building
 * @returns the EmptyQueriesDisplay to render the empty state status
 */
export const EmptyQueriesDisplay: React.FC = () => {
  const router = useRouter();

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
            onClick={() => router.push(`/queryBuilding/buildFromTemplates`)}
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
