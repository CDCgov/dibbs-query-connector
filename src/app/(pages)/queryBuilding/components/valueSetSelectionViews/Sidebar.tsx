import { CUSTOM_VALUESET_ARRAY_ID } from "@/app/shared/constants";
import { Icon } from "@trussworks/react-uswds";
import classNames from "classnames";
import styles from "../../buildFromTemplates/conditionTemplateSelection.module.scss";
import { ConditionsMap, formatDiseaseDisplay, NestedQuery } from "../../utils";
import { Dispatch, SetStateAction } from "react";
import { MEDICAL_RECORD_SECTIONS_ID } from "../utils";

type SidebarProps = {
  constructedQuery: NestedQuery;
  setIsDrawerOpen: Dispatch<SetStateAction<boolean>>;
  conditionsMap: ConditionsMap;
  activeCondition: string;
  setActiveCondition: Dispatch<SetStateAction<string>>;
  isCustomConditionTab: boolean;
  handleConditionToggle: (conditionId: string) => void;
  handleUpdateCondition: (conditionId: string, remove: boolean) => void;
  isMedicalRecordsTab: boolean;
};

export const Sidebar: React.FC<SidebarProps> = ({
  constructedQuery,
  setIsDrawerOpen,
  conditionsMap,
  activeCondition,
  setActiveCondition,
  isCustomConditionTab,
  handleConditionToggle,
  handleUpdateCondition,
  isMedicalRecordsTab,
}) => {
  return (
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
              isCustomConditionTab
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
              isMedicalRecordsTab
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
  );
};
