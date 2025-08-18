import {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { Button, Select } from "@trussworks/react-uswds";
import styles from "../codeLibrary.module.scss";
import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";
import {
  formatCodeSystemPrefix,
  formatStringToSentenceCase,
} from "@/app/utils/format-service";
import { emptyFilterSearch } from "../utils";
import { User } from "@/app/models/entities/users";
import {
  getAllGroupMembers,
  getAllUserGroups,
} from "@/app/backend/usergroup-management";
import { applyFocusTrap } from "@/app/ui/utils";

export type FilterCategories = {
  category: DibbsConceptType | undefined;
  codeSystem: string;
  creators: vsAuthorMap;
};

type DropdownFilterProps = {
  setFilterSearch: Dispatch<SetStateAction<FilterCategories>>;
  filterSearch: FilterCategories;
  valueSets: DibbsValueSet[];
  setShowFilters: Dispatch<SetStateAction<boolean>>;
  loading: boolean;
  filterCount: number;
  currentUser: User;
  setTriggerFocus: () => void;
  focusRef: RefObject<HTMLDivElement | null>;
};

export type vsAuthorMap = {
  [groupName: string]: string[];
};
/**
 * @param root0 props
 * @param root0.filterSearch the filter criteria
 * @param root0.setFilterSearch state function to update filter criteria
 * @param root0.setShowFilters state function to toggle showing/hiding the dropdown filters
 * @param root0.valueSets the value sets to apply the filter(s) to
 * @param root0.loading the loading state of the parent's value set data
 * @param root0.filterCount the number of filters currently applied to the result set
 * @param root0.currentUser the User object for the currently active user
 * @param root0.setTriggerFocus function to return focus to the element that triggered the opening of DropdownFilter
 * @param root0.focusRef ref for the DropdownFilter that is accessible to its parent
 * @returns  the DropdownFilter component
 */
const DropdownFilter: React.FC<DropdownFilterProps> = ({
  filterSearch,
  setFilterSearch,
  valueSets,
  setShowFilters,
  loading,
  filterCount,
  currentUser,
  setTriggerFocus,
  focusRef,
}) => {
  const valueSetCodeSystems = valueSets
    .map((vs) => vs.system)
    .filter((item, index, array) => {
      return !!item && array.indexOf(item) === index;
    });

  const [myTeamMembers, setMyTeamMembers] = useState<vsAuthorMap>();

  const [groupAuthors, setGroupAuthors] = useState<vsAuthorMap>({});
  const [valueSetCreators, setValueSetCreators] = useState<vsAuthorMap>({});
  const [focusElements, setFocusElements] = useState<NodeListOf<Element>>();

  useEffect(() => {
    async function mapUsersToGroups() {
      const groups = await getAllUserGroups();
      const authors: vsAuthorMap = {};
      groups.items.map((group) => {
        const members =
          group.members?.map((member) =>
            member.firstName && member.lastName
              ? `${member.firstName} ${member.lastName}`
              : `${member.username}`,
          ) || [];

        authors[group.name] = members;
        return authors;
      });

      setGroupAuthors(authors);
    }

    async function fetchTeammates() {
      const myTeam: {
        [groupName: string]: string[];
      } = {};

      const myGroups = currentUser.userGroupMemberships || [];

      await Promise.all(
        myGroups.map(async (group) => {
          const teammates = await getAllGroupMembers(group.usergroupId);
          const foo = teammates.items.map((user) =>
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : `${user.username}`,
          );

          myTeam[group.usergroupName] = foo;
          return;
        }),
      );

      setMyTeamMembers(myTeam);
    }

    fetchTeammates();
    mapUsersToGroups();
  }, []);

  useEffect(() => {
    if (groupAuthors) {
      const valueSetAuthors: vsAuthorMap = {};
      valueSets.map((vs) => {
        valueSetAuthors[vs.author] = [vs.author];
      });

      Object.entries(groupAuthors).forEach(([key, val]) => {
        valueSetAuthors[key] = val;
      });

      valueSetAuthors["My Team(s)"] =
        (myTeamMembers && Object.values(myTeamMembers).flat()) || [];
      setValueSetCreators(valueSetAuthors);
    }
  }, [groupAuthors]);

  const getFocusableElements = (focusRef: RefObject<HTMLElement>) => {
    const focusableElements =
      focusRef.current &&
      focusRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
    setFocusElements(focusableElements);
  };

  useEffect(() => {
    getFocusableElements(focusRef as RefObject<HTMLElement>);
  }, [filterCount]);

  const valueSetCategories: {
    [dibbsConceptType in DibbsConceptType]: dibbsConceptType;
  } = {
    labs: "labs",
    medications: "medications",
    conditions: "conditions",
  };

  const filterByShortcut = (userIndex: string) => {
    const results = valueSetCreators[userIndex] || [];

    setFilterSearch({
      ...filterSearch,
      creators:
        results.length > 0
          ? { [userIndex]: valueSetCreators[userIndex] }
          : {
              "No creators to filter": ["No creators to filter"],
            },
    });
  };

  const handleOutsideClick = (ref: RefObject<HTMLDivElement | null>) => {
    useEffect(() => {
      function handleClickOutside(event: MouseEvent | KeyboardEvent) {
        if (!ref) return;
        if (
          (event as KeyboardEvent).key == "Escape" ||
          (event.type == "mousedown" &&
            ref.current &&
            !ref.current.contains(event.target as Node))
        ) {
          setTriggerFocus();
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

  handleOutsideClick(focusRef);
  applyFocusTrap(focusRef, focusElements);

  return (
    <div ref={focusRef} className={styles.filtersDropdown}>
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
                  {formatCodeSystemPrefix(codeSystem || "")}
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
            onChange={(e) => {
              e.preventDefault();
              valueSetCreators &&
                setFilterSearch({
                  ...filterSearch,
                  creators: {
                    [e.target.value]: valueSetCreators[e.target.value],
                  },
                });
            }}
            value={Object.keys(filterSearch.creators)[0]}
            disabled={!!loading}
          >
            <option value=""></option>
            {valueSetCreators &&
              Object.keys(valueSetCreators).map((key) => {
                return (
                  <option key={key} value={key}>
                    {key}
                  </option>
                );
              })}
          </Select>
        </div>
      </div>
      <div className={styles.shortcuts}>
        <span className="text-italic">Shortcuts:</span>
        <button
          onClick={async (e) => {
            e.preventDefault();
            filterByShortcut(
              currentUser.firstName && currentUser.lastName
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : `${currentUser.username}`,
            );
          }}
        >
          Created by me
        </button>
        <button
          onClick={async (e) => {
            e.preventDefault();

            filterByShortcut("My Team(s)");
          }}
        >
          Created by my team
        </button>
      </div>
      <div className={styles.dropdownButtons}>
        {filterCount > 0 && (
          <Button
            onClick={() => {
              setFilterSearch(emptyFilterSearch);
              if (focusElements?.[0]) {
                (focusElements[0] as HTMLElement).focus();
              }
            }}
            className={styles.clearFiltersBtn}
            type="button"
          >
            Clear all filters
          </Button>
        )}
        <Button
          onClick={() => {
            setShowFilters(false);
            setTriggerFocus();
          }}
          className={styles.clearFiltersBtn}
          type="button"
        >
          Close
        </Button>
      </div>
    </div>
  );
};

export default DropdownFilter;
