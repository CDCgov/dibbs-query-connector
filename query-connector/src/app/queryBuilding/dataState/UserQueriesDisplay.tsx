import { Button, Table } from "@trussworks/react-uswds";
import { useState } from "react";
import styles from "../queryBuilding.module.scss";
import { useRouter } from "next/navigation";
/**
 * Component for query building when user-generated queries already exist
 * @returns the UserQueriesDisplay to render the empty state status
 */
export const UserQueriesDisplay: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    // DB Creation Function
    console.log("Creating DB...");

    await new Promise((r) => setTimeout(r, 5000)); //remove once DB creation is implemented
    // await createDibbsDB();

    // Stop loading and redirect once function is complete
    setLoading(false);

    // Redirect to query updating for editing page
    // router.push("/queryBuilding/editCodes");
  };

  return (
    <div className="display-flex flex-justify-between flex-align-center">
      <h1 className="margin-0">My Queries</h1>
      <Button
        onClick={handleClick}
        className={styles.createQueryButton}
        type="button"
      >
        Create Query
      </Button>
      <div>
        <Table children={undefined}>Test</Table>
      </div>
    </div>
  );
};

export default UserQueriesDisplay;
