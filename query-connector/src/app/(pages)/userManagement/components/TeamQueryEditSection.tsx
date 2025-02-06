"use client";

import { useContext } from "react";
import classNames from "classnames";
import { Checkbox } from "@trussworks/react-uswds";
import Drawer from "@/app/ui/designSystem/drawer/Drawer";
import { DataContext } from "./DataProvider";

/**
 *  @returns TeamQueryEditSection component which is the collapsible section that allows to edit members and queries of a team
 */
const TeamQueryEditSection: React.FC = () => {
  const {
    TeamQueryEditSection,
    CloseEditSection,
    HandleSearch,
    HandleMemberUpdate,
    HandleQueryUpdate,
  } = useContext(DataContext);

  /**
   * DOM content helpers
   */

  function CreateListOfItems(items: string[]): JSX.Element {
    const isMemberView = TeamQueryEditSection.subjectType == "Members";

    const description = isMemberView
      ? "members of {TeamQueryEditSection.title}"
      : "queries of {TeamQueryEditSection.title}";

    return (
      <ul
        aria-description={description}
        className={classNames("usa-list--unstyled", "margin-top-2")}
      >
        {items.map((item: string) => (
          <li key={item}>
            <Checkbox
              id={item}
              name={item}
              label={item}
              defaultChecked
              onChange={isMemberView ? HandleMemberUpdate : HandleQueryUpdate}
              className={classNames("margin-bottom-3")}
            />
          </li>
        ))}
      </ul>
    );
  }

  function GenerateContent(): JSX.Element {
    return CreateListOfItems(TeamQueryEditSection.subjectData as string[]);
  }

  /**
   * HTML
   */

  return (
    <Drawer
      title={TeamQueryEditSection.title}
      subtitle={TeamQueryEditSection.subtitle}
      placeholder={TeamQueryEditSection.placeholder}
      toRender={GenerateContent()}
      isOpen={TeamQueryEditSection.isOpen}
      onSave={() => {}}
      onSearch={HandleSearch}
      onClose={CloseEditSection}
    />
  );
};

export default TeamQueryEditSection;
