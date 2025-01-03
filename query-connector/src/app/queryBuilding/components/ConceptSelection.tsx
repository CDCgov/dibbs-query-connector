import React from "react";
import { Checkbox } from "@trussworks/react-uswds";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
import { ConceptOption } from "@/app/utils/valueSetTranslation";
import { showToastConfirmation } from "@/app/query/designSystem/toast/Toast";

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
    <div>
      <div className="display-flex padding-top-1 padding-bottom-3">
        <Checkbox
          name="toggleAll"
          id="toggleAll"
          checked={selectedCount === totalCount}
          className={`bg-transparent ${
            isMinusState
              ? styles.concept__checkbox__partial
              : styles.concept__checkbox
          }`}
          onChange={(e) => toggleAll(e.target.checked)}
          label={
            <div
              className="display-flex align-items-center align-self-stretch"
              style={{ gap: "1rem" }}
            >
              <div className="width-15 font-sans-md text-bold flex-0">Code</div>
              <div className="font-sans-md text-bold">Name</div>
            </div>
          }
        />
      </div>
      {concepts.map((concept, index) => (
        <div key={concept.code} className="display-flex padding-bottom-3">
          <Checkbox
            name={`checkbox-${concept.code}`}
            id={`checkbox-${concept.code}`}
            checked={concept.include}
            className={`bg-transparent ${
              concept.include ? styles.concept__checkbox : ""
            }`}
            onChange={(e) => toggleSingle(index, e.target.checked)}
            label={
              <div
                className="display-flex align-items-center align-self-stretch"
                style={{ gap: "1rem" }}
              >
                <div
                  className="width-15"
                  style={{ wordWrap: "break-word" }}
                  title={concept.code}
                >
                  {concept.code}
                </div>
                <div className="flex-fill">{concept.display}</div>
              </div>
            }
          />
        </div>
      ))}
    </div>
  );
};

export default ConceptSelection;
