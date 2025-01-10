import React from "react";
import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import { ConceptOption } from "@/app/utils/valueSetTranslation";
import { showToastConfirmation } from "@/app/query/designSystem/toast/Toast";
import Checkbox from "@/app/query/designSystem/checkbox/Checkbox";

type ConceptSelectionProps = {
  concepts: ConceptOption[];
  onConceptsChange: (updatedConcepst: ConceptOption[]) => void;
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
  const selectedCount = concepts.filter((concept) => concept.include).length;
  const totalCount = concepts.length;
  const isMinusState = selectedCount > 0 && selectedCount < totalCount;

  const toggleAll = (isChecked: boolean) => {
    const updatedConcepts = concepts.map((concept) => ({
      ...concept,
      include: isMinusState ? false : isChecked,
    }));
    onConceptsChange(updatedConcepts);
    showToastConfirmation({
      body: `${updatedConcepts.length} codes successfully ${
        isChecked ? "added" : "removed"
      }`,
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
        <tr className={styles.conceptSelectionRow}>
          <th>
            <Checkbox
              id="toggleAll"
              checked={selectedCount === totalCount}
              className={`bg-transparent ${
                isMinusState
                  ? styles.concept__checkbox__partial
                  : styles.concept__checkbox
              }`}
              onChange={(e) => toggleAll(e.target.checked)}
            />
          </th>
          <th>Code</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {concepts.map((concept, index) => (
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
            <td>{concept.code}</td>
            <td>{concept.display}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ConceptSelection;
