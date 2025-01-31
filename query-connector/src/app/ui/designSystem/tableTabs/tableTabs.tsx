import React, { useState } from "react";
import styles from "./tableTabs.module.scss";

export type TableTabsProps = {
  labels: string[];
};

/**
 * @param root0 - params
 * @param root0.labels - an array of names to display for each tab
 * @returns A tableTabs component
 */
const TableTabs: React.FC<TableTabsProps> = ({ labels }) => {
  const [activeLabel, setActiveLabel] = useState<string>(labels[0]);

  const tabLabels = labels.map((label) => {
    return (
      <div
        key={label}
        className={`${styles.tabLabel}`}
        onClick={() => setActiveLabel(label)}
      >
        <div className={activeLabel == label ? styles.active : ""}>{label}</div>
      </div>
    );
  });

  return (
    <>
      <div className={`${styles.container}`}>{tabLabels}</div>
    </>
  );
};
export default TableTabs;
