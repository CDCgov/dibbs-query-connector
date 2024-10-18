"use client";

import React from "react";

interface LoadingViewProps {
  loading: boolean;
}

/**
 *
 * @param root0 - Component for loading screen.
 * @param root0.loading - Boolean to track loading state.
 * @returns The LoadingView component.
 */
const LoadingView: React.FC<LoadingViewProps> = ({ loading }) => {
  if (loading) {
    return (
      <div className="overlay">
        <div className="spinner"></div>
        <div className="margin-left-3-important page-title">Loading...</div>
      </div>
    );
  } else {
    return null;
  }
};

export default LoadingView;
