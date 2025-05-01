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
import {
  DibbsValueSet,
  DibbsConceptType,
} from "@/app/models/entities/valuesets";
import { formatSystem } from "./utils";
import { ConditionsMap, formatDiseaseDisplay } from "../queryBuilding/utils";
import Highlighter from "react-highlight-words";
import Skeleton from "react-loading-skeleton";
import { formatStringToSentenceCase } from "@/app/shared/format-service";
import DropdownFilter, { FilterCategories } from "./DropdownFilter";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const CodeLibrary: React.FC = () => {
  type Mode = "manage" | "select";

  const [loading, setLoading] = useState<boolean>(true);
  const [mode, setMode] = useState<Mode>("manage");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [textSearch, setTextSearch] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState<FilterCategories>({
    category: "" as DibbsConceptType,
    codeSystem: "",
    creator: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const filterCount = Object.values(filterSearch).filter(
    (item) => item !== "",
  ).length;

  const [conditionDetailsMap, setConditionsDetailsMap] =
    useState<ConditionsMap>();
  const [valueSets, setValueSets] = useState<DibbsValueSet[]>([]);
  const [filteredValueSets, setFilteredValueSets] = useState(valueSets);
  const [activeValueSet, setActiveValueSet] = useState<DibbsValueSet | null>();

  const ctx = useContext(DataContext);
  let totalPages = Math.ceil(filteredValueSets.length / itemsPerPage);

  const handleTextSearch = (vs: DibbsValueSet) => {
    const matchesName = vs.valueSetName
      .toLocaleLowerCase()
      .includes(textSearch.toLocaleLowerCase());
    const conditionName =
      vs.conditionId && conditionDetailsMap?.[vs.conditionId].name;
    const matchesConditionName =
      conditionName &&
      conditionName
        .toLocaleLowerCase()
        .includes(textSearch.toLocaleLowerCase());
    const matchesConceptType = vs.dibbsConceptType
      .toLocaleLowerCase()
      .includes(textSearch.toLocaleLowerCase());
    const matchesSystem = vs.system
      .toLocaleLowerCase()
      .includes(textSearch.toLocaleLowerCase());

    return (
      matchesName || matchesConditionName || matchesConceptType || matchesSystem
    );
  };

  // update the current page details when switching between build steps
  useEffect(() => {
    ctx?.setCurrentPage(mode);
  }, [mode]);

  // fetch value sets on page load
  useEffect(() => {
    ctx?.setToastConfig({
      position: "bottom-left",
      stacked: true,
      hideProgressBar: true,
    });

    async function fetchValueSetsAndConditions() {
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
    }

    fetchValueSetsAndConditions();
  }, []);

  useEffect(() => {
    setFilteredValueSets(valueSets);
    setActiveValueSet(paginatedValueSets[0]);

    if (
      filteredValueSets.length > 0 &&
      conditionDetailsMap &&
      Object.keys(conditionDetailsMap).length > 0
    ) {
      setLoading(false);
    }
  }, [valueSets, conditionDetailsMap]);

  useEffect(() => {
    const matchCategory = (vs: DibbsValueSet) => {
      return filterSearch.category
        ? vs.dibbsConceptType === filterSearch.category
        : vs;
    };

    const matchCodeSystem = (vs: DibbsValueSet) =>
      filterSearch.codeSystem ? vs.system == filterSearch.codeSystem : vs;

    const matchCreator = (vs: DibbsValueSet) =>
      filterSearch.creator ? vs.author == filterSearch.creator : vs;

    setFilteredValueSets(
      valueSets
        .filter(handleTextSearch)
        .filter(matchCategory)
        .filter(matchCodeSystem)
        .filter(matchCreator),
    );

    setCurrentPage(1);
    if (textSearch == "") {
      return setActiveValueSet(valueSets?.[0]);
    } else {
      return setActiveValueSet(paginatedValueSets?.[0]);
    }
  }, [textSearch, filterSearch]);

  const paginatedValueSets = useMemo(() => {
    setActiveValueSet(filteredValueSets[0]);
    return filteredValueSets.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [valueSets, filteredValueSets, currentPage, itemsPerPage]);

  const isFiltered =
    valueSets.length !== filteredValueSets.length ||
    Object.values(filterSearch).some((filter) => filter !== "");

  function goBack() {
    // TODO: this will need to be handled differently
    // depending on how we arrived at this page:
    // from gear menu: no backnav
    // from "start from scratch": back to templates
    // from hybrid/query building: back to query
    console.log("do a backnav thing");
  }

  const formatConditionDisplay = (conditionId: string | undefined) => {
    const conditionDetails =
      conditionId && conditionDetailsMap?.[conditionId].name;

    return conditionDetails ? formatDiseaseDisplay(conditionDetails) : "";
  };

  const formatValueSetDetails = (vs: DibbsValueSet) => {
    const system = formatSystem(vs.system) || "";

    const conceptType = vs.dibbsConceptType
      ? `${formatStringToSentenceCase(vs.dibbsConceptType)} ${
          !!system ? " • " : ""
        }`
      : "";

    const condition = vs.conditionId
      ? `${formatConditionDisplay(vs.conditionId)} ${
          !!conceptType ? " • " : ""
        } `
      : "";

    return `${condition} ${conceptType} ${system}`;
  };

  const renderValueSetRows = () => {
    return paginatedValueSets.map((vs, index) => (
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
          {/* TODO: build out search to include match on code terms within a value set? */}
          <div className={styles.valueSetTable__tableBody_row_details}>
            <Highlighter
              className={styles.valueSetTable__tableBody_row_valueSetName}
              highlightClassName="searchHighlight"
              searchWords={[textSearch]}
              autoEscape={true}
              textToHighlight={vs.valueSetName}
            />
            <Highlighter
              className={styles.valueSetTable__tableBody_row_valueSetDetails}
              highlightClassName="searchHighlight"
              searchWords={[textSearch]}
              autoEscape={true}
              textToHighlight={formatValueSetDetails(vs)}
            />
            {/* TODO: render based on the user_created column once that is added */}
            {false && (
              <Highlighter
                className={styles.valueSetTable__tableBody_row_customValueSet}
                highlightClassName="searchHighlight"
                searchWords={[textSearch]}
                autoEscape={true}
                textToHighlight={`Created by ${vs.author}`}
              />
            )}
          </div>
          <div>
            <Icon.NavigateNext
              aria-label="Right chevron indicating additional content"
              size={4}
            />
          </div>
        </td>
      </tr>
    ));
  };

  const paginationText = `Showing ${
    totalPages === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  } -
  ${Math.min(currentPage * itemsPerPage, filteredValueSets.length)} of 
  ${filteredValueSets.length} value sets ${isFiltered ? `(filtered)` : ""}`;

  const valueSetSource =
    activeValueSet?.author == "CSTE Steward"
      ? "the CSTE"
      : activeValueSet?.author == "Center for Public Health Innovation"
        ? "CPHI"
        : activeValueSet?.author;

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
              className={styles.search}
              onChange={(e) => {
                e.preventDefault();
                setTextSearch(e.target.value);
              }}
            />
            <div
              role="button"
              tabIndex={0}
              className={classNames(
                styles.applyFilters,
                filterCount > 0 ? styles.applyFilters_active : "",
              )}
              onClick={() => setShowFilters(true)}
            >
              <Icon.FilterList
                className="usa-icon qc-filter"
                size={3}
                aria-label="Icon indicating a menu with filter options"
                role="icon"
              />
              {filterCount <= 0
                ? "Filters"
                : `${filterCount} ${
                    filterCount > 1 ? `filters` : `filter`
                  } applied`}
              {showFilters && (
                <DropdownFilter
                  filterCount={filterCount}
                  loading={loading}
                  setShowFilters={setShowFilters}
                  filterSearch={filterSearch}
                  setFilterSearch={setFilterSearch}
                  valueSets={valueSets}
                />
              )}{" "}
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
                    <tr
                      className={styles.valueSetTable__tableBody_row}
                      data-testid={"loading-skeleton"}
                    >
                      <td>
                        <Skeleton
                          containerClassName={styles.skeletonContainer}
                          className={styles.skeleton}
                          count={6}
                        />
                      </td>
                    </tr>
                  ) : !loading && filteredValueSets.length === 0 ? (
                    <tr
                      className={styles.valueSetTable__tableBody_row_noResults}
                    >
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
                    {!activeValueSet.userCreated ? (
                      <tr className={styles.lockedForEdits}>
                        <th>
                          <Icon.Lock
                            role="icon"
                            className="qc-lock"
                          ></Icon.Lock>
                          {`This value set comes from ${valueSetSource} and cannot be
                          modified.`}
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
                      activeValueSet?.userCreated
                        ? styles.overflowScroll
                        : styles.overflowScroll_headerLocked,
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
                            searchWords={[textSearch]}
                            autoEscape={true}
                            textToHighlight={vs.code}
                          />
                        </td>
                        <td>
                          <Highlighter
                            highlightClassName="searchHighlight"
                            searchWords={[textSearch]}
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
            <span>{paginationText}</span>
            <Pagination
              className={styles.pagination}
              pathname="/codeLibrary"
              totalPages={totalPages <= 0 ? 1 : totalPages}
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

export default CodeLibrary;
