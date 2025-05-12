import { getAllAdmins } from "@/app/backend/user-management";
import { UserRole } from "@/app/models/entities/users";
import { PAGES } from "@/app/shared/page-routes";
import { Icon } from "@trussworks/react-uswds";
import { useState, useEffect } from "react";

interface QueryRedirectInfoProps {
  userRole: UserRole;
}

/**
 * Redirect component for cases where there aren't queries
 * @param param - params
 * @param param.userRole - the role of the user to toggle different redirect instructions
 * @returns A redirect query component
 */
const QueryRedirectInfo: React.FC<QueryRedirectInfoProps> = ({ userRole }) => {
  const [adminNames, setAdminNames] = useState<string[]>([]);
  useEffect(() => {
    async function fetchAdminNames() {
      const admins = await getAllAdmins();
      const adminNames = admins.map((a) => `${a.firstName} ${a.lastName}`);
      setAdminNames(adminNames);
    }
    fetchAdminNames();
  }, []);
  return (
    <div className="padding-3 bg-info display-flex flex-align-start">
      <Icon.Info size={3} className="icon-primary" />
      <div className="margin-left-2">
        <h4 className="text-italic margin-y-0 text-normal">
          Don't see the query you're looking for?
        </h4>
        <p className="margin-0">
          {userRole === UserRole.STANDARD ? (
            `Contact an admin: ${adminNames.join(", ")}`
          ) : (
            <span>
              Go to the{" "}
              <a
                className="unchanged-color-on-visit"
                target="_blank"
                href={PAGES.QUERY_BUILDING}
              >
                query library
              </a>{" "}
              to build it
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default QueryRedirectInfo;
