"use client";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { CustomCodeMode, emptyFilterSearch, emptyValueSet } from "./utils";
import { ConditionsMap, formatDiseaseDisplay } from "../queryBuilding/utils";
import Highlighter from "react-highlight-words";
import Skeleton from "react-loading-skeleton";
import {
  formatCodeSystemPrefix,
  formatStringToSentenceCase,
} from "@/app/shared/format-service";
import DropdownFilter, { FilterCategories } from "./components/DropdownFilter";
import CustomValueSetForm from "./components/CustomValueSetForm";
import { User } from "@/app/models/entities/users";
import { useSession } from "next-auth/react";
import { getUserByUsername } from "@/app/backend/user-management";
import { deleteCustomValueSet } from "@/app/shared/custom-code-service";
import dynamic from "next/dynamic";
import type { ModalProps, ModalRef } from "../../ui/designSystem/modal/Modal";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const CodeLibrary: React.FC = () => {
  // -------- component state -------- //
  // --------------------------------- //
  const [loading, setLoading] = useState<boolean>(true);
  const [mode, setMode] = useState<CustomCodeMode>("manage");

  const { data: session } = useSession();
  const username = session?.user?.username || "";
  const [currentUser, setCurrentUser] = useState<User>();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [textSearch, setTextSearch] = useState<string>("");
  const [filterSearch, setFilterSearch] =
    useState<FilterCategories>(emptyFilterSearch);
  const [showFilters, setShowFilters] = useState(false);
  const filterCount = Object.entries(filterSearch).filter(([key, val]) => {
    // since creators holds an array of values, make sure it's actually empty, since
    // empty arrays resolve truthy
    if (key == "creators") {
      return val && Object.keys(val)[0] !== "" && Object.values(val).length > 0;
    }
    return val !== "";
  }).length;

  const [conditionDetailsMap, setConditionsDetailsMap] =
    useState<ConditionsMap>();
  const [valueSets, setValueSets] = useState<DibbsValueSet[]>([]);
  const [filteredValueSets, setFilteredValueSets] = useState(valueSets);
  const [activeValueSet, setActiveValueSet] =
    useState<DibbsValueSet>(emptyValueSet);

  const modalRef = useRef<ModalRef>(null);

  const Modal = dynamic<ModalProps>(
    () => import("../../ui/designSystem/modal/Modal").then((mod) => mod.Modal),
    { ssr: false },
  );

  const ctx = useContext(DataContext);
  let totalPages = Math.ceil(filteredValueSets.length / itemsPerPage);

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

  async function handleChangeMode(mode: CustomCodeMode) {
    if (mode == "manage" || mode == "select") {
      // fetch fresh value set details if we are changing TO manage/select mode
      await fetchValueSetsAndConditions().then(() => {
        setMode(mode);
      });
    } else {
      setMode(mode);
    }
  }

  // ---------- useEffects ----------- //
  // --------------------------------- //

  // update the current page details when switching between build steps
  useEffect(() => {
    ctx?.setCurrentPage(mode);
    applyFilters();
  }, [mode]);

  // fetch value sets on page load
  useEffect(() => {
    ctx?.setToastConfig({
      position: "bottom-left",
      stacked: true,
      hideProgressBar: true,
    });

    async function fetchCurrentUser() {
      try {
        const currentUser = await getUserByUsername(username);
        setCurrentUser(currentUser.items[0]);
      } catch (error) {
        console.error(`Failed to fetch current user: ${error}`);
      }
    }

    fetchCurrentUser();
    fetchValueSetsAndConditions();
  }, []);

  // organize valuesets once they've loaded
  useEffect(() => {
    applyFilters();
    setActiveValueSet(paginatedValueSets[0]);

    if (
      filteredValueSets.length > 0 &&
      conditionDetailsMap &&
      Object.keys(conditionDetailsMap).length > 0
    ) {
      setLoading(false);
    }
  }, [valueSets, conditionDetailsMap]);

  const applyFilters = async () => {
    const matchCategory = (vs: DibbsValueSet) => {
      return filterSearch.category
        ? vs.dibbsConceptType === filterSearch.category
        : vs;
    };

    const matchCodeSystem = (vs: DibbsValueSet) =>
      filterSearch.codeSystem ? vs.system == filterSearch.codeSystem : vs;

    const matchCreators = (vs: DibbsValueSet) => {
      const creatorKey = Object.keys(filterSearch.creators)[0];
      return Object.values(filterSearch.creators).length > 0 &&
        creatorKey !== ""
        ? Object.values(filterSearch.creators).flat().includes(vs.author)
        : vs;
    };
    return setFilteredValueSets(
      valueSets
        .filter(handleTextSearch)
        .filter(matchCategory)
        .filter(matchCodeSystem)
        .filter(matchCreators),
    );
  };

  // update display based on text search and filters
  useEffect(() => {
    applyFilters();
    setCurrentPage(1);

    if (textSearch == "") {
      return setActiveValueSet(valueSets?.[0]);
    } else {
      return setActiveValueSet(paginatedValueSets?.[0]);
    }
  }, [textSearch, filterSearch]);

  // ---- page interaction/display ---- //
  // --------------------------------- //
  function goBack() {
    // TODO: this will need to be handled differently
    // depending on how we arrived at this page:
    // from gear menu: no backnav
    // from "start from scratch": back to templates
    // from hybrid/query building: back to query
    console.log("do a backnav thing");
  }

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
    const matchesSystem =
      vs.system &&
      vs.system.toLocaleLowerCase().includes(textSearch.toLocaleLowerCase());

    return (
      matchesName || matchesConditionName || matchesConceptType || matchesSystem
    );
  };

  const formatConditionDisplay = (conditionId: string) => {
    const conditionDetails =
      conditionId && conditionDetailsMap?.[conditionId].name;

    return conditionDetails ? formatDiseaseDisplay(conditionDetails) : "";
  };

  const formatValueSetDetails = (vs: DibbsValueSet) => {
    // extracts the system name from its url
    const system = vs.system ? formatCodeSystemPrefix(vs.system) : "";

    // capitalizes the first letter and removes the last 's' from the type
    const conceptType = vs.dibbsConceptType
      ? `${formatStringToSentenceCase(vs.dibbsConceptType).slice(0, -1)} ${
          !!system ? " • " : ""
        }`
      : "";

    // matches conditionId to its string value and strips (disease) from the end of the name
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
            {vs.userCreated && (
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

  const handleDeleteValueSet = async () => {
    if (!activeValueSet) {
      return;
    }
    setLoading(true);
    try {
      const result = await deleteCustomValueSet(activeValueSet);

      if (result.success) {
        await fetchValueSetsAndConditions();
        showToastConfirmation({
          body: `Value set "${activeValueSet.valueSetName}" successfully deleted.`,
        });
      } else {
        showToastConfirmation({
          variant: "error",
          body: `Error: Could not remove value set "${activeValueSet.valueSetName}"`,
        });
      }
    } catch (e) {
      console.error(e);
      showToastConfirmation({
        variant: "error",
        body: `Error: Could not remove value set "${activeValueSet.valueSetName}"`,
      });
    } finally {
      modalRef.current?.toggleModal();
      setLoading(false);
    }
  };

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

  // ------------ render ------------ //
  // -------------------------------- //
  return (
    <WithAuth>
      {mode == "manage" && (
        <div
          className={classNames("main-container__wide", styles.mainContainer)}
        >
          <div className={styles.header}>
            {mode === "manage" ? (
              <Backlink onClick={() => {}} label={"Back to Query library"} />
            ) : (
              <Backlink onClick={goBack} label={"Back to My queries"} />
            )}
            <h1 className={styles.header__title}>Manage codes</h1>
            {/* <div className={styles.header__subtitle}>
              Click on the checkbox to delete the value set or code
            </div> */}
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
                    currentUser={currentUser as User}
                  />
                )}
              </div>
            </div>

            <Button
              type="button"
              className={styles.button}
              onClick={() => handleChangeMode("create")}
            >
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
                    data-testid="table-valuesets"
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
                        className={
                          styles.valueSetTable__tableBody_row_noResults
                        }
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
                          <th>
                            <Button
                              className={classNames(
                                styles.editCodesBtn,
                                "button-secondary",
                              )}
                              type="button"
                              onClick={() => handleChangeMode("edit")}
                            >
                              {activeValueSet.concepts?.length <= 0
                                ? "Add codes"
                                : "Edit codes"}
                            </Button>
                            <Button
                              className={styles.deleteValueSet}
                              type="button"
                              onClick={() => modalRef.current?.toggleModal()}
                            >
                              Delete value set
                            </Button>
                          </th>
                        </tr>
                      )}
                      {activeValueSet.concepts.length == 0 ? (
                        <tr className={styles.noCodesAvailable}>
                          <th>There are no codes available.</th>
                        </tr>
                      ) : (
                        <tr className={styles.columnHeaders}>
                          <th>Code</th>
                          <th>Name</th>
                        </tr>
                      )}
                    </thead>
                    <tbody
                      className={classNames(
                        activeValueSet?.userCreated
                          ? styles.overflowScroll
                          : styles.overflowScroll_headerLocked,
                        styles.conceptsTable__tableBody,
                      )}
                      data-testid="table-codes"
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
              {totalPages > 0 && (
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
              )}
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
        </div>
      )}
      {(mode == "create" || mode == "edit") && (
        <CustomValueSetForm
          mode={mode}
          setMode={handleChangeMode}
          activeValueSet={
            activeValueSet?.userCreated ? activeValueSet : emptyValueSet
          }
        />
      )}
      <Modal
        id="delete-vs-modal"
        heading="Delete value set"
        modalRef={modalRef}
        buttons={[
          {
            text: "Delete value set",
            type: "button" as const,
            id: "delete-vs-confirm",
            className: classNames("usa-button", styles.modalButtonDelete),
            onClick: handleDeleteValueSet,
          },
          {
            text: "Cancel",
            type: "button" as const,
            id: "delete-vs-cancel",
            className: classNames(
              "usa-button usa-button--outline",
              styles.modalButtonCancel,
            ),
            onClick: () => modalRef.current?.toggleModal(),
          },
        ]}
        // errorMessage?: string | null; // New prop for error message
      >
        {`Are you sure you want to delete the value set "${activeValueSet?.valueSetName}?" This action cannot be undone`}
      </Modal>
    </WithAuth>
  );
};

export default CodeLibrary;
