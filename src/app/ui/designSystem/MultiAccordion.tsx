import { HeadingLevel } from "@trussworks/react-uswds";
import CustomAccordion from "./CustomAccordion";
import classNames from "classnames";

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

/**
 * A wrapper around the Truss accordion that renders a multi-accordion that can be
 * configured to be multiselectable
 * @param param0 - props
 * @param param0.items - Accordion items
 * @param param0.containerClassName - classname around the accordion container
 * @param param0.accordionClassName - custom clasname around the accordion
 * @param param0.multiselectable - whether the accordion segments can be opened
 * at the same time
 * @param param0.bordered - whether the accordion can be bordered
 * @returns An accordion componet
 */
const MultiAccordion: React.FC<MultiAccordionProps> = ({
  items,
  containerClassName,
  accordionClassName,
  multiselectable,
  bordered,
}) => {
  return (
    <CustomAccordion
      items={items}
      containerClassName={classNames(accordionClassName, containerClassName)}
      multiselectable={multiselectable}
      bordered={bordered}
    />
  );
};

export default MultiAccordion;
