import classNames from "classnames";
import {
  Alert,
  Button,
  Icon,
  Pagination,
  Select,
} from "@trussworks/react-uswds";
import styles from "./codeLibrary.module.scss";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import Backlink from "@/app/ui/designSystem/backLink/Backlink";
import SearchField from "@/app/ui/designSystem/searchField/SearchField";
import Table from "@/app/ui/designSystem/table/Table";
import Skeleton from "react-loading-skeleton";
import DropdownFilter from "./components/DropdownFilter";
import CustomValueSetForm from "./components/CustomValueSetForm";
import ValueSetTable from "./components/ValueSetTable";
import ConceptsTable from "./components/ConceptsTable";
import { useCodeLibraryState } from "./components/useCodeLibraryState";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const CodeLibrary: React.FC = () => {
  // ---- MAIN STATE & HANDLERS LIFTED INTO HOOK ---- //
  // Keeps all code together, but logic is organized
  const state = useCodeLibraryState();

  // ------------ render ------------ //
  // -------------------------------- //
  return (
    <WithAuth>
      {(state.mode == "manage" || state.mode == "select") && (
        <div
          className={classNames("main-container__wide", styles.mainContainer)}
        >
          <div className={styles.header}>
            {state.mode !== "manage" && (
              <Backlink
                onClick={state.goBack}
                label={`Back to ${
                  state.prevPage == "condition" ? "Create query" : "templates"
                }`}
              />
            )}
            <h1 className={styles.header__title}>
              {state.mode == "manage"
                ? "Manage codes"
                : `Select codes for "${state.queryName}"`}
            </h1>
            {state.mode == "select" && (
              <div className={styles.header__subtitle}>
                Check the box to add the value set or code to the query.
              </div>
            )}
            <Alert
              type="warning"
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
                  state.setTextSearch(e.target.value);
                }}
              />
              <div
                role="button"
                tabIndex={0}
                className={classNames(
                  styles.applyFilters,
                  state.filterCount > 0 ? styles.applyFilters_active : "",
                )}
                onClick={() => state.setShowFilters(true)}
              >
                <div>
                  <Icon.FilterList
                    className="usa-icon qc-filter"
                    size={3}
                    aria-label="Icon indicating a menu with filter options"
                    role="icon"
                  />
                  {state.filterCount <= 0
                    ? "Filters"
                    : `${state.filterCount} ${
                        state.filterCount > 1 ? `filters` : `filter`
                      } applied`}
                  {state.showFilters && state.currentUser && (
                    <DropdownFilter
                      filterCount={state.filterCount}
                      loading={state.loading}
                      setShowFilters={state.setShowFilters}
                      filterSearch={state.filterSearch}
                      setFilterSearch={state.setFilterSearch}
                      valueSets={state.valueSets}
                      currentUser={state.currentUser}
                    />
                  )}
                </div>
              </div>
            </div>
            {state.mode == "manage" && (
              <Button
                type="button"
                className={styles.button}
                onClick={() => state.handleChangeMode("create")}
              >
                Add value set
              </Button>
            )}
            {state.mode == "select" && (
              <>
                <p>
                  <em>Don't see your code listed? </em>
                  <Button
                    type="button"
                    unstyled
                    className={styles.manageCodesLink}
                    onClick={() => {
                      state.handleChangeMode("manage");
                    }}
                  >
                    Manage codes
                  </Button>
                </p>
                <Button
                  type="button"
                  // TODO: What contexts should it actually be disabled?
                  // disabled={
                  //   !state.customCodeIds || Object.keys(state.customCodeIds).length <= 0
                  // }
                  className={styles.button}
                  onClick={async () => {
                    const constructedQuery = await state.handleAddToQuery();
                    if (!constructedQuery) return;
                    await state.saveQueryAndRedirect(
                      constructedQuery,
                      state.queryName,
                      "/queryBuilding",
                      "valueset",
                    );
                  }}
                >
                  Next: Update query
                </Button>
              </>
            )}
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
                    data-testid={
                      state.mode === "manage"
                        ? "table-valuesets-manage"
                        : "table-valuesets-select"
                    }
                  >
                    {state.loading && state.paginatedValueSets.length <= 0 ? (
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
                    ) : !state.loading &&
                      state.filteredValueSets.length === 0 ? (
                      <tr
                        className={
                          styles.valueSetTable__tableBody_row_noResults
                        }
                      >
                        <td>No results found.</td>
                      </tr>
                    ) : (
                      <ValueSetTable
                        valueSets={state.paginatedValueSets}
                        activeValueSet={state.activeValueSet}
                        setActiveValueSet={state.setActiveValueSet}
                        customCodeIds={state.customCodeIds}
                        handleValueSetToggle={state.handleValueSetToggle}
                        mode={state.mode}
                        textSearch={state.textSearch}
                        formatValueSetDetails={state.formatValueSetDetails}
                      />
                    )}
                  </tbody>
                </Table>
              </div>
              <div className={styles.content__right}>
                {state.activeValueSet && (
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
                      {state.mode == "manage" && (
                        <>
                          {!state.activeValueSet.userCreated ? (
                            <tr className={styles.lockedForEdits}>
                              <th>
                                <Icon.Lock
                                  role="icon"
                                  className="qc-lock"
                                ></Icon.Lock>
                                {`This value set comes from ${state.valueSetSource} and cannot be
                          modified.`}
                              </th>
                            </tr>
                          ) : (
                            <tr
                              className={
                                styles.conceptsTable__header_sectionHeader
                              }
                            >
                              <th>
                                <Button
                                  className={classNames(
                                    styles.editCodesBtn,
                                    "button-secondary",
                                  )}
                                  type="button"
                                  onClick={() => state.handleChangeMode("edit")}
                                >
                                  {state.activeValueSet.concepts?.length <= 0
                                    ? "Add codes"
                                    : "Edit codes"}
                                </Button>
                                <Button
                                  className={styles.deleteValueSet}
                                  type="button"
                                  onClick={() =>
                                    state.modalRef.current?.toggleModal()
                                  }
                                >
                                  Delete value set
                                </Button>
                              </th>
                            </tr>
                          )}
                        </>
                      )}
                      {state.mode == "select" && (
                        <tr
                          className={styles.valueSetTable__header_sectionHeader}
                        >
                          <th>{"Codes".toLocaleUpperCase()}</th>
                        </tr>
                      )}
                      {state.activeValueSet.concepts.length == 0 ? (
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
                        state.activeValueSet?.userCreated
                          ? styles.overflowScroll
                          : styles.overflowScroll_headerLocked,
                        styles.conceptsTable__tableBody,
                      )}
                      data-testid="table-codes"
                    >
                      <ConceptsTable
                        activeValueSet={state.activeValueSet}
                        mode={state.mode}
                        customCodeIds={state.customCodeIds}
                        handleConceptToggle={state.handleConceptToggle}
                        textSearch={state.textSearch}
                      />
                    </tbody>
                  </Table>
                )}
              </div>
            </div>
            <div className={styles.paginationContainer}>
              <span>{state.paginationText}</span>
              {state.totalPages > 0 && (
                <Pagination
                  className={styles.pagination}
                  pathname="/codeLibrary"
                  totalPages={state.totalPages <= 0 ? 1 : state.totalPages}
                  currentPage={state.currentPage}
                  onClickNext={() =>
                    state.setCurrentPage((prev) =>
                      Math.min(prev + 1, state.totalPages),
                    )
                  }
                  onClickPrevious={() =>
                    state.setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  onClickPageNumber={(event, page) => {
                    event.preventDefault();
                    state.setCurrentPage(page);
                  }}
                />
              )}
              <div className={styles.itemsPerPageContainer}>
                <label htmlFor="actionsPerPage">Value sets per page</label>
                <Select
                  name="valeSetsPerPage"
                  id="valeSetsPerPage"
                  value={state.itemsPerPage}
                  className={styles.itemsPerPageDropdown}
                  onChange={(e) => {
                    state.setItemsPerPage(Number(e.target.value));
                    state.setCurrentPage(1);
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
      {(state.mode == "create" || state.mode == "edit") && (
        <CustomValueSetForm
          mode={state.mode}
          setMode={state.handleChangeMode}
          activeValueSet={
            state.activeValueSet?.userCreated
              ? state.activeValueSet
              : state.emptyValueSet
          }
        />
      )}
      {state.mode == "select" && (
        <>
          <p>
            <Backlink
              onClick={state.goBack}
              label={`Back to ${
                state.prevPage == "valueset" ? "Create query" : "templates"
              }`}
            />
          </p>
        </>
      )}
      <state.Modal
        id="delete-vs-modal"
        heading="Delete value set"
        modalRef={state.modalRef}
        buttons={[
          {
            text: "Delete value set",
            type: "button" as const,
            id: "delete-vs-confirm",
            className: classNames("usa-button", "usa-button--destructive"),
            onClick: state.handleDeleteValueSet,
          },
          {
            text: "Cancel",
            type: "button" as const,
            id: "delete-vs-cancel",
            className: classNames(
              "usa-button usa-button--outline",
              styles.modalButtonCancel,
            ),
            onClick: () => state.modalRef.current?.toggleModal(),
          },
        ]}
      >
        {`Are you sure you want to delete the value set "${state.activeValueSet?.valueSetName}?" This action cannot be undone`}
      </state.Modal>
    </WithAuth>
  );
};

export default CodeLibrary;
