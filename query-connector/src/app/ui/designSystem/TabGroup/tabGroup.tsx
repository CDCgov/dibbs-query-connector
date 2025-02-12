"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import classNames from "classnames";

export interface Tab {
  label: string;
  path: string;
}

export interface TabGroupProps {
  tabs: Tab[];
}

/**
 * @param root0 - TabGroup compoennt props
 * @param root0.tabs - an array of Tab object
 * @returns A tab group component
 */
const TabGroup: React.FC<TabGroupProps> = ({ tabs }) => {
  const currentPath = usePathname();

  /**
   * @param path - the current path loaded in the browser
   * @returns the groups of classes that apply to the tab to support the states of active and inactive
   */
  function getActiveClass(path: string): string {
    return currentPath == path
      ? "text-bold border-bottom-05 border-primary"
      : "";
  }

  /**
   * HTML
   */
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
            className={classNames(
              "display-inline-block",
              "text-gray-50 text-no-underline padding-bottom-1 margin-right-3 cursor-pointer",
              getActiveClass(tab.path),
            )}
            href={tab.path}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};
export default TabGroup;
