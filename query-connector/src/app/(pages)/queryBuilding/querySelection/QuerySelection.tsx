"use client";

import LoadingView from "@/app/ui/designSystem/LoadingView";
import {
  useContext,
  useState,
  useEffect,
  SetStateAction,
  Dispatch,
} from "react";
import EmptyQueriesDisplay from "./EmptyQueriesDisplay";
import MyQueriesDisplay from "./QueryLibrary";
import { SelectedQueryDetails, SelectedQueryState } from "./utils";
import { BuildStep } from "@/app/shared/constants";
import { DataContext } from "@/app/shared/DataProvider";
import { CustomUserQuery } from "@/app/models/entities/query";
import { getRole } from "@/app/(pages)/userManagement/utils";
import { getQueryList } from "@/app/backend/query-building";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { getAllGroupQueries } from "@/app/backend/usergroup-management";
import {
  getUserByUsername,
  getSingleUserWithGroupMemberships,
} from "@/app/backend/user-management";
import { useSession } from "next-auth/react";
import { User, UserRole } from "@/app/models/entities/users";

type QuerySelectionProps = {
  selectedQuery: SelectedQueryState;
  setBuildStep: Dispatch<SetStateAction<BuildStep>>;
  setSelectedQuery: Dispatch<SetStateAction<SelectedQueryDetails>>;
};

// let getUserId = async (sesh: any) => {
//   const user = await checkUserQuery(sesh);
//   return user;
// };

/**
 * Component for Query Building Flow
 * @param root0 - params
 * @param root0.selectedQuery - the query object we're building
 * @param root0.setBuildStep - setter function to progress the stage of the query
 * building flow
 * @param root0.setSelectedQuery - setter function to update the query for editing
 * @returns The Query Building component flow
 */
const QuerySelection: React.FC<QuerySelectionProps> = ({
  selectedQuery,
  setBuildStep,
  setSelectedQuery,
}) => {
  const { data: session } = useSession();
  const sesh = session?.user?.username || "";
  const userRole = getRole();

  const [loading, setLoading] = useState(true);
  const [unauthorizedError, setUnauthorizedError] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>();

  const queriesContext = useContext(DataContext);

  // Retrieve and store current logged-in user's data on page load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await getUserByUsername(sesh).then(async (user) => {
          const userWithGroups = await getSingleUserWithGroupMemberships(
            user.id,
          );
          return userWithGroups;
        });

        setCurrentUser(currentUser.items[0]);
      } catch {
        console.log("uh oh");
      }
    };

    // since our async fynction sets the return value in the state var 'currentUser'
    // we don't need to worry about pulling out the id, etc. before the promise resolves
    fetchCurrentUser();
  }, []);

  async function getQueriesForUser() {
    if (!!currentUser && currentUser.userGroupMemberships) {
      const assignedQueries = await Promise.all(
        currentUser.userGroupMemberships.map(async (gm) => {
          const groupQueries = await getAllGroupQueries(gm.usergroup_id);
          return groupQueries.items;
        }),
      );
      console.log("WHOA THERE"); //was trying to figure out if we were even hitting this when we should be, and it appears not
      console.log(assignedQueries);
      return assignedQueries[0];
    }
  }
  // Check whether custom queries exist in DB
  useEffect(() => {
    if (queriesContext?.data === null || queriesContext?.data === undefined) {
      const fetchQueries = async () => {
        try {
          const queries = await getQueryList();

          const queryList =
            userRole == UserRole.SUPER_ADMIN
              ? queries
              : !!currentUser
                ? await getQueriesForUser()
                : [];

          queriesContext?.setData(queryList);
        } catch (error) {
          if (error == "Error: Unauthorized") {
            setUnauthorizedError(true);
            showToastConfirmation({
              body: "You are not authorized to see queries.",
              variant: "error",
            });
          }
          console.error("Failed to fetch queries:", error);
        } finally {
          setLoading(false);
        }
      };

      !!currentUser && fetchQueries();
    } else {
      setLoading(false); // Data already exists, no need to fetch again
    }
  }, [queriesContext, currentUser]);

  if (loading) {
    return <LoadingView loading={true} />;
  }

  const queries = (queriesContext?.data || []) as CustomUserQuery[];
  queries.sort((a, b) => (a.query_name[0] > b.query_name[0] ? 1 : -1));

  return (
    <>
      {queries.length === 0 && !unauthorizedError ? (
        <div className="main-container__wide">
          <EmptyQueriesDisplay
            goForward={() => {
              setBuildStep("condition");
            }}
          />
        </div>
      ) : (
        <div className="main-container__wide">
          <MyQueriesDisplay
            queries={queries}
            selectedQuery={selectedQuery}
            setSelectedQuery={setSelectedQuery}
            setBuildStep={setBuildStep}
          />
        </div>
      )}
    </>
  );
};

export default QuerySelection;
