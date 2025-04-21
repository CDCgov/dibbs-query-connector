"use client";
import React, { useState } from "react";
import classNames from "classnames";
import styles from "./tabGroup.module.scss";
import { User, UserGroup } from "@/app/models/entities/users";

export type Tab = {
  access?: string[];
  label: string;
  path?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  renderContent?: (users?: User[], userGroups?: UserGroup[]) => JSX.Element;
  // TODO: rework this so renderContent isn't tied to user management; see
  // https://linear.app/skylight-cdc/issue/QUE-217/rework-tabtabgroup-component-so-its-not-limited-to-user-management
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
          <button
            key={tab.label}
            className={classNames(
              "usa-button--unstyled",
              tab.label == activeTab ? styles.tab__active : styles.tab,
            )}
            onClick={(e) => handleTabClick(e)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TabGroup;
