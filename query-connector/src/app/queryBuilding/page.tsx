"use client";
import { useState } from "react";
import { SelectedQueryState } from "./querySelection/utils";
import BuildFromTemplates from "./buildFromTemplates/BuildFromTemplates";
import QuerySelection from "./querySelection/QuerySelection";
import { BuildStep } from "../constants";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  const [selectedQuery, setSelectedQuery] = useState<SelectedQueryState>(null);
  const [buildStep, setBuildStep] = useState<BuildStep>("selection");

  return (
    <>
      {buildStep === "selection" && (
        <QuerySelection
          selectedQuery={selectedQuery}
          setBuildStep={setBuildStep}
          setSelectedQuery={setSelectedQuery}
        />
      )}
      {buildStep !== "selection" && (
        <BuildFromTemplates
          selectedQuery={selectedQuery ?? "create"}
          buildStep={buildStep}
          setSelectedQuery={setSelectedQuery}
          setBuildStep={setBuildStep}
        ></BuildFromTemplates>
      )}
    </>
  );
};

export default QueryBuilding;
