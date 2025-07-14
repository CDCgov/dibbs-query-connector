import {
  CUSTOM_CONDITION_ID,
  CUSTOM_VALUESET_ARRAY_ID,
} from "@/app/shared/constants";
import { Icon } from "@trussworks/react-uswds";
import classNames from "classnames";
import styles from "../../buildFromTemplates/conditionTemplateSelection.module.scss";
import {
  CategoryToConditionArrayMap,
  ConditionsMap,
  filterSearchByCategoryAndCondition,
  formatCategoryDisplay,
  formatCategoryToConditionsMap,
  formatDiseaseDisplay,
  NestedQuery,
} from "../../utils";
import { Dispatch, SetStateAction, useState } from "react";
import {
  CONDITION_DRAWER_SEARCH_PLACEHOLDER,
  MEDICAL_RECORD_SECTIONS_ID,
} from "../utils";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import Highlighter from "react-highlight-words";

type SidebarProps = {
  constructedQuery: NestedQuery;
  conditionsMap: ConditionsMap;
  activeCondition: string;
  setActiveCondition: Dispatch<SetStateAction<string>>;
  setValueSetSearchFilter: Dispatch<SetStateAction<string>>;
  handleUpdateCondition: (conditionId: string, remove: boolean) => void;
  categoryToConditionsMap: CategoryToConditionArrayMap;
};

export const Sidebar: React.FC<SidebarProps> = ({
  constructedQuery,
  conditionsMap,
  activeCondition,
  setActiveCondition,
  setValueSetSearchFilter,
  handleUpdateCondition,
  categoryToConditionsMap,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [conditionDrawerData, setConditionDrawerData] =
    useState<CategoryToConditionArrayMap>(
      formatCategoryToConditionsMap(categoryToConditionsMap),
    );
  const [conditionSearchFilter, setConditionSearchFilter] = useState("");

  function generateConditionDrawerDisplay(
    categoryToConditionsMap: CategoryToConditionArrayMap,
  ) {
    return Object.entries(categoryToConditionsMap).map(
      ([category, conditions]) => (
        <div id={category} key={category}>
          <div className={styles.conditionDrawerHeader}>
            <Highlighter
              highlightClassName="searchHighlight"
              searchWords={[conditionSearchFilter]}
              autoEscape={true}
              textToHighlight={formatCategoryDisplay(category)}
            ></Highlighter>
          </div>
          <div>
            {Object.values(conditions).map((condition) => (
              <div
                key={`update-${condition.id}`}
                id={`update-${condition.id}`}
                data-testid={`update-${condition.id}`}
                className={classNames(styles.conditionItem)}
                tabIndex={0}
              >
                <span>
                  <Highlighter
                    highlightClassName="searchHighlight"
                    searchWords={[conditionSearchFilter]}
                    autoEscape={true}
                    textToHighlight={formatDiseaseDisplay(condition.name)}
                  ></Highlighter>
                </span>

                {Object.keys(constructedQuery).includes(condition.id) ? (
                  <span
                    className={styles.addedStatus}
                    data-testid={`condition-drawer-added-${condition.id}`}
                  >
                    Added
                  </span>
                ) : (
                  <button
                    className={classNames(
                      styles.addButton,
                      "unstyled-button-container",
                    )}
                    data-testid={`condition-drawer-add-${condition.id}`}
                    onClick={() => {
                      handleUpdateCondition(condition.id, false);
                      setActiveCondition(condition.id);
                      showToastConfirmation({
                        body: `${condition.name} added to query`,
                      });
                    }}
                  >
                    ADD
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ),
    );
  }

  function handleConditionToggle(conditionId: string) {
    setActiveCondition(conditionId);
    setValueSetSearchFilter("");
  }

  function handleConditionSearch(searchFilter: string) {
    const filteredDisplay = filterSearchByCategoryAndCondition(
      searchFilter,
      formatCategoryToConditionsMap(categoryToConditionsMap),
    );
    setConditionSearchFilter(searchFilter);
    setConditionDrawerData(filteredDisplay);
  }

  return (
    <>
      <div className={styles.sideBarMenu}>
        <div className={styles.sideBarMenu__content}>
          <div className={styles.section_templates}>
            <div className={styles.sectionTitle}>
              <div>{"Templates".toLocaleUpperCase()}</div>
              <button
                className={classNames(
                  "unstyled-button-container",
                  styles.addCondition,
                )}
                data-testid={"add-condition-icon"}
                onClick={() => setIsDrawerOpen(true)}
              >
                <Icon.Add
                  aria-label="Plus sign icon indicating addition"
                  className="usa-icon"
                  size={3}
                />
                <span data-testid="add-left-rail">ADD</span>
              </button>
            </div>

            {Object.keys(constructedQuery)
              .filter((conditionId) => conditionId !== CUSTOM_VALUESET_ARRAY_ID)
              .map((conditionId) => {
                const condition = conditionsMap[conditionId];
                if (!condition) return null;
                return (
                  <div
                    key={conditionId}
                    data-testid={
                      activeCondition == conditionId
                        ? `${conditionId}-card-active`
                        : `${conditionId}-card`
                    }
                    className={classNames(
                      "align-items-center",
                      activeCondition == conditionId
                        ? `${styles.card} ${styles.active}`
                        : styles.card,
                    )}
                  >
                    <button
                      type={"button"}
                      className={"unstyled-button-container"}
                      key={`tab-${conditionId}`}
                      id={`tab-${conditionId}`}
                      data-testid={`tab-${conditionId}`}
                      onClick={() => handleConditionToggle(conditionId)}
                    >
                      {formatDiseaseDisplay(condition.name)}
                    </button>
                    <button
                      onClick={() => {
                        handleUpdateCondition(conditionId, true);
                        const next = Object.keys(constructedQuery).find(
                          (k) =>
                            k !== conditionId && k !== CUSTOM_VALUESET_ARRAY_ID,
                        );
                        handleConditionToggle(next ?? CUSTOM_VALUESET_ARRAY_ID);
                      }}
                      className={classNames(
                        "unstyled-button-container",
                        styles.deleteIconContainer,
                      )}
                      data-testid={`delete-condition-${conditionId}`}
                    >
                      <Icon.Delete
                        className={classNames(
                          "usa-icon",
                          styles.deleteIcon,
                          "destructive-primary",
                        )}
                        size={4}
                        aria-label="Trash icon indicating deletion of disease"
                      ></Icon.Delete>
                    </button>
                  </div>
                );
              })}
          </div>
          <div className={styles.section_custom}>
            <div className={classNames(styles.sectionTitle, "padding-top-2")}>
              {CUSTOM_VALUESET_ARRAY_ID.toLocaleUpperCase()}
            </div>
            <div
              className={classNames(
                "align-items-center",
                activeCondition === CUSTOM_CONDITION_ID
                  ? `${styles.card} ${styles.active}`
                  : styles.card,
              )}
            >
              <button
                id={`tab-custom`}
                className="unstyled-button-container"
                onClick={() => setActiveCondition(CUSTOM_VALUESET_ARRAY_ID)}
              >
                Additional codes from library
              </button>
            </div>
          </div>
          <div className={styles.section_custom}>
            <div
              className={classNames(
                "align-items-center",
                activeCondition === MEDICAL_RECORD_SECTIONS_ID
                  ? `${styles.card} ${styles.active}`
                  : styles.card,
              )}
            >
              <button
                id={`tab-medical-records`}
                onClick={() => setActiveCondition(MEDICAL_RECORD_SECTIONS_ID)}
                className="unstyled-button-container"
              >
                Medical record sections
              </button>
            </div>
          </div>
        </div>
      </div>
      <Drawer
        title="Add Condition(s)"
        placeholder={CONDITION_DRAWER_SEARCH_PLACEHOLDER}
        toRender={
          <>
            {Object.keys(conditionDrawerData).length > 0 ? (
              generateConditionDrawerDisplay(conditionDrawerData)
            ) : (
              <div>
                <div className="padding-top-4"> No conditions found</div>
              </div>
            )}{" "}
          </>
        }
        toastMessage="Condition has been successfully added."
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSave={() => {
          handleUpdateCondition;
        }}
        onSearch={handleConditionSearch}
      />
      ;
    </>
  );
};
