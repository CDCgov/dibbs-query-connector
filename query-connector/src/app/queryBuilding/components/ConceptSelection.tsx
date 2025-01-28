import React from "react";
import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { showToastConfirmation } from "@/app/query/designSystem/toast/Toast";
import Checkbox from "@/app/query/designSystem/checkbox/Checkbox";
import { ConceptDisplay } from "./SelectionViewAccordionBody";

type ConceptSelectionProps = {
  concepts: ConceptDisplay[];
  onConceptsChange: (updatedConcepts: ConceptDisplay[]) => void;
};

/**
 * Component to display and manage a list of concepts with selection capabilities.
 * @param root0 - The props for the ConceptSelection component.
 * @param root0.concepts - Array of concepts to display and manage.
 * Each concept includes a `code`, `display`, and `include` flag.
 * @param root0.onConceptsChange - Callback to handle updates when concepts are selected/deselected.
 * @returns A React component that renders a list of concepts with checkboxes for selection.
 */
const ConceptSelection: React.FC<ConceptSelectionProps> = ({
  concepts,
  onConceptsChange,
}) => {
  const selectedCount = concepts.filter(
    (concept) => concept.include && concept.render,
  ).length;
  const totalCount = concepts.length;
  const isMinusState = selectedCount > 0 && selectedCount < totalCount;

  const toggleAll = (targetChecked: boolean) => {
    const isChecked = isMinusState ? false : targetChecked; // fixes the toast showing "Added" when deselecting all in a minusState
    const updatedConcepts = concepts.map((concept) => {
      if (!concept.render) return concept;
      return {
        ...concept,
        include: isMinusState ? false : isChecked,
      };
    });
    onConceptsChange(updatedConcepts);
    showToastConfirmation({
      body: `${
        updatedConcepts.filter((c) => c.render).length
      } code(s) successfully ${isChecked ? "added" : "removed"}`,
      variant: "success",
      hideProgressBar: true,
    });
  };

  const toggleSingle = (index: number, isChecked: boolean) => {
    const updatedConcepts = concepts.map((concept, i) =>
      i === index ? { ...concept, include: isChecked } : concept,
    );
    onConceptsChange(updatedConcepts);
    showToastConfirmation({
      body: `${concepts[index].code} successfully ${
        isChecked ? "added" : "removed"
      }`,
      variant: "success",
      hideProgressBar: true,
    });
  };

  return (
    <table className={styles.conceptSelectionTable}>
      <thead>
        {concepts.filter((c) => c.render).length > 0 ? (
          <tr className={styles.conceptSelectionRow}>
            <th>
              <Checkbox
                id="toggleAll"
                checked={selectedCount === totalCount}
                isMinusState={isMinusState}
                onChange={(e) => toggleAll(e.target.checked)}
              />
            </th>
            <th>Code</th>
            <th>Name</th>
          </tr>
        ) : (
          <tr className="margin-top-3">
            <th>No matching codes found</th>
          </tr>
        )}
      </thead>
      <tbody>
        {concepts.map(
          (concept, index) =>
            concept.render && (
              <tr key={concept.code} className={styles.conceptSelectionRow}>
                <td>
                  <Checkbox
                    id={`checkbox-${concept.code}`}
                    checked={concept.include}
                    className={`bg-transparent ${
                      concept.include ? styles.concept__checkbox : ""
                    }`}
                    onChange={(e) => toggleSingle(index, e.target.checked)}
                  />
                </td>
                <td className={styles.conceptCode}>{concept.code}</td>
                <td>{concept.display}</td>
              </tr>
            ),
        )}
      </tbody>
    </table>
  );
};

export default ConceptSelection;
