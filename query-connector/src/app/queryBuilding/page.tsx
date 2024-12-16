"use client";
import { SelectedQueryDetails } from "./querySelection/utils";
import BuildFromTemplates from "./buildFromTemplates/BuildFromTemplates";
import QuerySelection from "./querySelection/QuerySelection";
import { BuildStep } from "../constants";
import "react-toastify/dist/ReactToastify.css";
import { useState } from "react";

export const EMPTY_QUERY_SELECTION = { queryId: "", queryName: "" };
/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  const [selectedQuery, setSelectedQuery] = useState<SelectedQueryDetails>(
    EMPTY_QUERY_SELECTION,
  );
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
