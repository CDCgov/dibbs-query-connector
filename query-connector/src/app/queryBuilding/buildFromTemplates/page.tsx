"use client";

import Backlink from "@/app/query/components/backLink/Backlink";
import styles from "./buildfromTemplate.module.scss";
import { useRouter } from "next/navigation";
import { Button, Label, TextInput } from "@trussworks/react-uswds";
import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { getConditionsData } from "@/app/database-service";
import {
  CategoryNameToConditionOptionMap,
  mapFetchedDataToFrontendStructure,
} from "../utils";
import ConditionColumnDisplay from "./ConditionColumnDisplay";
import SearchField from "@/app/query/designSystem/searchField/SearchField";
import SiteAlert from "@/app/query/designSystem/SiteAlert";

/**
 * The query building page
 * @returns the component for the query building page
 */
export default function QueryTemplateSelection() {
  const router = useRouter();
  const focusRef = useRef<HTMLInputElement | null>(null)

  const [queryName, setQueryName] = useState<string>("");
  const [searchFilter, setSearchFilter] = useState<string>();
  const [fetchedConditions, setFetchedConditions] =
    useState<CategoryNameToConditionOptionMap>();
  const [selectedConditions, setSelectedConditions] = 
    useState<CategoryNameToConditionOptionMap>()

  useEffect(() => {
    let isSubscribed = true;

    if (queryName == "" || queryName == undefined)  {
      focusRef?.current?.focus()
    }

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

  const submitForm = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()

    console.log(selectedConditions)
  }

  const atLeastOneItemSelected =
    fetchedConditions &&
    Object.values(Object.values(fetchedConditions))
      .map((arr) => Object.values(arr).flatMap((e) => e.include))
      .flatMap((e) => e.some(Boolean))
      .some(Boolean);

  return (
    <>
      <SiteAlert />
      <div className="main-container__wide">
        <Backlink
          onClick={() => {
            router.push("/queryBuilding");
          }}
          label={"Back to My queries"}
        />
        <h1 className={styles.queryTitle}>Custom query</h1>
        <Label htmlFor="queryNameInput" className="margin-top-0-important">
          Query name <span style={{color: "#919191"}}>(required)</span>
        </Label>
        <TextInput
          inputRef={focusRef}
          id="queryNameInput"
          name="queryNameInput"
          type="text"
          className="maxw-mobile"
          required
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
          <div className="display-flex flex-justify flex-align-end margin-bottom-3 width-full">
            <h2 className="margin-y-0-important">Select condition(s)</h2>
            <Button
              className="margin-0"
              type={"button"}
              disabled={!atLeastOneItemSelected || !queryName}
              onClick={submitForm}
            >
              Create query
            </Button>
          </div>
          <div className={classNames(styles.querySelectionForm, "radius-lg")}>
            <SearchField
              id="conditionTemplateSearch"
              placeholder="Search conditions"
              className={classNames(
                "maxw-mobile margin-x-auto margin-top-0 margin-bottom-4",
              )}
              onChange={(e) => {
                e.preventDefault();
                setSearchFilter(e.target.value);
              }}
            />

            {fetchedConditions && (
              <ConditionColumnDisplay
                selectedConditions={selectedConditions ?? {}}
                setSelectedConditions={setSelectedConditions}
                fetchedConditions={fetchedConditions}
                searchFilter={searchFilter}
                setFetchedConditions={setFetchedConditions}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
