"use client";
import classNames from "classnames";
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";
import Highlighter from "react-highlight-words";
import styles from "../codeLibrary.module.scss";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { Icon } from "@trussworks/react-uswds";

type ValueSetTableProps = {
  valueSets: DibbsValueSet[];
  activeValueSet: DibbsValueSet;
  setActiveValueSet: (vs: DibbsValueSet) => void;
  customCodeIds: { [vsId: string]: DibbsValueSet };
  handleValueSetToggle: (vsId: string, checked: boolean) => void;
  mode: string;
  textSearch: string;
  formatValueSetDetails: (vs: DibbsValueSet) => string;
};

/**
 * ValueSetTable component to display a list of value sets with checkboxes.
 * @param root0 - The props object.
 * @param root0.valueSets - Array of value sets to display.
 * @param root0.activeValueSet - The currently active value set.
 * @param root0.setActiveValueSet - Function to set the active value set.
 * @param root0.customCodeIds - Object mapping value set IDs to their custom code selections.
 * @param root0.handleValueSetToggle - Function to handle toggling a value set's selection.
 * @param root0.mode - The current mode of the table (e.g., "select").
 * @param root0.textSearch - The current text search string for highlighting.
 * @param root0.formatValueSetDetails - Function to format value set details for display.
 * @returns The rendered component.
 */
const ValueSetTable = ({
  valueSets,
  activeValueSet,
  setActiveValueSet,
  customCodeIds,
  handleValueSetToggle,
  mode,
  textSearch,
  formatValueSetDetails,
}: ValueSetTableProps) => (
  <>
    {valueSets.map((vs) => {
      const vsState = customCodeIds[vs.valueSetId];
      const concepts = vsState?.concepts || [];
      const checkedCount = concepts.filter((c) => c.include).length;
      const totalCount = concepts.length;
      const allChecked = checkedCount === totalCount && totalCount > 0;
      const minusState = checkedCount > 0 && checkedCount < totalCount;

      return (
        <tr
          key={vs.valueSetId}
          className={classNames(
            styles.valueSetTable__tableBody_row,
            vs?.valueSetId == activeValueSet?.valueSetId
              ? styles.activeValueSet
              : "",
          )}
          onClick={() => setActiveValueSet(vs)}
        >
          <td>
            {mode === "select" && (
              <Checkbox
                id={`valueset-checkbox-${vs.valueSetId}`}
                checked={allChecked}
                isMinusState={minusState}
                onChange={(e) => {
                  e.stopPropagation();
                  handleValueSetToggle(vs.valueSetId, e.target.checked);
                }}
                aria-label={`Select value set ${vs.valueSetName}`}
                className={styles.valueSetCheckbox}
              />
            )}
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
      );
    })}
  </>
);

export default ValueSetTable;
