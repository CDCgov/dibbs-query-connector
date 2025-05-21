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
  const queryContext = useContext(DataContext);
  if (!queryContext || !queryContext.setSelectedQuery) {
    throw new Error("QueryBuilding must be used within a DataProvider");
  }

  const [buildStep, setBuildStep] = useState<BuildStep>("selection");
  const selectedQuery = queryContext.selectedQuery;

  // on initial render, if the user is coming from the code library, go to the valueset step
  useEffect(() => {
    if (selectedQuery?.queryId) {
      setBuildStep("valueset");
    }
  }, [selectedQuery]);

  useEffect(() => {
    queryContext.setCurrentPage(buildStep);
  }, [buildStep]);

  useEffect(() => {
    queryContext.setToastConfig({
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
