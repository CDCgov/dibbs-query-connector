import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// setup function
export function renderWithUser(children: React.ReactElement) {
  return {
    user: userEvent.setup(),
    // Import `render` from the framework library of your choice.
    // See https://testing-library.com/docs/dom-testing-library/install#wrappers
    ...render(children),
  };
}
