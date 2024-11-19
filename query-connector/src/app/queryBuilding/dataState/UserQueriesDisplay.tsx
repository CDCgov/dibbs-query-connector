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
      <div className="display-flex flex-justify-between flex-align-center width-full margin-bottom-3">
        <h1 className="margin-0">My Queries</h1>
        <div className="margin-left-auto">
          <Button
            onClick={handleClick}
            className={styles.createQueryButton}
            type="button"
          >
            Create Query
          </Button>
        </div>
      </div>
      <Table className={styles.customQueryTable}>
        <thead>
          <tr>
            <th scope="col">NAME</th>
            <th scope="col">QUERY ID</th>
            {/* <th scope="col">CONDITIONS</th> TODO: Add back once conditions available*/}
          </tr>
        </thead>
        <tbody>
          {queries.map((query, index) => (
            <tr key={index} className="tableRowWithHover">
              <td>{query.query_name}</td>
              <td>{query.query_id}</td>
              {/* <td>{query.condition_list.join(", ")}</td> TODO: Replace with conditions_name once available */}
              <td>
                <Button
                  type="button"
                  className="usa-button--unstyled margin-right-1 text-bold text-no-underline"
                  onClick={() => console.log("Edit", query.query_id)}
                >
                  <Icon.Edit /> Edit
                </Button>
                <Button
                  type="button"
                  className="usa-button--unstyled text-bold text-no-underline"
                  onClick={() => console.log("Delete", query.query_id)}
                >
                  <Icon.Delete /> Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default UserQueriesDisplay;
