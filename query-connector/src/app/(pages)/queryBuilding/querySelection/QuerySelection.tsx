"use client";

import LoadingView from "@/app/ui/designSystem/LoadingView";
import {
  useContext,
  useState,
  useEffect,
  SetStateAction,
  Dispatch,
} from "react";
import { useSession } from "next-auth/react";
import EmptyQueriesDisplay from "./EmptyQueriesDisplay";
import MyQueriesDisplay from "./QueryLibrary";
import { SelectedQueryDetails, SelectedQueryState } from "./utils";
import { BuildStep } from "@/app/shared/constants";
import { DataContext } from "@/app/shared/DataProvider";
import { CustomUserQuery } from "@/app/models/entities/query";
import { getQueryList } from "@/app/backend/query-building";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { getRole } from "@/app/(pages)/userManagement/utils";
import { getUserByUsername } from "@/app/backend/user-management";
import { User, UserRole } from "@/app/models/entities/users";
import { getQueriesForUser } from "../utils";
import { isAuthDisabledClientCheck } from "@/app/utils/auth";

type QuerySelectionProps = {
  selectedQuery: SelectedQueryState;
  setBuildStep: Dispatch<SetStateAction<BuildStep>>;
  setSelectedQuery: Dispatch<SetStateAction<SelectedQueryDetails>>;
};

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
  const username = session?.user?.username || "";
  const userRole = getRole();

  const [loading, setLoading] = useState(true);
  const [unauthorizedError, setUnauthorizedError] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>();

  const queriesContext = useContext(DataContext);
  const authDisabled = isAuthDisabledClientCheck(queriesContext?.runtimeConfig);

  const restrictedQueryList =
    !authDisabled &&
    userRole !== UserRole.SUPER_ADMIN &&
    userRole !== UserRole.ADMIN;

  // Retrieve and store current logged-in user's data on page load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await getUserByUsername(username);
        setCurrentUser(currentUser.items[0]);
      } catch (error) {
        if (error == "Error: Unauthorized") {
          setUnauthorizedError(true);
          showToastConfirmation({
            body: "You are not authorized to see queries.",
            variant: "error",
          });
        }
        console.error(`Failed to fetch current user: ${error}`);
      } finally {
        setLoading(false);
      }
    };

    !authDisabled && fetchCurrentUser();
  }, []);

  // Check whether custom queries exist in DB
  useEffect(() => {
    if (queriesContext?.data === null || queriesContext?.data === undefined) {
      const fetchQueries = async () => {
        try {
          setLoading(true);
          const queries = restrictedQueryList
            ? await getQueriesForUser(currentUser as User)
            : await getQueryList();
          const loaded = queries && (authDisabled || !!currentUser);
          !!loaded && queriesContext?.setData(queries);
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

      fetchQueries();
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
