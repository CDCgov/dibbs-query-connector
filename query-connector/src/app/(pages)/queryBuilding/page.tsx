"use client";
import { SelectedQueryDetails } from "./querySelection/utils";
import QuerySelection from "./querySelection/QuerySelection";
import { BuildStep } from "../../shared/constants";
import { useState } from "react";
import { EMPTY_QUERY_SELECTION } from "./utils";
import BuildFromTemplates from "./buildFromTemplates/BuildFromTemplates";
import { useContext, useEffect } from "react";
import { DataContext } from "@/app/shared/DataProvider";
import WithAuth from "@/app/ui/components/withAuth/WithAuth";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  const [selectedQuery, setSelectedQuery] = useState<SelectedQueryDetails>(
    structuredClone(EMPTY_QUERY_SELECTION),
  );
  const [buildStep, setBuildStep] = useState<BuildStep>("selection");
  const ctx = useContext(DataContext);

  // update the current page details when switching between build steps
  useEffect(() => {
    ctx?.setCurrentPage(buildStep);
  }, [buildStep]);

  useEffect(() => {
    ctx?.setToastConfig({
      position: "bottom-left",
      stacked: true,
      hideProgressBar: true,
    });
  }, []);

  return (
    <WithAuth>
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
    </WithAuth>
  );
};

export default QueryBuilding;
