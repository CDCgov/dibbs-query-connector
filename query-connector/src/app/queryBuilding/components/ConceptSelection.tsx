import React from "react";
import { Checkbox } from "@trussworks/react-uswds";
import styles from "../buildFromTemplates/buildfromTemplate.module.scss";

type ConceptSelectionProps = {
  concepts: { code: string; display: string; include: boolean }[];
  onConceptsChange: (
    updatedConcepst: { code: string; display: string; include: boolean }[],
  ) => void;
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
  const toggleAll = (isChecked: boolean) => {
    const updatedConcepts = concepts.map((concept) => ({
      ...concept,
      include: isChecked,
    }));
    onConceptsChange(updatedConcepts);
  };

  const toggleSingle = (index: number, isChecked: boolean) => {
    const updatedConcepts = concepts.map((concept, i) =>
      i === index ? { ...concept, include: isChecked } : concept,
    );
    onConceptsChange(updatedConcepts);
  };

  const selectedCount = concepts.filter((concept) => concept.include).length;
  const totalCount = concepts.length;

  return (
    <div>
      <div className="display-flex padding-top-1 padding-bottom-3">
        <Checkbox
          name="toggleAll"
          id="toggleAll"
          checked={selectedCount === totalCount}
          className={`bg-transparent ${
            selectedCount > 0 && selectedCount < totalCount
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
