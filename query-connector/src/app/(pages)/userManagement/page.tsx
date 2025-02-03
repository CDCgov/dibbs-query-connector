"use client";
import styles from "./userManagement.module.scss";
import TableTabs from "@/app/ui/designSystem/tableTabs/tableTabs";
import SiteAlert from "@/app/ui/designSystem/SiteAlert";
import classNames from "classnames";
import Table from "@/app/ui/designSystem/table/Table";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const UserManagement: React.FC = () => {
  //   const [selectedQuery, setSelectedQuery] = useState<SelectedQueryDetails>(
  //     structuredClone(EMPTY_QUERY_SELECTION),
  //   );
  //   const [buildStep, setBuildStep] = useState<BuildStep>("selection");

  const users = [
    {
      id: "1",
      firstName: "Jane",
      lastName: "Doe",
      role: "Admin",
      userGroups: [],
    },
    {
      id: "2",
      firstName: "Jane",
      lastName: "Doe",
      role: "Standard",
      userGroups: [],
    },
    {
      id: "3",
      firstName: "Jane",
      lastName: "Doe",
      role: "Super Admin",
      userGroups: [],
    },
  ];
  return (
    <>
      <SiteAlert />
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        <div
          className={classNames(
            "grid-container grid-row padding-0",
            styles.titleContainer,
          )}
        >
          <h1 className="page-title grid-col-10">User management</h1>
        </div>{" "}
        <TableTabs labels={["Users", "User groups"]} />
        <Table className="margin-top-2">
          <thead>
            <tr className={styles.tableHeaderRow}>
              <th>Name</th>
              <th>Permissions</th>
              <th>User groups</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className={classNames(
                  styles.fhirServersRow,
                  styles.tableRowHover,
                )}
              >
                {`${user.lastName}, ${user.firstName}`}
                {`${user.role} `}
                {user.userGroups.length > 0 ? `${user.userGroups}` : "--"}
              </tr>
            ))}
          </tbody>
        </Table>{" "}
      </div>
    </>
  );
};

export default UserManagement;
