"use client";

import Backlink from "@/app/query/components/backLink/Backlink";
import styles from "./buildfromTemplate.module.scss";
import { useRouter } from "next/navigation";
import { Button, Label, TextInput } from "@trussworks/react-uswds";
import { useEffect, useState } from "react";
import classNames from "classnames";
import { getConditionsData } from "@/app/database-service";
import {
  CategoryNameToConditionDetailsMap,
  mapFetchedDataToFrontendStructure,
} from "../utils";
import ConditionColumnDisplay from "./ConditionColumnDisplay";
import SearchField from "@/app/query/designSystem/searchField/SearchField";

/**
 * The query building page
 * @returns the component for the query building page
 */
export default function QueryTemplateSelection() {
  const router = useRouter();
  const [queryName, setQueryName] = useState<string>();
  const [searchFilter, setSearchFilter] = useState<string>();
  const [fetchedConditions, setFetchedConditions] =
    useState<CategoryNameToConditionDetailsMap>();

  useEffect(() => {
    let isSubscribed = true;

    async function fetchConditionsAndUpdateState() {
      const { categoryToConditionArrayMap } = await getConditionsData();

      if (isSubscribed) {
        setFetchedConditions(
          mapFetchedDataToFrontendStructure(categoryToConditionArrayMap),
        );
      }
    }

    fetchConditionsAndUpdateState().catch(console.error);

    return () => {
      isSubscribed = false;
    };
  }, []);

  const noTemplateSelected =
    fetchedConditions &&
    Object.values(Object.values(fetchedConditions))
      .map((arr) => Object.values(arr).flatMap((e) => e.include))
      .flatMap((e) => e.some(Boolean))
      .some(Boolean);

  return (
    <div className="main-container__wide">
      <Backlink
        onClick={() => {
          router.push("/queryBuilding");
        }}
        label={"Back to My Queries"}
      />
      <h1 className={styles.queryTitle}>Custom query</h1>
      <Label htmlFor="queryNameInput" className="margin-top-0-important">
        Query Name
      </Label>
      <TextInput
        id="queryNameInput"
        name="queryNameInput"
        type="text"
        className="maxw-mobile"
        onChange={(event) => {
          setQueryName(event.target.value);
        }}
      />

      <div
        className={classNames(
          "bg-gray-5 margin-top-4 ",
          styles.queryTemplateContainer,
        )}
      >
        <div
          className={classNames(
            styles.querySelectionFormHeader,
            "display-flex flex-justify flex-align-center margin-bottom-3 ",
          )}
        >
          <h2 className="">Select condition(s)</h2>
          <Button
            className="margin-0"
            type={"button"}
            disabled={!noTemplateSelected}
          >
            Create query
          </Button>
        </div>
        <div className={classNames(styles.querySelectionForm, "radius-lg")}>
          <SearchField
            id="conditionTemplateSearch"
            placeholder="Search conditions"
            className={classNames(
              "maxw-mobile margin-x-auto margin-top-0 margin-bottom-2",
            )}
            onChange={(e) => {
              e.preventDefault();
              setSearchFilter(e.target.value);
            }}
          />

          {fetchedConditions && (
            <ConditionColumnDisplay
              fetchedConditions={fetchedConditions}
              searchFilter={searchFilter}
              setFetchedConditions={setFetchedConditions}
            />
          )}
        </div>
      </div>
    </div>
  );
}
