"use client";

import { useContext } from "react";
import classNames from "classnames";
import { Checkbox } from "@trussworks/react-uswds";
import Drawer from "../../../../ui/designSystem/drawer/Drawer";
import { UserManagementContext } from "../UserManagementProvider";
import style from "./TeamQueryEditSection.module.scss";

/**
 *  @returns TeamQueryEditSection component which is the collapsible section that allows to edit members and queries of a team
 */
const TeamQueryEditSection: React.FC = () => {
  const {
    teamQueryEditSection,
    closeEditSection,
    handleSearch,
    handleMemberUpdate,
    handleQueryUpdate,
  } = useContext(UserManagementContext);

  /**
   * DOM content helpers
   */

  function createListOfItems(items: string[]): JSX.Element {
    const isMemberView = teamQueryEditSection.subjectType == "Members";

    const description = isMemberView
      ? `members of ${teamQueryEditSection.title}`
      : `queries of ${teamQueryEditSection.title}`;

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
              onChange={isMemberView ? handleMemberUpdate : handleQueryUpdate}
              className={classNames("margin-bottom-3", style.checkbox)}
            />
          </li>
        ))}
      </ul>
    );
  }

  function generateContent(): JSX.Element {
    return createListOfItems(teamQueryEditSection.subjectData as string[]);
  }

  /**
   * HTML
   */

  return (
    <Drawer
      title={teamQueryEditSection.title}
      subtitle={teamQueryEditSection.subtitle}
      placeholder={teamQueryEditSection.placeholder}
      toRender={generateContent()}
      isOpen={teamQueryEditSection.isOpen}
      onSave={() => {}}
      onSearch={() => handleSearch}
      onClose={closeEditSection}
    />
  );
};

export default TeamQueryEditSection;
