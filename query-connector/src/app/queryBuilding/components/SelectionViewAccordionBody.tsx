import styles from "../buildFromTemplates/buildfromTemplate.module.scss";
// import { Checkbox, Icon } from "@trussworks/react-uswds";

type SelectionViewAccordionBodyProps = {
  title: string;
  id?: string;
  content: React.ReactNode;
  valueSetType: string;
  conditionId: string;
  selected: number;
  total: number;
  handleCheckboxToggle: (valueSetType: string, conditionId: string) => void;
};

/**
 * Fragment component to style out some of the accordion bodies
 * @param param0 - params
 * @param param0.valueSetType - Title to display once the accordion is expanded
 * @param param0.conditionId - Markup id for the accordion
 * is expanded
 * @returns An accordion body component
 */
const SelectionViewAccordionBody: React.FC<SelectionViewAccordionBodyProps> = ({
  valueSetType,
  conditionId,
}) => {
  return (
    <>
      <div className={styles.accordionBodyWrapper} key={valueSetType}>
        <div className={styles.valueSetTemplate__toggleRowHeader}>
          Some content? {conditionId}
        </div>
      </div>
    </>
  );
};

export default SelectionViewAccordionBody;
