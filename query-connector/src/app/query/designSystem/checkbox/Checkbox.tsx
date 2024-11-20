import { Checkbox as TrussCheckbox } from "@trussworks/react-uswds";
import classNames from "classnames";
import styles from "./checkbox.module.css";

type CheckboxProps = {
  id: string;
  label: string;
  className?: string;
  onClick?: () => void;
};

/**
 *
 * @param root0 Checkbox styled according to our design system
 * @param root0.label The string labeled next to the checkbox
 * @param root0.id HTML id used to reference the checkbox
 * @param root0.className Optional styling classes
 * @param root0.onClick Event listener for checkbox click
 * @returns A checkbox styled according to our design system
 */
const Checkbox: React.FC<CheckboxProps> = ({
  label,
  id,
  className,
  onClick,
}) => {
  return (
    <TrussCheckbox
      label={label}
      id={id}
      name={id}
      className={classNames(styles.checkbox, className)}
      onClick={onClick}
    ></TrussCheckbox>
  );
};

export default Checkbox;
