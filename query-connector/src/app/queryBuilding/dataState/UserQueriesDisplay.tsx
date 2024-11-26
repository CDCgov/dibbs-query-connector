import { Button, Icon, Table } from "@trussworks/react-uswds";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/queryBuilding/queryBuilding.module.scss";
import { CustomUserQuery } from "@/app/query-building";

interface UserQueriesDisplayProps {
  queries: CustomUserQuery[];
}

/**
 * Component for query building when user-generated queries already exist
 * @param root0 - The props object.
 * @param root0.queries - Array of user-generated queries to display.
 * @returns the UserQueriesDisplay to render the queries with edit/delete options
 */
export const UserQueriesDisplay: React.FC<UserQueriesDisplayProps> = ({
  queries,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    // Redirect to query updating/editing page
    router.push("/queryBuilding/buildFromTemplates");
  };

  return (
    <div>
      <div className="display-flex flex-justify-between flex-align-center width-full margin-bottom-5">
        <h1 className="{styles.queryTitle} flex-align-center">My queries</h1>
        <div className="margin-left-auto">
          <Button
            onClick={handleClick}
            className={styles.createQueryButton}
            type="button"
          >
            Create query
          </Button>
        </div>
      </div>
      <div className={styles.customQueryWrapper}>
        <Table className={styles.customQueryTable}>
          <thead>
            <tr>
              <th scope="col">NAME</th>
              <th scope="col">CONDITIONS</th>
            </tr>
          </thead>
          <tbody>
            {queries.map((query, index) => (
              <tr key={index} className="tableRowWithHover">
                <td title={query.query_name}>{query.query_name}</td>
                <td title={query.query_name}>{query.query_name}</td>
                {/* TODO: Use conditions_list once available */}
                <td>
                  <div className="table-cell-buttons">
                    <Button
                      type="button"
                      className="usa-button--unstyled text-bold text-no-underline"
                      onClick={() => console.log("Edit", query.query_id)}
                    >
                      <span className="icon-text padding-right-4">
                        <Icon.Edit className="height-3 width-3" />
                        <span>Edit</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      className="usa-button--unstyled text-bold text-no-underline"
                      onClick={() => console.log("Delete", query.query_id)}
                    >
                      <span className="icon-text padding-right-4">
                        <Icon.Delete className="height-3 width-3" />
                        <span>Delete</span>
                      </span>
                    </Button>
                    <Button
                      type="button"
                      className="usa-button--unstyled text-bold text-no-underline"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(query.query_id)
                          .catch((error) =>
                            console.error("Failed to copy text:", error),
                          );
                      }}
                    >
                      <span className="icon-text padding-right-1">
                        <Icon.ContentCopy className="height-3 width-3" />
                        <span>Copy ID</span>
                      </span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
};

export default UserQueriesDisplay;
