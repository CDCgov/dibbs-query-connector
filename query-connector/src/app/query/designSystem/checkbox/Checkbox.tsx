import { Checkbox as TrussCheckbox } from "@trussworks/react-uswds";
import classNames from "classnames";
import styles from "./checkbox.module.scss";
import { ChangeEvent } from "react";

export type CheckboxProps = {
  id: string;
  label?: string | React.ReactElement;
  className?: string;
  onClick?: () => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  checked?: boolean;
  isMinusState?: boolean;
};

/**
 *
 * @param root0 Checkbox styled according to our design system
 * @param root0.label The string labeled next to the checkbox
 * @param root0.id HTML id used to reference the checkbox
 * @param root0.className Optional styling classes
 * @param root0.onClick Event listener for checkbox click
 * @param root0.checked Boolean indicating whether the checkbox is checked
 * @param root0.onChange - Event listener for checkbox change. Use this one
 * over onClick if the component is controlled (ie checked is passed in)
 * @param root0.isMinusState - whether to display the minus checkbox state
 * @returns A checkbox styled according to our design system
 */
const Checkbox: React.FC<CheckboxProps> = ({
  label,
  id,
  className,
  onClick,
  onChange,
  checked,
  isMinusState,
}) => {
  return (
    <TrussCheckbox
      label={label}
      id={id}
      name={id}
      className={classNames(
        className,
        styles.checkbox,
        isMinusState ? styles.isMinusCheckboxState : "",
      )}
      onClick={onClick}
      onChange={onChange}
      checked={checked}
    ></TrussCheckbox>
  );
};

export default Checkbox;
