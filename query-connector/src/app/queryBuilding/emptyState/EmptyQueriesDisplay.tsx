import { Button, Icon } from "@trussworks/react-uswds";
import styles from "../query.module.scss";

/**
 * Empty-state component for query building
 * @returns the EmptyQueriesDisplay to render the empty state status
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
          <div className={styles.buttonContainer}>
            <Button className={styles.createQueryButton} type={"button"}>
              Create Query
            </Button>
            <Button
              className={styles.createQueryButton}
              type={"button"}
              // onClick={async () => function_for_inserting_data()}
            >
              Add eRSD Data
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmptyQueriesDisplay;
