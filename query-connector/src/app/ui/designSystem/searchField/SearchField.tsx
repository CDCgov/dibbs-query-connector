import { TextInput } from "@trussworks/react-uswds";
import { ChangeEvent } from "react";
import styles from "./searchField.module.scss";
import classNames from "classnames";

type SearchFieldProps = {
  id: string;
  placeholder?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  value?: string;
};
/**
 * A search component bar styled according to our design system
 * @param root0 - params
 * @param root0.id - HTML id
 * @param root0.placeholder - String to label the search bar in the empty state.
 * Defaults to "Search"
 * @param root0.onChange - change event listener
 * @param root0.className - optional styling classes
 * @param root0.value - value of the search field if it's to be a controlled
 * component
 * @returns A search field component styled according to our design system
 */
const SearchField: React.FC<SearchFieldProps> = ({
  id,
  placeholder,
  onChange,
  className,
  value,
}) => {
  return (
    <TextInput
      placeholder={placeholder ?? "Search"}
      type="search"
      id={id}
      name={id}
      onChange={onChange}
      value={value}
      className={classNames(styles.searchField, className)}
    ></TextInput>
  );
};

export default SearchField;
