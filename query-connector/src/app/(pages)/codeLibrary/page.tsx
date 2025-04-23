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
import LoadingView from "@/app/ui/designSystem/LoadingView";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import Table from "@/app/ui/designSystem/table/Table";
import { groupConditionConceptsIntoValueSets } from "@/app/shared/utils";
import { getAllValueSets } from "@/app/shared/database-service";
import { DibbsValueSet } from "@/app/models/entities/valuesets";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  type Mode = "manage" | "select";
  // const focusRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>("manage");
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeValueSet, setActiveValueSet] = useState<DibbsValueSet | null>(
    null,
  );
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [valueSets, setValueSets] = useState<DibbsValueSet[]>([]);
  const [filteredValueSets, setFilteredValueSets] = useState(valueSets);

  const ctx = useContext(DataContext);

  const totalPages = Math.ceil(filteredValueSets.length / itemsPerPage);

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
    fetchValueSets();
  }, []);

  useEffect(() => {
    setFilteredValueSets(valueSets);
  }, [valueSets]);

  useEffect(() => {
    if (search !== "") {
      setFilteredValueSets(
        valueSets.filter((vs) => {
          const matchesSearch = vs.valueSetName
            .toLocaleLowerCase()
            .includes(search.toLocaleLowerCase());
          return matchesSearch;
        }),
      );
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

  async function fetchValueSets() {
    const vs = await getAllValueSets();
    const formattedVs =
      vs.items && groupConditionConceptsIntoValueSets(vs.items);

    setValueSets(formattedVs);
  }

  function goBack() {
    // resetQueryState();
    // setBuildStep("selection");
    console.log("do a backnav thing");
  }

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
                  {paginatedValueSets.length > 0 ? (
                    paginatedValueSets.map((vs, index) => {
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
                          <td>{vs.valueSetName}</td>
                          <td>
                            {vs.valueSetName} · {vs.dibbsConceptType} ·{" "}
                            {vs.author}
                          </td>

                          {index % 7 ? (
                            <td
                              className={
                                styles.valueSetTable__tableBody_row_customValueSet
                              }
                            >
                              Created by Haley Blake
                            </td>
                          ) : (
                            ""
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr className={styles.valueSetTable__tableBody_row}>
                      <td>No results found.</td>
                    </tr>
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
                        <td className={styles.valueSetCode}>{vs.code}</td>
                        <td>{vs.display}</td>
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
        {loading && <LoadingView loading={loading} />}
      </div>
    </WithAuth>
  );
};

export default QueryBuilding;
