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
import {
  BuildStep,
  GENERIC_ERROR_BODY,
  GENERIC_ERROR_HEADING,
} from "@/app/constants";
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
import { checkDBForData } from "@/app/backend/db-creation/service";

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
  const [queriesLoading, setQueriesLoading] = useState(true);

  const [dbSeeded, setDbSeeded] = useState(false);
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

  // Retrieve and store user and db seeded information on page load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      setUserLoading(true);

      try {
        const currentUser = await getUserByUsername(username);

        setCurrentUser(currentUser.items[0]);
      } catch (error) {
        if (error == "Error: Unauthorized") {
          showToastConfirmation({
            body: "You are not authorized to see queries.",
            variant: "error",
          });
          setUnauthorizedError(true);
        }
        console.error(`Failed to fetch current user: ${error}`);
      } finally {
        setUserLoading(false);
      }
    };

    const fetchDbSeededState = async () => {
      const dbSeeded = await checkDBForData();
      setDbSeeded(dbSeeded);
      return;
    };

    fetchDbSeededState();
    if (!authDisabled) {
      fetchCurrentUser();
    } else {
      setUserLoading(false);
    }
  }, []);

  // Check whether custom queries exist in DB
  useEffect(() => {
    const fetchQueries = async () => {
      try {
        setQueriesLoading(true);
        const fetchedQueries = restrictedQueryList
          ? await getQueriesForUser(currentUser as User)
          : await getQueryList();

        setQueries(fetchedQueries);

        queriesContext?.setData(queries);
        setQueriesLoading(false);
      } catch (error) {
        let heading = GENERIC_ERROR_HEADING;
        let body = GENERIC_ERROR_BODY;
        if (error instanceof Error) {
          if (error.message.includes("permission check")) {
            body = "You're not authorized to see this page";
            setUnauthorizedError(true);
          }
        }
        console.error("Failed to fetch queries:", error);

        showToastConfirmation({
          heading: heading,
          body: body,
          variant: "error",
          autoClose: false,
        });
      }
    };

    fetchQueries();
  }, [currentUser, dbSeeded]);

  const loading = userLoading || queriesLoading;
  return (
    <div className="main-container__wide">
      {!loading && (!dbSeeded || queries?.length === 0) ? (
        <EmptyQueriesDisplay
          dbSeeded={dbSeeded}
          setDbSeeded={setDbSeeded}
          goForward={() => {
            setBuildStep("condition");
          }}
        />
      ) : (
        <MyQueriesDisplay
          loading={loading || unauthorizedError}
          queries={queries || []}
          setBuildStep={setBuildStep}
          setQueries={setQueries}
        />
      )}
    </div>
  );
};

export default QuerySelection;
