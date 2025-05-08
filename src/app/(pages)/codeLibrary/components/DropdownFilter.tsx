import {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
  // useState,
} from "react";
import { Button, Select } from "@trussworks/react-uswds";
import styles from "../codeLibrary.module.scss";
import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";
import { formatStringToSentenceCase } from "@/app/shared/format-service";
import { emptyFilterSearch, formatSystem } from "../utils";
import { User } from "@/app/models/entities/users";
import {
  getAllGroupMembers,
  getAllUserGroups,
} from "@/app/backend/usergroup-management";

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
};
export type vsAuthorMap = {
  [name: string]: string[];
};
/**
 * @param root0 props
 * @param root0.filterSearch the filter criteria
 * @param root0.setFilterSearch state function to update filter criteria
 * @param root0.setShowFilters state function to toggle showing/hiding the dropdown filters
 * @param root0.valueSets the value sets to apply the filter(s) to
 * @param root0.loading the loading state of the parent's value set data
 * @param root0.filterCount the number of filters currently applied to the result set
 * @param root0.currentUser the number of filters currently applied to the result set
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
}) => {
  const valueSetCodeSystems = valueSets
    .map((vs) => vs.system)
    .filter((item, index, array) => {
      return array.indexOf(item) === index;
    });

  const [myTeam, setMyTeam] = useState<User[]>();

  const [groupAuthors, setGroupAuthors] = useState<vsAuthorMap>({});
  const [valueSetCreators, setValueSetCreators] = useState<vsAuthorMap>({});

  useEffect(() => {
    async function mapUsersToGroups() {
      const groups = await getAllUserGroups();
      const authors: vsAuthorMap = {};

      groups.items.map((group) => {
        const memberIds =
          group.members?.map((member) =>
            member.firstName && member.lastName
              ? `${member.firstName} ${member.lastName}`
              : `${member.username}`,
          ) || [];
        return (authors[group.name] = memberIds);
      });

      setGroupAuthors(authors);
    }
    async function fetchTeammates() {
      const myGroups = currentUser.userGroupMemberships || [];
      const team = await Promise.all(
        myGroups &&
          myGroups
            .map(async (group) => {
              const teammates = await getAllGroupMembers(group.usergroupId);

              return teammates.items;
            })
            .flat(),
      );
      const teamA = team.flat();
      setMyTeam(teamA);
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
      setValueSetCreators(valueSetAuthors);
    }
  }, [groupAuthors]);

  const valueSetCategories: {
    [dibbsConceptType in DibbsConceptType]: dibbsConceptType;
  } = {
    labs: "labs",
    medications: "medications",
    conditions: "conditions",
  };

  const filterShortcut = (users: User[]) => {
    const creators: vsAuthorMap = {};
    users.map((user) => {
      user.firstName && user.lastName
        ? (creators[`${user.firstName} ${user.lastName}`] = [
            `${user.firstName} ${user.lastName}`,
          ])
        : (creators[user.username] = [user.username]);
    });

    setFilterSearch({
      ...filterSearch,
      creators:
        Object.values(creators).length > 0
          ? creators
          : { "No creators to filter": ["No creators to filter"] },
    });
  };

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
            <option value="" disabled></option>
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
            {<option value="" disabled></option>}
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
            <option value="" disabled></option>
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
          onClick={(e) => {
            e.preventDefault();
            filterShortcut([currentUser]);
          }}
        >
          Created by me
        </button>
        <button
          onClick={async (e) => {
            e.preventDefault();
            myTeam && myTeam.length > 0 && filterShortcut(myTeam as User[]);
          }}
        >
          Created by my team
        </button>
      </div>
      {filterCount > 0 && (
        <Button
          onClick={() => setFilterSearch(emptyFilterSearch)}
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
