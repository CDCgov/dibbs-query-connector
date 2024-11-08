"use client";

import { Icon } from "@trussworks/react-uswds";
import classNames from "classnames";
import React from "react";
import styles from "../queryBuilding.module.scss";

interface LoadingViewProps {
  loading: boolean;
}

/**
 *
 * @param root0 - Component for loading screen.
 * @param root0.loading - Boolean to track loading state.
 * @returns The LoadingView component.
 */
const WorkSpaceSetUpView: React.FC<LoadingViewProps> = ({ loading }) => {
  if (loading) {
    return (
      <>
        <div
          className={classNames(
            "bg-gray-5",
            "display-flex",
            "flex-align-center",
            "flex-justify-center",
            styles.emptyStateQueryContainer
          )}
        >
          <div className="display-flex flex-column flex-align-center">
            <Icon.HourglassEmpty
              aria-label="Icon of empty hourglass to indicate loading state"
              className={styles.emptyQueryIcon}
            ></Icon.HourglassEmpty>
            <h2 className={styles.emptyQueryTitle}>
              Setting up your workspace...
            </h2>
            <p>This is a one-time setup that may take several minutes.</p>
            <p> Please do not navigate away from page during setup.</p>
          </div>
        </div>
      </>
    );
  } else {
    return null;
  }
};

export default WorkSpaceSetUpView;
