import { ComboBox, Label } from "@trussworks/react-uswds";
import classNames from "classnames";
import React from "react";

export interface RoleDropdownProps {
  defaultValue: string;
}

/**
 * @param root0 - RoleDropdown component props
 * @param root0.defaultValue - initial values loaded as selected in the dropdown
 * @returns - A dropdown with the different role options
 */
const RoleDropdown: React.FC<RoleDropdownProps> = ({ defaultValue }) => {
  const roleOptions = [
    { label: "Super Admin", value: "super-admin" },
    { label: "Admin", value: "admin" },
    { label: "Standard", value: "standard" },
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
        defaultValue={defaultValue}
      />
    </>
  );
};

export default RoleDropdown;
