"use client";
import React, { useState } from "react";
import Link from "next/link";
import classNames from "classnames";
import styles from "./tabGroup.module.scss";

export type Tab = {
  access?: string[];
  label: string;
  path?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  renderContent?: () => JSX.Element;
};

export interface TabGroupProps {
  tabs: Tab[];
}

/**
 * @param root0 - TabGroup compoennt props
 * @param root0.tabs - an array of Tab objects
 * @returns A tab group component
 */
const TabGroup: React.FC<TabGroupProps> = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].label);

  const handleTabClick = (e: React.MouseEvent<HTMLElement>) => {
    const clickedTab = e.currentTarget.innerHTML;
    setActiveTab(clickedTab); // local component state
    const active = tabs.find((tab) => tab.label == clickedTab);
    active && active?.onClick && active.onClick(e); // parent component state
  };

  return (
    <div
      className={classNames(
        "border-base",
        "border-bottom-1px",
        "margin-bottom-3",
      )}
    >
      {tabs.map((tab) => {
        return (
          <Link
            data-prevent-nprogress={true} // don't show loading bar when switching between tabs
            key={tab.label}
            className={tab.label == activeTab ? styles.tab__active : styles.tab}
            href={tab.path || ""}
            onClick={(e) => handleTabClick(e)}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};

export default TabGroup;
