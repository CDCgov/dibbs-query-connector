"use client";
import {
  useMemo,
  //  useRef,
  useState,
} from "react";
import { useContext, useEffect } from "react";
import { DataContext } from "@/app/shared/DataProvider";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import LoadingView from "@/app/ui/designSystem/LoadingView";
import classNames from "classnames";
import styles from "./codeLibrary.module.scss";
import Backlink from "@/app/ui/designSystem/backLink/Backlink";
import {
  Alert,
  Button,
  Icon,
  Pagination,
  Select,
} from "@trussworks/react-uswds";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
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
  const [search, setSearch] = useState<string>();
  const [currentPage, setCurrentPage] = useState(1);
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
    // console.log(valueSets);
    setFilteredValueSets(valueSets);
  }, [valueSets]);

  useEffect(() => {
    if (search !== "") {
      setFilteredValueSets(
        valueSets.filter((vs) => {
          const matchesSearch = vs.display
            .toLocaleLowerCase()
            .includes(search?.toLocaleLowerCase());
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
    setValueSets(vs.items);
  }

  function goBack() {
    // resetQueryState();
    // setBuildStep("selection");
    console.log("do a backnav thing");
  }

  return (
    <WithAuth>
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        {mode === "manage" ? (
          <Backlink onClick={() => {}} label={"Back to Query library"} />
        ) : (
          <Backlink onClick={goBack} label={"Back to My queries"} />
        )}

        <div className={styles.header}>
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
        <div className={styles.displayContent}>
          <div className={styles.resultsContainer}>
            <div className={styles.content__left}>
              <div className={styles.vsHeader}>
                {"Value set".toLocaleUpperCase()}
              </div>
              <div className={styles.valueSetList}>
                {paginatedValueSets.length > 0 ? (
                  paginatedValueSets.map((vs, index) => {
                    return (
                      <div key={index} className={styles.vsRow}>
                        <div
                          style={{
                            color: "#111111",
                          }}
                        >
                          {vs.display}
                        </div>
                        <div style={{ color: "#5C5C5C" }}>
                          {vs.valueset_name} · {vs.dibbs_concept_type} ·{" "}
                          {vs.author}
                        </div>

                        {index % 7 ? (
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#5C5C5C",
                              fontStyle: "italic",
                            }}
                          >
                            Created by Haley Blake
                          </div>
                        ) : (
                          ""
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div key={1} className={styles.vsRow}>
                    <div
                      style={{
                        color: "#111111",
                      }}
                    >
                      No results found.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.content__right}>
              <div className={styles.lockedForEdits}>
                <Icon.Lock role="icon" className="qc-lock"></Icon.Lock>
                This value set comes from the CSTE and cannot be modified.
              </div>
              <div
                className="display-flex flex-row"
                style={{ color: "#111111", fontWeight: 700 }}
              >
                <div style={{ width: "7.5rem" }}>Code</div>
                <div>Name</div>
              </div>
              {/* <div className="display-flex flex-row margin-bottom-2">
                <div style={{ width: "7.5rem" }}>103514009</div>
                <div>Chlamydophila pneumoniae (organism)</div>
              </div>{" "} */}
              {/* <div className="display-flex flex-row margin-bottom-2">
                <div style={{ width: "7.5rem" }}>103514009</div>
                <div>Chlamydophila pneumoniae (organism)</div>
              </div>{" "}
              <div className="display-flex flex-row margin-bottom-2">
                <div style={{ width: "7.5rem" }}>103514009</div>
                <div>Chlamydophila pneumoniae (organism)</div>
              </div>{" "}
              <div className="display-flex flex-row margin-bottom-2">
                <div style={{ width: "7.5rem" }}>103514009</div>
                <div>Chlamydophila pneumoniae (organism)</div>
              </div>{" "}
              <div className="display-flex flex-row margin-bottom-2">
                <div style={{ width: "7.5rem" }}>103514009</div>
                <div>Chlamydophila pneumoniae (organism)</div>
              </div>{" "}
              <div className="display-flex flex-row margin-bottom-2">
                <div style={{ width: "7.5rem" }}>103514009</div>
                <div>Chlamydophila pneumoniae (organism)</div>
              </div>{" "}
              <div className="display-flex flex-row margin-bottom-2">
                <div style={{ width: "7.5rem" }}>103514009</div>
                <div>Chlamydophila pneumoniae (organism)</div>
              </div>{" "} */}
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
                value={10}
                className={styles.itemsPerPageDropdown}
                onChange={(e) => {
                  // setActionsPerPage(Number(e.target.value));
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

        <div className="display-flex flex-auto">
          {/* Step Two: Select ValueSets */}
          {mode == "select" && <div>Select view of the same thing</div>}
        </div>
        {loading && <LoadingView loading={loading} />}
      </div>
    </WithAuth>
  );
};

export default QueryBuilding;
