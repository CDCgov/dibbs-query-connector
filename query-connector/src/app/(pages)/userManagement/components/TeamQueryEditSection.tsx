"use client";

import { useContext } from "react";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { DataContext } from "./DataProvider";

/**
 *  @returns TeamQueryEditSection component which is the collapsible section that allows to edit members and queries of a team
 */
const TeamQueryEditSection: React.FC = () => {
  const { TeamQueryEditSection, CloseEditSection } = useContext(DataContext);

  return (
    <Drawer
      title={TeamQueryEditSection.title}
      placeholder={"Loading data..."}
      toRender={TeamQueryEditSection.content}
      isOpen={TeamQueryEditSection.isOpen}
      onSave={() => {}}
      onClose={CloseEditSection}
    />
  );
};

export default TeamQueryEditSection;
