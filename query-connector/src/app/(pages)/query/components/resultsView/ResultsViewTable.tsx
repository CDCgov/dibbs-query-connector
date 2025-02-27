import React from "react";
import Accordion from "../../../../ui/designSystem/Accordion";
import styles from "./resultsView.module.scss";
import ResultsViewAccordionBody from "./ResultsViewAccordionBody";
import { ResultsViewAccordionItem } from "../ResultsView";
import Skeleton from "react-loading-skeleton";
import Table from "@/app/ui/designSystem/table/Table";

type ResultsViewTable = {
  accordionItems: ResultsViewAccordionItem[];
  loading: boolean;
};

/**
 * Returns the ResultsViewTable component to render all components of the query response.
 * @param root0 - The props for the AccordionContainer component.
 * @param root0.accordionItems - an array of items to render as an accordion
 * group of type ResultsViewAccordionItem
 * @param root0.loading
 * @returns The ResultsViewTable component.
 */
const ResultsViewTable: React.FC<ResultsViewTable> = ({
  accordionItems,
  loading,
}) => {
  return (
    <div data-testid="accordion">
      {loading ? (
        <>
          <LoadingAccordion />
          <LoadingAccordion />
        </>
      ) : (
        accordionItems.map((item) => {
          const titleId = formatIdForAnchorTag(item.title);
          return (
            item.content && (
              <div className={styles.accordionInstance} key={item.title}>
                <Accordion
                  title={item.title}
                  content={
                    <ResultsViewAccordionBody
                      title={item.subtitle ?? ""}
                      content={item.content}
                      id={formatIdForAnchorTag(item.subtitle ?? "")}
                    />
                  }
                  expanded
                  id={titleId}
                  key={titleId}
                  headingLevel={"h3"}
                  accordionClassName={styles.accordionWrapper}
                  containerClassName={styles.accordionContainer}
                />
              </div>
            )
          );
        })
      )}
    </div>
  );
};

export default ResultsViewTable;

/**
 * Helper function to format titles (probably title cased with spaces) into
 * anchor tag format
 * @param title A string that we want to turn
 *  into anchor tag format
 * @returns - A hyphenated id that can be linked as an anchor tag
 */
export function formatIdForAnchorTag(title: string) {
  return title?.toLocaleLowerCase().replace(" ", "-");
}

const LoadingAccordion: React.FC = () => {
  return (
    <Accordion
      title={<Skeleton />}
      content={
        <ResultsViewAccordionBody
          title={<Skeleton />}
          content={
            <Table contained={false}>
              <thead className="usa-sr-only">
                <tr>
                  <th colSpan={2} scope="col">
                    <Skeleton />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from(Array(7).keys()).map((item) => (
                  <tr key={item}>
                    <td scope="row">
                      <strong>
                        <Skeleton />
                      </strong>
                    </td>
                    <td>
                      <Skeleton />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          }
          id={"skeleton-body"}
        />
      }
      expanded
      id={"skeleton-accordion"}
      containerClassName="margin-bottom-4"
    ></Accordion>
  );
};
