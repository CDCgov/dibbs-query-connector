import {
  HeadingLevel,
  Accordion as TrussAccordion,
} from "@trussworks/react-uswds";

export type TrussAccordionProps = {
  title: React.ReactNode | string;
  content: React.ReactNode;
  expanded: boolean;
  id: string;
  className?: string;
  headingLevel: HeadingLevel;
  handleToggle?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export type MultiAccordionProps = {
  items: TrussAccordionProps[];
  containerClassName?: string;
  accordionClassName?: string;
  bordered?: boolean;
  multiselectable?: boolean;
};

const MultiAccordion: React.FC<MultiAccordionProps> = ({
  items,
  containerClassName,
  accordionClassName,
  multiselectable,
  bordered,
}) => {
  return (
    <div className={containerClassName}>
      <TrussAccordion
        items={items}
        className={accordionClassName}
        multiselectable={multiselectable}
        bordered={bordered}
      />
    </div>
  );
};

export default MultiAccordion;
