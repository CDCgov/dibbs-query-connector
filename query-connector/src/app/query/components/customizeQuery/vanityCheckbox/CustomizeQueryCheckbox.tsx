import classNames from "classnames";
import Checkbox, {
  CheckboxProps,
} from "../../../designSystem/checkbox/Checkbox";
import styles from "./checkbox.module.css";

type VanityCheckboxProps = CheckboxProps & {
  isHeader?: boolean;
};
const CustomizeQueryCheckbox: React.FC<VanityCheckboxProps> = ({
  id,
  label,
  checked,
  onChange,
  className,
  isHeader,
}) => {
  return (
    <Checkbox
      id={id}
      label={label}
      checked={checked}
      onChange={onChange}
      className={classNames(
        className,
        styles.vanity,
        isHeader ? styles.vanityHeader : "",
      )}
    />
  );
};

export default CustomizeQueryCheckbox;
