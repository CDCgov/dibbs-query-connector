import { Button, Icon, Table } from "@trussworks/react-uswds";
import { useState } from "react";
import styles from "../queryBuilding.module.scss";
import { useRouter } from "next/navigation";

/**
 * Component for query building when user-generated queries already exist
 * @returns the UserQueriesDisplay to render the queries with edit/delete options
 */
export const UserQueriesDisplay: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    // DB Creation Function
    console.log("Creating DB...");

    await new Promise((r) => setTimeout(r, 5000)); // Simulated delay; remove when using actual DB function
    // await createDibbsDB();

    setLoading(false);

    // Redirect to query updating/editing page
    // router.push("/queryBuilding/editCodes");
  };

  // Example data that will come from elsewhere (replace with props or API data)
  const queries = [
    {
      name: "SNHD: Custom Query 1",
      queryId: "A125",
      conditions: ["Chlamydia", "HIV"],
    },
    // Additional queries can be added here
  ];

  return (
    <div>
      <div className="display-flex flex-justify-between flex-align-center width-full margin-bottom-3">
        <h1 className="margin-0">My Queries</h1>
        <Button
          onClick={handleClick}
          className={styles.createQueryButton}
          type="button"
        >
          Create Query
        </Button>
      </div>

      {/* USWDS Table */}
      <Table bordered={false} fullWidth>
        <thead>
          <tr
            style={{
              color: "var(--gray-500, #919191)",
              fontFamily: "Public Sans, sans-serif",
              fontSize: "0.75rem",
              fontStyle: "normal",
              fontWeight: 700,
              lineHeight: "150%",
              textTransform: "uppercase",
              flex: "1 0 0",
            }}
          >
            <th scope="col">NAME</th>
            <th scope="col">QUERY ID</th>
            <th scope="col">CONDITIONS</th>
          </tr>
        </thead>
        <tbody>
          {queries.map((query, index) => (
            <tr key={index}>
              <td>{query.name}</td>
              <td>{query.queryId}</td>
              <td>{query.conditions.join(", ")}</td>
              <td>
                <Button
                  type="button"
                  className="usa-button--unstyled margin-right-1 text-bold"
                  onClick={() => console.log("Edit", query.queryId)}
                >
                  <Icon.Edit /> Edit
                </Button>
                <Button
                  type="button"
                  className="usa-button--unstyled text-bold"
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
