import classNames from "classnames";
import Checkbox, {
  CheckboxProps,
} from "../../../designSystem/checkbox/Checkbox";
import styles from "./checkbox.module.css";

const CustomizeQueryCheckbox: React.FC<CheckboxProps> = ({
  id,
  label,
  checked,
  onClick,
  className,
}) => {
  return (
    <Checkbox
      id={id}
      label={label}
      checked={checked}
      onClick={onClick}
      className={classNames(className, styles.vanity)}
    />
  );
};

export default CustomizeQueryCheckbox;
