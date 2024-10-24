import { Icon } from "@trussworks/react-uswds";
import styles from "./customizeQuery.module.css";
import { GroupedValueSet } from "./customizeQueryUtils";
import Table from "../../designSystem/Table";

type CustomizeQueryAccordionBodyProps = {
  group: GroupedValueSet;
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
    <Table className={`${styles.customizeQueryGridContainer}`}>
      <thead className={` margin-top-10`}>
        <tr className={styles.customizeQueryGridHeader}>
          <th className={`${styles.accordionTableHeader}`}>Include</th>
          <th className={`${styles.accordionTableHeader}`}>Code</th>
          <th className={`${styles.accordionTableHeader}`}>Display</th>
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
            <tr className={`${styles.customizeQueryGridRow}`} key={item.code}>
              <td
                className={`${styles.customizeQueryCheckbox}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleInclude(groupIndex, item.vsIndex, conceptIndex);
                }}
              >
                {item.include && (
                  <Icon.Check
                    aria-label="Check icon indicating selection"
                    className="usa-icon"
                    style={{ backgroundColor: "white" }}
                    size={4}
                    color="#005EA2"
                  />
                )}
              </td>
              <td className={styles.noBorderNoBackgroundNoPadding}>
                {item.code}
              </td>
              <td className={styles.noBorderNoBackgroundNoPadding}>
                {item.display}
              </td>
            </tr>
          ))}
      </tbody>
    </Table>
  );
};

export default CustomizeQueryAccordionBody;
