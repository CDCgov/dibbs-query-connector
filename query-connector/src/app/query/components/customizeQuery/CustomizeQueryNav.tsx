import { DibbsConceptType } from "@/app/constants";
import styles from "./customizeQuery.module.scss";
import CustomizeQueryBulkSelect from "./CustomizeQueryBulkSelect";
import { ConceptTypeToVsNameToVsGroupingMap } from "@/app/utils/valueSetTranslation";
import { Button } from "@trussworks/react-uswds";

type CustomizeQueryNavProps = {
  activeTab: DibbsConceptType;
  handleTabChange: (tabName: DibbsConceptType) => void;
  handleSelectAllForTab: (checked: boolean) => void;
  valueSetOptions: ConceptTypeToVsNameToVsGroupingMap;
};

/**
 * Nav component for customize query page
 * @param param0 - props for rendering
 * @param param0.handleTabChange - listener event for tab selection
 * @param param0.activeTab - currently active tab
 * @param param0.handleSelectAllForTab - Listener function to grab all the
 * returned labs when the select all button is hit
 * @param param0.valueSetOptions - the selected ValueSet items
 * @returns Nav component for the customize query page
 */
const CustomizeQueryNav: React.FC<CustomizeQueryNavProps> = ({
  handleTabChange,
  activeTab,
  handleSelectAllForTab,
  valueSetOptions,
}) => {
  const activeItems = valueSetOptions[activeTab] ?? {};

  const hasSelectableItems = Object.values(activeItems).some(
    (group) => group.items.length > 0,
  );
  const allItemsDeselected = Object.values(activeItems)
    .flatMap((groupedValSets) =>
      groupedValSets.items.flatMap((i) => i.includeValueSet),
    )
    .every((p) => !p);

  const allItemsSelected = Object.values(activeItems)
    .flatMap((groupedValSets) =>
      groupedValSets.items.flatMap((i) => i.includeValueSet),
    )
    .every((p) => p);

  return (
    <>
      <nav className={`${styles.customizeQueryNav}`}>
        <ul className="usa-sidenav">
          <li className={`usa-sidenav_item`}>
            <Button
              className={`usa-button--unstyled ${
                activeTab === "labs" ? `${styles.currentTab}` : ""
              }`}
              onClick={() => handleTabChange("labs")}
              disabled={valueSetOptions["labs"] === undefined}
              type="button"
            >
              Labs
            </Button>
          </li>
          <li className={`usa-sidenav_item`}>
            <Button
              className={`usa-button--unstyled ${
                activeTab === "medications" ? `${styles.currentTab}` : ""
              }`}
              onClick={() => handleTabChange("medications")}
              disabled={valueSetOptions["medications"] === undefined}
              type={"button"}
            >
              Medications
            </Button>
          </li>
          <li className={`usa-sidenav_item`}>
            <Button
              className={`usa-button--unstyled ${
                activeTab === "conditions" ? `${styles.currentTab}` : ""
              }`}
              onClick={() => handleTabChange("conditions")}
              disabled={valueSetOptions["conditions"] === undefined}
              type={"button"}
            >
              Conditions
            </Button>
          </li>
        </ul>
      </nav>

      <ul className="usa-nav__primary usa-accordion"></ul>
      <hr className="custom-hr"></hr>
      {hasSelectableItems ? (
        <CustomizeQueryBulkSelect
          allItemsDeselected={allItemsDeselected}
          allItemsSelected={allItemsSelected}
          handleBulkSelectForTab={handleSelectAllForTab}
          activeTab={activeTab}
        />
      ) : (
        <div className="font-sans-sm text-light padding-y-3">
          No {activeTab} available for this query.
        </div>
      )}
    </>
  );
};

export default CustomizeQueryNav;
