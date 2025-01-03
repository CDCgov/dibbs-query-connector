import styles from "./customizeQuery.module.scss";
import Table from "../../designSystem/table/Table";
import { VsGrouping } from "@/app/utils/valueSetTranslation";
import classNames from "classnames";
import Checkbox from "../../designSystem/checkbox/Checkbox";

type CustomizeQueryAccordionBodyProps = {
  group: VsGrouping;
  toggleInclude: (
    groupIndex: string,
    valueSetIndex: number,
    conceptIndex: number,
  ) => void;
  groupIndex: string;
};

type ValueSetIndexedConcept = {
  vsIndex: number;
  code: string;
  display: string;
  include: boolean;
};

/**
 * Styling component to render the body table for the customize query components
 * @param param0 - props for rendering
 * @param param0.group - Matched concept associated with the query that
 * contains valuesets to filter query on
 * @param param0.toggleInclude - Listener event to handle a concept inclusion/
 * exclusion check
 * @param param0.groupIndex - Index corresponding to group
 * @returns JSX Fragment for the accordion body
 */
const CustomizeQueryAccordionBody: React.FC<
  CustomizeQueryAccordionBodyProps
> = ({ group, toggleInclude, groupIndex }) => {
  return (
    <Table className={classNames(styles.customizeQueryGridContainer)}>
      <thead>
        <tr className={styles.customizeQueryGridHeader}>
          <th></th>
          <th>Code</th>
          <th>Display</th>
        </tr>
      </thead>
      <tbody className="display-flex flex-column">
        {group.items
          .reduce((acc, vs, vsIndex) => {
            vs.concepts.forEach((c) => {
              acc.push({ ...c, vsIndex: vsIndex });
            });
            return acc;
          }, [] as ValueSetIndexedConcept[])
          .map((item, conceptIndex) => (
            <tr
              onClick={() => {
                toggleInclude(groupIndex, item.vsIndex, conceptIndex);
              }}
              className={classNames(
                "tableRowWithHover_clickable",
                styles.customizeQueryGridRow,
              )}
              key={item.code}
              tabIndex={0}
            >
              <td className={styles.checkboxCell}>
                <Checkbox
                  id={item.code}
                  checked={item.include}
                  onChange={() => {
                    toggleInclude(groupIndex, item.vsIndex, conceptIndex);
                  }}
                />
              </td>
              <td>{item.code}</td>
              <td>{item.display}</td>
            </tr>
          ))}
      </tbody>
    </Table>
  );
};

export default CustomizeQueryAccordionBody;
