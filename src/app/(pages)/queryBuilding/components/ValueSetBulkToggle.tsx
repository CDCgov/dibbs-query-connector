import Highlighter from "react-highlight-words";
import { FilterableValueSet } from "./utils";
import { ChangeEvent, useRef } from "react";
import styles from "../buildFromTemplates/conditionTemplateSelection.module.scss";
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";

interface ValueSetBulkToggleProps {
  dibbsVs: FilterableValueSet;
  tableSearchFilter: string;
  areItemsFiltered: boolean;
  selectedCount: number;
  totalCount: number;
  handleBulkToggle: (
    e: ChangeEvent<HTMLInputElement>,
    isMinusState: boolean,
  ) => void;
  handleViewCodes: (vs: FilterableValueSet) => void;
}

/**
 * Valueset information to render, with checkbox / label that changes focus on
 * hover
 * @param param0 - params
 * @param param0.dibbsVs - the valueset represented by the component
 * @param param0.selectedCount - the number of selected concepts
 * @param param0.totalCount - the total number of concepts
 * @param param0.tableSearchFilter - the search filter
 * @param param0.areItemsFiltered - whether the items are filtered
 * @param param0.handleBulkToggle - toggle event to trigger when the label is clicked
 * @param param0.handleViewCodes - view codes drawer opener to trigger
 * @returns A checkbox and associated primary / secondary labels
 */
const ValueSetBulkToggle: React.FC<ValueSetBulkToggleProps> = ({
  dibbsVs,
  selectedCount,
  totalCount,
  tableSearchFilter,
  areItemsFiltered,
  handleBulkToggle,
  handleViewCodes,
}) => {
  const isMinusState = selectedCount !== totalCount && selectedCount !== 0;
  const checked = selectedCount == totalCount && selectedCount > 0;
  const focusElementRef = useRef<HTMLDivElement>(null);

  const setFocusOnCheckbox = () => {
    if (focusElementRef.current) {
      focusElementRef.current.focus();
    }
  };
  const removeFocusFromCheckbox = () => {
    if (focusElementRef.current) {
      focusElementRef.current.blur();
    }
  };

  const checkboxLabel = (
    dibbsVs: FilterableValueSet,
    searchFilter = "",
    isFilteredItem = false,
  ) => {
    const SUMMARIZE_CODE_RENDER_LIMIT = 5;
    const codesToRender = dibbsVs.concepts.filter((c) => c.render);
    return (
      <div
        onMouseEnter={setFocusOnCheckbox}
        onMouseLeave={removeFocusFromCheckbox}
        className={styles.expandedContent}
      >
        <div className={styles.vsName}>
          <Highlighter
            highlightClassName="searchHighlight"
            searchWords={[searchFilter]}
            autoEscape={true}
            textToHighlight={dibbsVs.valueSetName}
          />
        </div>
        {isFilteredItem && (
          <strong>
            Includes:{" "}
            {codesToRender.length < SUMMARIZE_CODE_RENDER_LIMIT ? (
              // render the individual code matches
              <span className="searchHighlight">
                {codesToRender.map((c) => c.code).join(", ")}
              </span>
            ) : (
              //  past this many matches, don't render the individual codes in favor of a
              // "this many matches" string
              <span className="searchHighlight">{`${codesToRender.length} codes`}</span>
            )}
          </strong>
        )}
      </div>
    );
  };

  const checkboxSubtitle = (
    dibbsVs: FilterableValueSet,
    handleViewCodes: (dibbsVs: FilterableValueSet) => void,
  ) => {
    return (
      <div
        className={`${styles.vsDetails}`}
        onClick={() => handleViewCodes(dibbsVs)}
      >
        <div className="padding-right-2">{`Author: ${dibbsVs.author}`}</div>
        <div>{`System: ${dibbsVs?.system?.toLocaleLowerCase()}`}</div>
      </div>
    );
  };

  const checkboxToRender = (
    <div className={`display-flex flex-column`}>
      <div
        className={styles.checkboxInfoContainer}
        ref={focusElementRef}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          className={styles.valueSetTemplate__checkbox}
          label={checkboxLabel(dibbsVs, tableSearchFilter, areItemsFiltered)}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            handleBulkToggle(e, isMinusState);
          }}
          id={dibbsVs.valueSetId}
          checked={checked}
          isMinusState={isMinusState}
          data-testid={`selectValueset-${dibbsVs.valueSetId}`}
        />
      </div>

      {checkboxSubtitle(dibbsVs, handleViewCodes)}
    </div>
  );

  return checkboxToRender;
};

export default ValueSetBulkToggle;
