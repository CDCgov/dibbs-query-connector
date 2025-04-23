"use client";
import {
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
import { ValueSet } from "fhir/r4";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  type Mode = "manage" | "select";
  // const focusRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>("manage");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [valueSets, setValueSets] = useState<ValueSet[]>([]);
  const [filteredValueSets, setFilteredValueSets] = useState([]);

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
  }, []);

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
                console.log(e.target.value);
              }}
            />
            <div className={styles.applyFilters}>
              <Icon.FilterList
                className="usa-icon qc-filter"
                size={3}
                aria-label="Icon indicating a menu with filter options"
              />
              Filters
            </div>
          </div>
          <Button type="button" className={styles.button}>
            Add value set
          </Button>
        </div>
        <div className={styles.displayContent}>
          <div className="display-flex margin-top-2">
            <div className={styles.content__left}>
              <div className={styles.vsHeader}>
                {"Value set".toLocaleUpperCase()}
              </div>
              <div className={styles.vsRow}>
                <div
                  style={{
                    color: "#111111",
                  }}
                >
                  Chlamydia species (Organism or Substance in Lab Results)
                </div>
                <div style={{ color: "#5C5C5C" }}>
                  Chlamydia trachomatis infection · Labs · SNOMED
                </div>
              </div>
              <div className={styles.vsRow}>
                {" "}
                <div
                  style={{
                    color: "#111111",
                  }}
                >
                  Chlamydia species (Organism or Substance in Lab Results)
                </div>
                <div style={{ color: "#5C5C5C" }}>
                  Chlamydia trachomatis infection · Labs · SNOMED
                </div>
              </div>
              <div className={styles.vsRow}>
                {" "}
                <div
                  style={{
                    color: "#111111",
                  }}
                >
                  Chlamydia species (Organism or Substance in Lab Results)
                </div>
                <div style={{ color: "#5C5C5C" }}>
                  Chlamydia trachomatis infection · Labs · SNOMED
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#5C5C5C",
                    fontStyle: "italic",
                  }}
                >
                  Created by Haley Blake
                </div>
              </div>
            </div>
            <div className={styles.content__right}>
              <div className={styles.lockedForEdits}>
                <Icon.Lock className="qc-lock"></Icon.Lock>
                This value set comes from the CSTE and cannot be modified.
              </div>
              <div
                className="display-flex flex-row"
                style={{ color: "#111111", fontWeight: 700 }}
              >
                <div style={{ width: "7.5rem" }}>Code</div>
                <div>Name</div>
              </div>
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
              </div>{" "}
              <div className="display-flex flex-row margin-bottom-2">
                <div style={{ width: "7.5rem" }}>103514009</div>
                <div>Chlamydophila pneumoniae (organism)</div>
              </div>{" "}
              <div className="display-flex flex-row margin-bottom-2">
                <div style={{ width: "7.5rem" }}>103514009</div>
                <div>Chlamydophila pneumoniae (organism)</div>
              </div>{" "}
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
              totalPages={10}
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
