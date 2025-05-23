import { getAllAdmins } from "@/app/backend/user-management";
import { UserRole } from "@/app/models/entities/users";
import { Button, Icon } from "@trussworks/react-uswds";
import { useRouter } from "next-nprogress-bar";
import { useEffect, useState } from "react";

interface NoQueriesDisplayProps {
  userRole: UserRole;
}

/**
 * Redirect component for cases where there aren't queries
 * @param param - params
 * @param param.userRole - the role of the user to toggle different redirect instructions
 * @returns A redirect query component
 */
const NoQueriesDisplay: React.FC<NoQueriesDisplayProps> = ({ userRole }) => {
  const [adminNames, setAdminNames] = useState<string[]>([]);
  useEffect(() => {
    async function fetchAdminNames() {
      const admins = await getAllAdmins();
      const adminNames = admins.map((a) => `${a.firstName} ${a.lastName}`);
      setAdminNames(adminNames);
    }
    fetchAdminNames();
  }, []);

  const router = useRouter();

  function handleRedirect() {
    router.push("/queryBuilding");
  }

  return (
    <div className="padding-3 bg-info display-flex flex-align-start">
      <Icon.Info aria-label="Icon" size={3} className="icon-primary" />
      <div className="margin-left-2">
        <h4 className="text-italic margin-y-0 text-normal">
          It looks like there are no queries available.
        </h4>
        <p className="margin-0">
          {userRole === UserRole.STANDARD
            ? `Get started by contacting an admin: ${adminNames.join(", ")}.`
            : "You can head to the query repository to build the query."}
        </p>

        {userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN ? (
          <Button
            onClick={handleRedirect}
            className="margin-top-3"
            type={"button"}
          >
            Go to query repository
          </Button>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default NoQueriesDisplay;
