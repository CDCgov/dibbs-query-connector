"use client";

import QuerySelection from "./querySelection/QuerySelection";
import { BuildStep } from "../../shared/constants";
import { useState, useContext, useEffect } from "react";
import BuildFromTemplates from "./buildFromTemplates/BuildFromTemplates";
import { DataContext } from "@/app/shared/DataProvider";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  const ctx = useContext(DataContext);
  if (!ctx || !ctx.setSelectedQuery) {
    throw new Error("QueryBuilding must be used within a DataProvider");
  }

  const [buildStep, setBuildStep] = useState<BuildStep>("selection");

  useEffect(() => {
    ctx.setCurrentPage(buildStep);
  }, [buildStep]);

  useEffect(() => {
    ctx.setToastConfig({
      position: "bottom-left",
      stacked: true,
      hideProgressBar: true,
    });
  }, []);

  return (
    <WithAuth>
      {buildStep === "selection" && (
        <QuerySelection setBuildStep={setBuildStep} />
      )}
      {buildStep !== "selection" && (
        <BuildFromTemplates buildStep={buildStep} setBuildStep={setBuildStep} />
      )}
    </WithAuth>
  );
};

export default QueryBuilding;
