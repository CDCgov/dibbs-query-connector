import { ComboBox, Label } from "@trussworks/react-uswds";
import classNames from "classnames";
import React from "react";
import { RoleTypeValues } from "../types";

export interface RoleDropdownProps {
  defaultValue: RoleTypeValues;
}

/**
 * @param root0 - RoleDropdown component props
 * @param root0.defaultValue - initial values loaded as selected in the dropdown
 * @returns - A dropdown with the different role options
 */
const RoleDropdown: React.FC<RoleDropdownProps> = ({ defaultValue }) => {
  const roleOptions = [
    { label: "Super Admin", value: RoleTypeValues.SuperAdmin },
    { label: "Admin", value: RoleTypeValues.Admin },
    { label: "Standard", value: RoleTypeValues.Standard },
  ];

  return (
    <>
      <Label htmlFor={`role-combo-box`} className={classNames("usa-sr-only")}>
        Role
      </Label>
      <ComboBox
        id={`role-combo-box`}
        name="user-role-combo-box"
        options={roleOptions}
        onChange={() => {}}
        defaultValue={defaultValue.toString()}
      />
    </>
  );
};

export default RoleDropdown;
