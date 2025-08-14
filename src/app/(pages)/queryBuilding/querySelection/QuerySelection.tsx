"use client";

import {
  useContext,
  useState,
  useEffect,
  SetStateAction,
  Dispatch,
} from "react";
import { useSession } from "next-auth/react";
import EmptyQueriesDisplay from "./EmptyQueriesDisplay";
import MyQueriesDisplay from "./QueryRepository";
import { BuildStep } from "@/app/constants";
import { DataContext } from "@/app/utils/DataProvider";
import { CustomUserQuery } from "@/app/models/entities/query";
import {
  getQueriesForUser,
  getQueryList,
} from "@/app/backend/query-building/service";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { getRole } from "@/app/(pages)/userManagement/utils";
import { getUserByUsername } from "@/app/backend/user-management";
import { User, UserRole } from "@/app/models/entities/users";

import { isAuthDisabledClientCheck } from "@/app/utils/auth";

type QuerySelectionProps = {
  setBuildStep: Dispatch<SetStateAction<BuildStep>>;
};

/**
 * Component for Query Building Flow
 * @param root0 - params
 * @param root0.setBuildStep - setter function to progress the stage of the query
 * building flow
 * @returns The Query Building component flow
 */
const QuerySelection: React.FC<QuerySelectionProps> = ({ setBuildStep }) => {
  const { data: session } = useSession();
  const username = session?.user?.username || "";
  const userRole = getRole();
  const queriesContext = useContext(DataContext);

  const [userLoading, setUserLoading] = useState(true);
  const [queries, setQueries] = useState<CustomUserQuery[] | undefined>(
    queriesContext?.data
      ? (queriesContext?.data as CustomUserQuery[])
      : undefined,
  );

  const [unauthorizedError, setUnauthorizedError] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>();

  const authDisabled = isAuthDisabledClientCheck(queriesContext?.runtimeConfig);

  const restrictedQueryList =
    !authDisabled &&
    userRole !== UserRole.SUPER_ADMIN &&
    userRole !== UserRole.ADMIN;

  // Retrieve and store current logged-in user's data on page load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      setUserLoading(true);

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
        setUserLoading(false);
      }
    };

    if (!authDisabled) {
      fetchCurrentUser();
    } else {
      setUserLoading(false);
    }
  }, []);

  // Check whether custom queries exist in DB
  useEffect(() => {
    const fetchQueries = async () => {
      if (queries === undefined) {
        try {
          const fetchedQueries = restrictedQueryList
            ? await getQueriesForUser(currentUser as User)
            : await getQueryList();

          setQueries(fetchedQueries);
          queriesContext?.setData(queries);
        } catch (error) {
          if (error == "Error: Unauthorized") {
            setUnauthorizedError(true);
            showToastConfirmation({
              body: "You are not authorized to see queries.",
              variant: "error",
            });
          }
          console.error("Failed to fetch queries:", error);
        }
      }
    };

    fetchQueries();
  }, [currentUser]);

  const loading = userLoading || queries === undefined;

  return (
    <div className="main-container__wide">
      {!loading && queries.length === 0 && !unauthorizedError ? (
        <EmptyQueriesDisplay
          goForward={() => {
            setBuildStep("condition");
          }}
        />
      ) : (
        <MyQueriesDisplay
          loading={loading}
          queries={queries || []}
          setBuildStep={setBuildStep}
          setQueries={setQueries}
        />
      )}
    </div>
  );
};

export default QuerySelection;
