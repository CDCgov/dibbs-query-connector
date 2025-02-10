import { Table as TrussTable } from "@trussworks/react-uswds";
import classNames from "classnames";
import styles from "./table.module.scss";

type TableProps = {
  children: React.ReactNode;
  contained?: boolean;
  className?: string;
  bordered?: boolean;
  striped?: boolean;
  fullWidth?: boolean;
  fixed?: boolean;
};

/**
 *
 * @param root0 - params
 * @param root0.children - the child table component to render
 * @param root0.contained - Table will displayed with outside border only
 * @param root0.bordered - whether to render a bordered table
 * @param root0.striped - whether to render a striped table
 * @param root0.className - additional custom class names
 * @param root0.fullWidth - whether to render with fullWidth mode
 * @param root0.fixed - whether to render with a fixed layout. All columns will be enforced to same width.
 * @returns - A UWSDS-styled table
 */
const Table: React.FC<TableProps> = ({
  children,
  contained = true,
  bordered,
  className,
  striped,
  fullWidth,
  fixed,
}) => {
  return (
    <div
      className={classNames(
        className,
        contained && styles.customizeTableWrapper,
      )}
    >
      <TrussTable
        bordered={bordered}
        className={classNames(
          styles.customizeTable,
          fixed && styles.customizeFixedTable,
        )}
        striped={striped}
        fullWidth={fullWidth}
      >
        {children}
      </TrussTable>
    </div>
  );
};

export default Table;
