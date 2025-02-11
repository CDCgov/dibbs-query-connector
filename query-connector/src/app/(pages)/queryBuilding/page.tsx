"use client";
import { SelectedQueryDetails } from "./querySelection/utils";
import QuerySelection from "./querySelection/QuerySelection";
import { BuildStep } from "../../shared/constants";
import { useState } from "react";
import { EMPTY_QUERY_SELECTION } from "./utils";
import BuildFromTemplates from "./buildFromTemplates/BuildFromTemplates";
import { ToastContainer } from "react-toastify";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  const [selectedQuery, setSelectedQuery] = useState<SelectedQueryDetails>(
    structuredClone(EMPTY_QUERY_SELECTION),
  );
  const [buildStep, setBuildStep] = useState<BuildStep>("selection");

  return (
    <>
      <ToastContainer
        position="bottom-left"
        icon={false}
        stacked
        hideProgressBar
      />
      {buildStep === "selection" && (
        <QuerySelection
          selectedQuery={selectedQuery}
          setBuildStep={setBuildStep}
          setSelectedQuery={setSelectedQuery}
        />
      )}
      {buildStep !== "selection" && (
        <BuildFromTemplates
          selectedQuery={selectedQuery}
          buildStep={buildStep}
          setSelectedQuery={setSelectedQuery}
          setBuildStep={setBuildStep}
        ></BuildFromTemplates>
      )}
    </>
  );
};

export default QueryBuilding;
