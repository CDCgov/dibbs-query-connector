import React, { useState, type JSX } from "react";
import classnames from "classnames";
import styles from "../../(pages)/queryBuilding/buildFromTemplates/conditionTemplateSelection.module.scss";
import { HeadingLevel } from "@trussworks/react-uswds";

export type CustomAccordionContentProps = {
  title: React.ReactNode | string;
  content: React.ReactNode;
  expanded: boolean;
  id: string;
  handleToggle?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export type CustomAccordionProps = {
  bordered?: boolean;
  multiselectable?: boolean;
  items: CustomAccordionContentProps[];
  containerClassName?: string;
  level?: HeadingLevel;
} & JSX.IntrinsicElements["div"];

/**
 *
 * @param root0 - Component for loading screen.
 * @param root0.bordered - Boolean to track loading state.
 * @param root0.items - Boolean to track loading state.
 * @param root0.multiselectable - Boolean to track loading state.
 * @param root0.containerClassName - Boolean to track loading state.
 * @param root0.level - Boolean to track loading state.
 * @returns The LoadingView component.
 */
export const CustomAccordion = ({
  bordered,
  items,
  containerClassName,
  multiselectable = false,
  level,
}: CustomAccordionProps): JSX.Element => {
  const [openItems, setOpenState] = useState(
    items.filter((i) => !!i.expanded).map((i) => i.id),
  );

  const classes = classnames(
    "usa-accordion",
    {
      "usa-accordion--bordered": bordered,
    },
    containerClassName,
  );

  const headingClasses = classnames("usa-accordion__heading", level);
  const contentClasses = classnames(
    // "usa-accordion__content",
    "usa-prose",
    containerClassName,
  );

  const toggleItem = (itemId: CustomAccordionContentProps["id"]): void => {
    const newOpenItems = [...openItems];
    const itemIndex = openItems.indexOf(itemId);
    const isMultiselectable = multiselectable;

    if (itemIndex > -1) {
      newOpenItems.splice(itemIndex, 1);
    } else {
      if (isMultiselectable) {
        newOpenItems.push(itemId);
      } else {
        newOpenItems.splice(0, newOpenItems.length);
        newOpenItems.push(itemId);
      }
    }

    setOpenState(newOpenItems);
  };

  return (
    <div
      className={classes}
      data-testid="accordion"
      data-allow-multiple={multiselectable || undefined}
    >
      {items.map((item, i) => {
        const expanded = openItems.indexOf(item.id) > -1;

        return (
          <fieldset key={`accordion-item${i}`}>
            <legend className={headingClasses}>
              <button
                type="button"
                className={classnames("usa-accordion__button", styles.foo)}
                aria-expanded={expanded}
                aria-controls={item.id}
                data-testid={`accordionButton_${item.id}`}
                onClick={(e): void => {
                  if (item.handleToggle) item.handleToggle(e);
                  toggleItem(item.id);
                }}
              >
                {item.title}
              </button>
            </legend>
            <div
              id={item.id}
              data-testid={`accordionItem_${item.id}`}
              className={contentClasses}
              hidden={!expanded}
            >
              {item.content}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
};

export default CustomAccordion;
