"use client";
import classNames from "classnames";
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";
import Highlighter from "react-highlight-words";
import styles from "../codeLibrary.module.scss";
import { DibbsValueSet } from "@/app/models/entities/valuesets";

type ConceptsTableProps = {
  activeValueSet: DibbsValueSet;
  mode: string;
  customCodeIds: { [vsId: string]: DibbsValueSet };
  handleConceptToggle: (vsId: string, code: string, checked: boolean) => void;
  textSearch: string;
};

/**
 * ConceptsTable component to display a list of concepts with checkboxes.
 * @param root0 - The props object.
 * @param root0.activeValueSet - The currently active value set.
 * @param root0.mode - The current mode of the table (e.g., "select").
 * @param root0.customCodeIds - Object mapping value set IDs to their custom code selections.
 * @param root0.handleConceptToggle - Function to handle toggling a concept's selection.
 * @param root0.textSearch - The current text search string for highlighting.
 * @returns The rendered component.
 */
const ConceptsTable = ({
  activeValueSet,
  mode,
  customCodeIds,
  handleConceptToggle,
  textSearch,
}: ConceptsTableProps) => {
  if (!activeValueSet) return null;
  if (activeValueSet.concepts.length === 0) {
    return (
      <tr className={styles.noCodesAvailable}>
        <th>There are no codes available.</th>
      </tr>
    );
  }
  return (
    <>
      {activeValueSet.concepts.map((concept) => {
        const checked = !!customCodeIds[
          activeValueSet.valueSetId
        ]?.concepts?.find((c) => c.code === concept.code && c.include);
        return (
          <tr
            key={concept.code}
            className={classNames(styles.conceptsTable__tableBody_row)}
          >
            <td className={styles.valueSetCode}>
              {mode === "select" && (
                <div className={styles.conceptRowInline}>
                  <Checkbox
                    id={`concept-checkbox-${activeValueSet.valueSetId}-${concept.code}`}
                    checked={checked}
                    onChange={(e) => {
                      handleConceptToggle(
                        activeValueSet.valueSetId,
                        concept.code,
                        e.target.checked,
                      );
                    }}
                    aria-label={`Select code ${concept.code}`}
                  />
                  <Highlighter
                    highlightClassName="searchHighlight"
                    searchWords={[textSearch]}
                    autoEscape={true}
                    textToHighlight={concept.code}
                  />
                </div>
              )}
              {mode !== "select" && (
                <Highlighter
                  highlightClassName="searchHighlight"
                  searchWords={[textSearch]}
                  autoEscape={true}
                  textToHighlight={concept.code}
                />
              )}
            </td>
            <td>
              <Highlighter
                highlightClassName="searchHighlight"
                searchWords={[textSearch]}
                autoEscape={true}
                textToHighlight={concept.display}
              />
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default ConceptsTable;
