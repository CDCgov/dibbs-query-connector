import { ComboBox, Label } from "@trussworks/react-uswds";
import classNames from "classnames";
import React from "react";
import { RoleTypeValues } from "../types";

export interface RoleDropdownProps {
  id: string;
  defaultValue: RoleTypeValues;
}

/**
 * @param root0 - RoleDropdown component props
 * @param root0.defaultValue - initial values loaded as selected in the dropdown
 * @param root0.id - id prop for the dropdown element
 * @returns - A dropdown with the different role options
 */
const RoleDropdown: React.FC<RoleDropdownProps> = ({ id, defaultValue }) => {
  const roleOptions = [
    { label: "Super Admin", value: RoleTypeValues.SuperAdmin },
    { label: "Admin", value: RoleTypeValues.Admin },
    { label: "Standard", value: RoleTypeValues.Standard },
  ];

  return (
    <>
      <Label htmlFor={id} className={classNames("usa-sr-only")}>
        User role
      </Label>
      <ComboBox
        id={id}
        name="user-role-combobox"
        options={roleOptions}
        onChange={() => {}}
        defaultValue={defaultValue.toString()}
      />
    </>
  );
};

export default RoleDropdown;
