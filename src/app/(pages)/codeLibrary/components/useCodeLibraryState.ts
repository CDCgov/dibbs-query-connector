"use client";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { DataContext } from "@/app/shared/DataProvider";
import { useSession } from "next-auth/react";
import { getUserByUsername } from "@/app/backend/user-management";
import {
  getAllValueSets,
  getConditionsData,
} from "@/app/shared/database-service";
import {
  insertCustomValuesetsIntoQuery,
  deleteCustomValueSet,
} from "@/app/shared/custom-code-service";
import { getSavedQueryById } from "@/app/backend/query-building/service";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { EMPTY_CONCEPT_TYPE } from "../../queryBuilding/utils";
import { NestedQuery, QueryTableResult } from "../../queryBuilding/utils";
import { CustomCodeMode, emptyFilterSearch, emptyValueSet } from "../utils";
import { User } from "@/app/models/entities/users";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { FilterCategories } from "../components/DropdownFilter";
import { ConditionsMap, formatDiseaseDisplay } from "../../queryBuilding/utils";
import {
  formatCodeSystemPrefix,
  formatStringToSentenceCase,
} from "@/app/shared/format-service";
import { ModalRef } from "@trussworks/react-uswds";
import type { ModalProps } from "@/app/ui/designSystem/modal/Modal";
import { groupConditionConceptsIntoValueSets } from "@/app/shared/utils";
import { useSaveQueryAndRedirect } from "@/app/backend/query-building/useSaveQueryAndRedirect";

/**
 * useCodeLibraryState
 * Custom hook for all logic/state in CodeLibrary
 * @returns - An object containing all state and functions for the CodeLibrary component.
 */
export function useCodeLibraryState() {
  // -------- component state -------- //
  // --------------------------------- //
  const ctx = useContext(DataContext);

  const [loading, setLoading] = useState<boolean>(true);
  const [mode, setMode] = useState<CustomCodeMode>(
    (ctx?.selectedQuery?.pageMode as CustomCodeMode) || "manage",
  );
  const [prevPage, setPrevPage] = useState("");
  const { data: session } = useSession();
  const username = session?.user?.username || "";
  const [currentUser, setCurrentUser] = useState<User | undefined>();

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
  const [isFiltered, setIsFiltered] = useState(false);

  const [conditionDetailsMap, setConditionsDetailsMap] =
    useState<ConditionsMap>();
  const [valueSets, setValueSets] = useState<DibbsValueSet[]>([]);
  const [filteredValueSets, setFilteredValueSets] = useState(valueSets);
  const [activeValueSet, setActiveValueSet] =
    useState<DibbsValueSet>(emptyValueSet);

  const modalRef = useRef<ModalRef>(null);

  // get the query data from the context
  const selectedQuery = ctx?.selectedQuery;
  const queryName = selectedQuery?.queryName ?? "query";

  // ---------- checkbox management state --------- //
  // Get custom value sets from context (assume structure: queryData.custom = { [valueSetId]: DibbsValueSet })
  const [customCodeIds, setCustomCodeIds] = useState<{
    [vsId: string]: DibbsValueSet;
  }>({});
  // initialize any existing custom value sets
  useEffect(() => {
    if (!selectedQuery?.queryId) return;
    getSavedQueryById(selectedQuery.queryId).then(
      (query: QueryTableResult | undefined) => {
        // Only hydrate previous selections
        const queryCustom =
          (query?.queryData?.custom as {
            [vsId: string]: DibbsValueSet & { includeValueSet?: boolean };
          }) || {};
        setCustomCodeIds(queryCustom);
      },
    );
  }, [selectedQuery?.queryId]);

  const handleValueSetToggle = (vsId: string, checked: boolean) => {
    setCustomCodeIds((prev) => {
      const valueSet =
        prev[vsId] ?? valueSets.find((vs) => vs.valueSetId === vsId);
      if (!valueSet) return prev;
      return {
        ...prev,
        [vsId]: {
          ...valueSet,
          includeValueSet: checked,
          concepts: valueSet.concepts.map((c) => ({ ...c, include: checked })),
        },
      };
    });
  };

  const handleConceptToggle = (
    vsId: string,
    code: string,
    checked: boolean,
  ) => {
    setCustomCodeIds((prev) => {
      const vs = prev[vsId];
      if (!vs) {
        // Seed only the toggled concept
        const valueSet = valueSets.find((vs) => vs.valueSetId === vsId);
        if (!valueSet) return prev;
        return {
          ...prev,
          [vsId]: {
            ...valueSet,
            includeValueSet: checked,
            concepts: valueSet.concepts.map((c) =>
              c.code === code
                ? { ...c, include: checked }
                : { ...c, include: false },
            ),
          },
        };
      } else {
        // Update only the toggled concept
        const newConcepts = vs.concepts.map((c) =>
          c.code === code ? { ...c, include: checked } : c,
        );
        const includeValueSet = newConcepts.some((c) => c.include);
        return {
          ...prev,
          [vsId]: {
            ...vs,
            includeValueSet,
            concepts: newConcepts,
          },
        };
      }
    });
  };

  const handleAddToQuery = async () => {
    if (!ctx?.selectedQuery?.queryId || !currentUser) return null;
    const setsToAdd = Object.values(customCodeIds);
    const result = await insertCustomValuesetsIntoQuery(
      currentUser.id,
      setsToAdd,
      ctx.selectedQuery.queryId,
    );
    if (result.success) {
      const updatedQuery = await getSavedQueryById(ctx.selectedQuery.queryId);
      // Strict, type-safe transformation (NO 'any', NO helpers)
      let constructedQuery: NestedQuery = {};
      if (updatedQuery?.queryData) {
        Object.entries(
          updatedQuery.queryData as Record<
            string,
            Record<string, DibbsValueSet>
          >,
        ).forEach(([conditionId, valueSetMap]) => {
          constructedQuery[conditionId] = structuredClone(EMPTY_CONCEPT_TYPE);
          Object.entries(valueSetMap).forEach(([vsId, dibbsVs]) => {
            constructedQuery[conditionId][dibbsVs.dibbsConceptType][vsId] =
              dibbsVs;
          });
        });
      }

      if (updatedQuery && ctx?.setSelectedQuery) {
        ctx.setSelectedQuery(updatedQuery);
      }
      showToastConfirmation({ body: "The query has been saved." });
      return constructedQuery;
    } else {
      showToastConfirmation({ body: "Failed to add codes", variant: "error" });
      return null;
    }
  };

  let totalPages = Math.ceil(filteredValueSets.length / itemsPerPage);

  // --- fetch value sets/conditions from DB
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
    setPrevPage(ctx?.currentPage || "");
    setMode(mode);
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
    setFilteredValueSets(
      valueSets
        .filter(handleTextSearch)
        .filter(matchCategory)
        .filter(matchCodeSystem)
        .filter(matchCreators),
    );

    const isFiltered = Object.entries(filterSearch).some(([key, val]) => {
      let filterApplied = false;

      if (key == "creators") {
        filterApplied = !!val && Object.values(val).flat().length > 0;
      } else {
        filterApplied = val !== "";
      }

      return filterApplied;
    });

    textSearch !== "" || !!isFiltered
      ? setIsFiltered(true)
      : setIsFiltered(false);
  };

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

  // --------- Save + Modal (so you can use them in main file) --------- //
  const saveQueryAndRedirect = useSaveQueryAndRedirect();

  // --------- goBack handler (so you can use it directly) --------- //
  function goBack() {
    ctx?.selectedQuery &&
      saveQueryAndRedirect(
        {},
        ctx?.selectedQuery?.queryName,
        "/queryBuilding",
        prevPage,
      );
  }

  // --------- Modal dynamic import (so you can use as <state.Modal/>) --------- //
  const Modal = dynamic<ModalProps>(
    () =>
      import("../../../ui/designSystem/modal/Modal").then((mod) => mod.Modal),
    { ssr: false },
  );

  return {
    ctx,
    loading,
    setLoading,
    mode,
    setMode,
    prevPage,
    setPrevPage,
    session,
    username,
    currentUser,
    setCurrentUser,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    textSearch,
    setTextSearch,
    filterSearch,
    setFilterSearch,
    showFilters,
    setShowFilters,
    filterCount,
    isFiltered,
    setIsFiltered,
    conditionDetailsMap,
    setConditionsDetailsMap,
    valueSets,
    setValueSets,
    filteredValueSets,
    setFilteredValueSets,
    activeValueSet,
    setActiveValueSet,
    modalRef,
    selectedQuery,
    queryName,
    customCodeIds,
    setCustomCodeIds,
    handleValueSetToggle,
    handleConceptToggle,
    handleAddToQuery,
    fetchValueSetsAndConditions,
    handleChangeMode,
    applyFilters,
    handleTextSearch,
    formatConditionDisplay,
    formatValueSetDetails,
    handleDeleteValueSet,
    paginatedValueSets,
    paginationText,
    valueSetSource,
    totalPages,
    saveQueryAndRedirect,
    goBack,
    Modal,
    emptyValueSet, // so you can use in fallback for CustomValueSetForm
  };
}
