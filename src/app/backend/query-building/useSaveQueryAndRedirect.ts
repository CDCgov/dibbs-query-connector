"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import { DataContext } from "@/app/shared/DataProvider";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import {
  saveCustomQuery,
  getCustomQueries,
} from "@/app/backend/query-building/service";
import {
  MedicalRecordSections,
  NestedQuery,
} from "@/app/(pages)/queryBuilding/utils";

/**
 * Hook to save a custom query and redirect to a specified page.
 * @returns A function to call with query data and a redirect path.
 */
export function useSaveQueryAndRedirect() {
  const { data: session } = useSession();
  const router = useRouter();
  const context = useContext(DataContext);

  return async function saveQueryAndRedirect(
    constructedQuery: NestedQuery,
    medicalRecordSections: MedicalRecordSections,
    newQueryName: string | undefined,
    redirectPath: string,
    pageMode?: string,
  ) {
    const username = session?.user?.username;
    const queryName = newQueryName || context?.selectedQuery?.queryName;
    const existingQueryId = context?.selectedQuery?.queryId;

    if (!username || !queryName) {
      console.error("Missing username or queryName.");
      return;
    }

    try {
      const results = await saveCustomQuery(
        constructedQuery,
        medicalRecordSections,
        queryName,
        username,
        existingQueryId,
      );

      if (!results?.[0]?.id) {
        throw new Error("Failed to save query.");
      }

      context?.setSelectedQuery?.({
        queryId: results[0].id,
        queryName,
        pageMode,
      });

      const queries = await getCustomQueries();
      context?.setData?.(queries);

      router.push(redirectPath);
    } catch {
      showToastConfirmation({
        heading: "Something went wrong",
        body: `${queryName} wasn't successfully created. Please try again or contact us if the error persists`,
        variant: "error",
      });
    }
  };
}
