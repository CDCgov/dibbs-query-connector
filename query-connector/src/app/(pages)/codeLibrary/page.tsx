"use client";
import { useContext, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import {
  Alert,
  Button,
  Icon,
  Pagination,
  Select,
} from "@trussworks/react-uswds";
import styles from "./codeLibrary.module.scss";
import { DataContext } from "@/app/shared/DataProvider";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import Backlink from "@/app/ui/designSystem/backLink/Backlink";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import Table from "@/app/ui/designSystem/table/Table";
import { groupConditionConceptsIntoValueSets } from "@/app/shared/utils";
import {
  getAllValueSets,
  getConditionsData,
} from "@/app/shared/database-service";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { formatSystem } from "./utils";
import { ConditionsMap, formatDiseaseDisplay } from "../queryBuilding/utils";
import Highlighter from "react-highlight-words";
import Skeleton from "react-loading-skeleton";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  type Mode = "manage" | "select";
  // const focusRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [mode, setMode] = useState<Mode>("manage");
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [conditionDetailsMap, setConditionsDetailsMap] =
    useState<ConditionsMap>();

  const [activeValueSet, setActiveValueSet] = useState<DibbsValueSet | null>(
    null,
  );
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [valueSets, setValueSets] = useState<DibbsValueSet[]>([]);
  const [filteredValueSets, setFilteredValueSets] = useState(valueSets);

  const ctx = useContext(DataContext);

  const totalPages = Math.ceil(filteredValueSets.length / itemsPerPage);

  function vsTextSearch() {
    let matchingCodes = {};
    const vs = valueSets.filter((vs) => {
      const matchesName = vs.valueSetName
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase());
      const conditionName =
        vs.conditionId && conditionDetailsMap?.[vs.conditionId].name;
      const matchesConditionName =
        conditionName &&
        conditionName.toLocaleLowerCase().includes(search.toLocaleLowerCase());
      const matchesConceptType = vs.dibbsConceptType
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase());
      const matchesSystem = vs.system
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase());

      return (
        matchesName ||
        matchesConditionName ||
        matchesConceptType ||
        matchesSystem
      );
    });
    console.log(matchingCodes);
    return vs;
  }

  // update the current page details when switching between build steps
  useEffect(() => {
    ctx?.setCurrentPage(mode);
  }, [mode]);

  useEffect(() => {
    ctx?.setToastConfig({
      position: "bottom-left",
      stacked: true,
      hideProgressBar: true,
    });

    const fetchValueSetsAndConditions = async () => {
      try {
        const { conditionIdToNameMap } = await getConditionsData();
        const vs = await getAllValueSets();
        const formattedVs =
          vs.items && groupConditionConceptsIntoValueSets(vs.items);

        setValueSets(formattedVs);
        setConditionsDetailsMap(conditionIdToNameMap);
      } catch (error) {
        console.error(`Failed to fetch: ${error}`);
      }
    };

    fetchValueSetsAndConditions();
  }, []);

  useEffect(() => {
    setFilteredValueSets(valueSets);
    if (
      filteredValueSets.length > 0 &&
      conditionDetailsMap &&
      Object.keys(conditionDetailsMap).length > 0
    ) {
      setLoading(false);
    }
  }, [valueSets, conditionDetailsMap]);

  useEffect(() => {
    if (search !== "") {
      const filteredVS = vsTextSearch();
      setFilteredValueSets(filteredVS);
    } else {
      setFilteredValueSets(valueSets);
    }
    setCurrentPage(1);
  }, [search]);

  const paginatedValueSets = useMemo(() => {
    return filteredValueSets.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredValueSets, currentPage, itemsPerPage]);

  function goBack() {
    // resetQueryState();
    // setBuildStep("selection");
    console.log("do a backnav thing");
  }

  const formatConceptType = (conceptType: string) => {
    return conceptType.replace(
      conceptType.charAt(0),
      conceptType.charAt(0).toLocaleUpperCase(),
    );
  };

  const formatConditionDisplay = (conditionId: string | undefined) => {
    const conditionDetails =
      conditionId && conditionDetailsMap?.[conditionId].name;

    return conditionDetails ? formatDiseaseDisplay(conditionDetails) : "";
  };

  const formatValueSetDetails = (vs: DibbsValueSet) => {
    const system = formatSystem(vs.system) || "";

    const conceptType = vs.dibbsConceptType
      ? `${formatConceptType(vs.dibbsConceptType)} ${!!system ? " • " : ""}`
      : "";

    const condition = vs.conditionId
      ? `${formatConditionDisplay(vs.conditionId)} ${
          !!conceptType ? " • " : ""
        } `
      : "";

    return `${condition} ${conceptType} ${system}`;
  };

  const renderValueSetRows = () => {
    return paginatedValueSets.map((vs, index) => {
      return (
        <tr
          key={index}
          className={classNames(
            styles.valueSetTable__tableBody_row,
            vs?.valueSetId == activeValueSet?.valueSetId
              ? styles.activeValueSet
              : "",
          )}
          onClick={() => setActiveValueSet(vs)}
        >
          <td>
            <div className={styles.valueSetTable__tableBody_row_details}>
              <Highlighter
                className={styles.valueSetTable__tableBody_row_valueSetName}
                highlightClassName="searchHighlight"
                searchWords={[search]}
                autoEscape={true}
                textToHighlight={vs.valueSetName}
              />
              <Highlighter
                className={styles.valueSetTable__tableBody_row_valueSetDetails}
                highlightClassName="searchHighlight"
                searchWords={[search]}
                autoEscape={true}
                textToHighlight={formatValueSetDetails(vs)}
              />

              {/* TODO: render based on the user_created column once that is added*/}
              {false && (
                <Highlighter
                  className={styles.valueSetTable__tableBody_row_customValueSet}
                  highlightClassName="searchHighlight"
                  searchWords={[search]}
                  autoEscape={true}
                  textToHighlight={`Created by ${vs.author}`}
                />
              )}
            </div>

            {/* TODO: build out to include search on code terms within a value set? */}
            {/* {condition ? ( 
                <td className={styles.valueSetTable__tableBody_row_customValueSet}>
                  <strong>
                    Includes:{" "}
                      {filteredValueSets.length <
                        SUMMARIZE_CODE_RENDER_LIMIT ? (
                          // render the individual code matches
                          <span className="searchHighlight">
                            {codesToRender
                              .map((c) => c.code)
                              .join(", ")}
                          </span>
                        ) : ( 
                    //  past this many matches, don't render the individual codes in favor of a
                    // "this many matches" string 
                    <span className="searchHighlight">{`${1} codes`}</span> 
                    )} 
                  </strong>
                </td>
                ) : ( 
                "" 
              )} */}
            <div>
              <Icon.NavigateNext
                aria-label="Chevron indicating additional content"
                size={4}
              />
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <WithAuth>
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        <div className={styles.header}>
          {mode === "manage" ? (
            <Backlink onClick={() => {}} label={"Back to Query library"} />
          ) : (
            <Backlink onClick={goBack} label={"Back to My queries"} />
          )}
          <h1 className={styles.header__title}>Manage codes</h1>
          <div className={styles.header__subtitle}>
            Click on the checkbox to delete the value set or code
          </div>
          <Alert
            type="info"
            headingLevel="h4"
            noIcon={false}
            className={classNames("info-alert")}
          >
            Value sets are an organizational structure for easy management of
            codes. Every code belongs to a value set.
          </Alert>
        </div>
        <div className={classNames(styles.controls)}>
          <div className={styles.searchFilter}>
            <SearchField
              id="librarySearch"
              placeholder={"Search"}
              className={styles.codeLibrary__search}
              onChange={(e) => {
                e.preventDefault();
                setSearch(e.target.value);
              }}
            />
            <div className={styles.applyFilters}>
              <Icon.FilterList
                className="usa-icon qc-filter"
                size={3}
                aria-label="Icon indicating a menu with filter options"
                role="icon"
              />
              Filters
            </div>
          </div>
          <Button type="button" className={styles.button}>
            Add value set
          </Button>
        </div>
        <div className={styles.content}>
          <div className={styles.resultsContainer}>
            <div className={styles.content__left}>
              <Table
                className={classNames(
                  "display-flex flex-row",
                  styles.valueSetTable,
                )}
              >
                <thead
                  className={classNames(
                    "display-flex flex-column",
                    styles.valueSetTable__header,
                  )}
                >
                  <tr className={styles.valueSetTable__header_sectionHeader}>
                    <th>{"Value set".toLocaleUpperCase()}</th>
                  </tr>
                </thead>
                <tbody
                  className={classNames(
                    styles.overflowScroll,
                    styles.valueSetTable__tableBody,
                  )}
                >
                  {loading && paginatedValueSets.length <= 0 ? (
                    <tr className={styles.valueSetTable__tableBody_row}>
                      <td>
                        <Skeleton
                          containerClassName={styles.skeletonContainer}
                          className={styles.skeleton}
                          count={6}
                        />
                      </td>
                    </tr>
                  ) : !loading && filteredValueSets.length === 0 ? (
                    <tr className={styles.valueSetTable__tableBody_row}>
                      <td>No results found.</td>
                    </tr>
                  ) : (
                    renderValueSetRows()
                  )}
                </tbody>
              </Table>
            </div>

            <div className={styles.content__right}>
              {activeValueSet && (
                <Table
                  className={classNames(
                    "display-flex flex-row",
                    styles.conceptsTable,
                  )}
                >
                  <thead
                    className={classNames(
                      "display-flex flex-column",
                      styles.conceptsTable__header,
                    )}
                  >
                    {true ? (
                      <tr className={styles.lockedForEdits}>
                        <th>
                          {" "}
                          <Icon.Lock
                            role="icon"
                            className="qc-lock"
                          ></Icon.Lock>
                          This value set comes from the CSTE and cannot be
                          modified.
                        </th>
                      </tr>
                    ) : (
                      <tr
                        className={styles.conceptsTable__header_sectionHeader}
                      >
                        <th> {"Codes".toLocaleUpperCase()}</th>
                      </tr>
                    )}
                    <tr className={styles.columnHeaders}>
                      <th>Code</th>
                      <th>Name</th>
                    </tr>
                  </thead>
                  <tbody
                    className={classNames(
                      styles.overflowScroll,
                      styles.conceptsTable__tableBody,
                    )}
                  >
                    {activeValueSet?.concepts.map((vs) => (
                      <tr
                        key={vs.code}
                        className={classNames(
                          styles.conceptsTable__tableBody_row,
                        )}
                      >
                        <td className={styles.valueSetCode}>
                          <Highlighter
                            highlightClassName="searchHighlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={vs.code}
                          />
                        </td>
                        <td>
                          <Highlighter
                            highlightClassName="searchHighlight"
                            searchWords={[search]}
                            autoEscape={true}
                            textToHighlight={vs.display}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          </div>

          <div className={styles.paginationContainer}>
            <span>
              {`Showing ${(currentPage - 1) * itemsPerPage + 1} -
        ${Math.min(currentPage * itemsPerPage, filteredValueSets.length)} of 
        ${filteredValueSets.length} value sets`}
            </span>
            <Pagination
              className={styles.pagination}
              pathname="/codeLibrary"
              totalPages={Math.ceil(filteredValueSets.length / itemsPerPage)}
              currentPage={currentPage}
              onClickNext={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              onClickPrevious={() =>
                setCurrentPage((prev) => Math.max(prev - 1, 1))
              }
              onClickPageNumber={(event, page) => {
                event.preventDefault();
                setCurrentPage(page);
              }}
            />
            <div className={styles.itemsPerPageContainer}>
              <label htmlFor="actionsPerPage">Value sets per page</label>
              <Select
                name="valeSetsPerPage"
                id="valeSetsPerPage"
                value={itemsPerPage}
                className={styles.itemsPerPageDropdown}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Select>
            </div>
          </div>
        </div>

        {/* <div className="display-flex flex-auto">
          {mode == "select" && <div>Select view of the same thing</div>}
        </div> */}
      </div>
    </WithAuth>
  );
};

export default QueryBuilding;
