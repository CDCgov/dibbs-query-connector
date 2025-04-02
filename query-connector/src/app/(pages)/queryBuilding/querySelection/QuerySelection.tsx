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
import { checkUserQuery } from "@/app/backend/user-management";
import { useSession } from "next-auth/react";

type QuerySelectionProps = {
  selectedQuery: SelectedQueryState;
  setBuildStep: Dispatch<SetStateAction<BuildStep>>;
  setSelectedQuery: Dispatch<SetStateAction<SelectedQueryDetails>>;
};

let getUserId = async (sesh: any) => {
  const user = await checkUserQuery(sesh);
  return user;
};

// let getGroupMemberships = async() => {
//   const groups = await getSingleUserWithGroupMemberships(user?.id);
//   return groups;
// }
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
  const sesh = session?.user?.username;
  // console.log(sesh);
  // const user = !!sesh && await getUserId();

  // const groups = getGroupMemberships();
  // console.log(groups);
  const userRole = getRole();
  console.log(userRole);
  const [unauthorizedError, setUnauthorizedError] = useState(false);
  const queriesContext = useContext(DataContext);
  const [loading, setLoading] = useState(true);

  // Check whether custom queries exist in DB
  useEffect(() => {
    async function fetchUser() {
      const user = await getUserId(sesh);
      return user;
    }

    console.log(fetchUser());
    // let user = !!sesh && getUserId(sesh);
    // console.log(user?.id);
    if (queriesContext?.data === null || queriesContext?.data === undefined) {
      if (userRole == "Super Admin") {
        const fetchQueries = async () => {
          try {
            const queries = await getQueryList();
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
          } finally {
            setLoading(false);
          }
        };
        fetchQueries();
      } else if (userRole != "SuperAdmin") {
        groups.map(getAllGroupQueries(g));
      } else {
        setLoading(false); // Data already exists, no need to fetch again
      }
    }
  }, [queriesContext]);

  if (loading) {
    return <LoadingView loading={true} />;
  }

  const queries = (queriesContext?.data || []) as CustomUserQuery[];
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
