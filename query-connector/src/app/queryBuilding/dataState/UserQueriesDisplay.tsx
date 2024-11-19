import { Button, Icon, Table } from "@trussworks/react-uswds";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../queryBuilding.module.scss"; // Use your custom styles

/**
 * Component for query building when user-generated queries already exist
 * @returns the UserQueriesDisplay to render the queries with edit/delete options
 */
export const UserQueriesDisplay: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    // Simulated delay; replace with actual DB function
    console.log("Creating DB...");
    await new Promise((r) => setTimeout(r, 5000));
    setLoading(false);

    // Redirect to query updating/editing page
    // router.push("/queryBuilding/editCodes");
  };

  // Example data
  const queries = [
    {
      name: "SNHD: Custom Query with an overly elaborate long name to truncate",
      queryId: "A125",
      conditions: ["Chlamydia", "HIV"],
    },
    {
      name: "SNHD: Custom Query 2",
      queryId: "A123901849080294819428013284019 =-4190-6",
      conditions: [
        "Chlamydia",
        "Cancer",
        "Cancer 1",
        "Cancer 2",
        "Cancer 3",
        "Cancer 4",
      ],
    },
  ];

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
            <th scope="col">CONDITIONS</th>
          </tr>
        </thead>
        <tbody>
          {queries.map((query, index) => (
            <tr key={index} className="tableRowWithHover">
              <td>{query.name}</td>
              <td>{query.queryId}</td>
              <td>{query.conditions.join(", ")}</td>
              <td>
                <Button
                  type="button"
                  className="usa-button--unstyled margin-right-1 text-bold text-no-underline"
                  onClick={() => console.log("Edit", query.queryId)}
                >
                  <Icon.Edit /> Edit
                </Button>
                <Button
                  type="button"
                  className="usa-button--unstyled text-bold text-no-underline"
                  onClick={() => console.log("Delete", query.queryId)}
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
