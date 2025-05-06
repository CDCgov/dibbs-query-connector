import { Dispatch, RefObject, SetStateAction, useEffect, useRef } from "react";
import { Button, Select } from "@trussworks/react-uswds";
import styles from "./codeLibrary.module.scss";
import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";
import { formatStringToSentenceCase } from "@/app/shared/format-service";
import { formatSystem } from "./utils";

export type FilterCategories = {
  category: DibbsConceptType | undefined;
  codeSystem: string;
  creator: string;
};

type DropdownFilterProps = {
  setFilterSearch: Dispatch<SetStateAction<FilterCategories>>;
  filterSearch: FilterCategories;
  valueSets: DibbsValueSet[];
  setShowFilters: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  filterCount: number;
};

/**
 * @param root0 props
 * @param root0.filterSearch the filter criteria
 * @param root0.setFilterSearch state function to update filter criteria
 * @param root0.setShowFilters state function to toggle showing/hiding the dropdown filters
 * @param root0.valueSets the value sets to apply the filter(s) to
 * @param root0.loading the loading state of the parent's value set data
 * @param root0.filterCount the number of filters currently applied to the result set
 * @returns  the DropdownFilter component
 */
const DropdownFilter: React.FC<DropdownFilterProps> = ({
  filterSearch,
  setFilterSearch,
  valueSets,
  setShowFilters,
  loading,
  filterCount,
}) => {
  const valueSetCategories: {
    [dibbsConceptType in DibbsConceptType]: dibbsConceptType;
  } = {
    labs: "labs",
    medications: "medications",
    conditions: "conditions",
  };
  const filterShortcut = (type: string) => {
    // TODO: logic to support "created by me" / "created by my team" filtering
    setFilterSearch({ ...filterSearch, creator: type });
  };

  const valueSetCodeSystems = valueSets
    .map((vs) => vs.system)
    .filter((item, index, array) => {
      return array.indexOf(item) === index;
    });

  const valueSetCreators = valueSets
    .map((vs) => vs.author)
    .filter((item, index, array) => {
      return array.indexOf(item) === index;
    });

  const handleOutsideClick = (ref: RefObject<HTMLFormElement>) => {
    useEffect(() => {
      function handleClickOutside(event: MouseEvent | KeyboardEvent) {
        if (
          (event as KeyboardEvent).key == "Escape" ||
          (ref.current && !ref.current.contains(event.target as Node))
        ) {
          return setShowFilters(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keyup", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keyup", handleClickOutside);
      };
    }, [ref]);
  };

  const dropdownRef = useRef<HTMLFormElement>(null);
  handleOutsideClick(dropdownRef);

  return (
    <form ref={dropdownRef} className={styles.filtersDropdown}>
      <div className={styles.filterOptions}>
        <div className={styles.filterOptions_grouping}>
          <label htmlFor="category">Category</label>
          <Select
            id="category"
            name="category"
            className={styles.filtersSelect}
            onChange={(e) =>
              setFilterSearch({
                ...filterSearch,
                category: e.target.value as DibbsConceptType,
              })
            }
            value={filterSearch.category}
            disabled={!!loading}
          >
            <option value=""></option>
            {Object.keys(valueSetCategories).map((category) => {
              return (
                <option key={category} value={category}>
                  {formatStringToSentenceCase(category)}
                </option>
              );
            })}
          </Select>
        </div>
        <div className={styles.filterOptions_grouping}>
          <label htmlFor="code-system">Code system</label>
          <Select
            id="code-system"
            className={styles.filtersSelect}
            name="code-system"
            onChange={(e) => {
              e.preventDefault();
              return setFilterSearch({
                ...filterSearch,
                codeSystem: e.target.value as DibbsConceptType,
              });
            }}
            value={filterSearch.codeSystem}
            disabled={!!loading}
          >
            {<option value=""></option>}
            {valueSetCodeSystems.map((codeSystem) => {
              return (
                <option key={codeSystem} value={codeSystem}>
                  {formatSystem(codeSystem)}
                </option>
              );
            })}
          </Select>
        </div>
        <div className={styles.filterOptions_grouping}>
          <label htmlFor="creator">Creator</label>
          <Select
            id="creator"
            name="creator"
            className={styles.filtersSelect}
            onChange={(e) =>
              setFilterSearch({
                ...filterSearch,
                creator: e.target.value as DibbsConceptType,
              })
            }
            value={filterSearch.creator}
            disabled={!!loading}
          >
            <option value=""></option>
            {valueSetCreators.map((creator) => {
              return <option key={creator}>{creator}</option>;
            })}
          </Select>
        </div>
      </div>
      <div className={styles.shortcuts}>
        <span className="text-italic">Shortcuts:</span>
        <button
          onClick={(e) => {
            e.preventDefault();
            filterShortcut("currentUser");
          }}
        >
          Created by me
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            filterShortcut("myTeam");
          }}
        >
          Created by my team
        </button>
      </div>
      {filterCount > 0 && (
        <Button
          onClick={() =>
            setFilterSearch({
              creator: "",
              category: "" as DibbsConceptType,
              codeSystem: "",
            })
          }
          className={styles.clearFiltersBtn}
          type="button"
        >
          Clear all filters
        </Button>
      )}
    </form>
  );
};

export default DropdownFilter;
