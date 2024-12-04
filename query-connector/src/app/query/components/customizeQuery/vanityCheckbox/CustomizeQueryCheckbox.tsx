import classNames from "classnames";
import Checkbox, {
  CheckboxProps,
} from "../../../designSystem/checkbox/Checkbox";
import styles from "./checkbox.module.css";

type VanityCheckboxProps = CheckboxProps & {
  isHeader?: boolean;
  isMinusState?: boolean;
};
/**
 * Vanity component wrapper around the checkbox component for the query customization
 * checkboxes
 * @param root0 - params
 * @param root0.id - ID for checkbox
 * @param root0.checked - whether the checkbox is checked
 * @param root0.onChange - handler for when the checkbox is clicked
 * @param root0.isHeader - whether the checkbox is in the header
 * @param root0.isMinusState - whether to display the minus checkbox state
 * @returns A checkbox for the customize query page
 */
const CustomizeQueryCheckbox: React.FC<VanityCheckboxProps> = ({
  id,
  checked,
  onChange,
  isHeader,
  isMinusState,
}) => {
  return (
    <Checkbox
      id={id}
      checked={checked}
      onChange={onChange}
      className={classNames(
        styles.vanity,
        isHeader ? styles.vanityHeader : "",
        isMinusState ? styles.isMinusCheckboxState : "",
      )}
    />
  );
};

export default CustomizeQueryCheckbox;
