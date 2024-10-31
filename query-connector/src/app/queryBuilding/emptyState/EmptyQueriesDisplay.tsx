import { Button, Icon } from "@trussworks/react-uswds";
import styles from "../query.module.scss";

/**
 * Empty-state component for query building
 */
export const EmptyQueriesDisplay: React.FC = () => {
  return (
    <>
      <div className={styles.emptyStateQueryContainer}>
        <div className="display-flex flex-column flex-align-center">
          <Icon.GridView
            aria-label="Icon of four boxes in a grid to indicate empty query state"
            className={styles.emptyQueryIcon}
          ></Icon.GridView>
          <h2 className={styles.emptyQueryTitle}>
            No custom queries available
          </h2>

          <Button className={styles.createQueryButton} type={"button"}>
            Create Query
          </Button>
        </div>
      </div>
    </>
  );
};

export default EmptyQueriesDisplay;
