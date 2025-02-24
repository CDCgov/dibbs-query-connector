import { DataContext, DataContextValue } from "../../shared/DataProvider";
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

interface RootProviderMockProps extends React.PropsWithChildren {
  data?: unknown;
  setData?: jest.Mock;
  currentPage: string;
  setCurrentPage?: jest.Mock;
  toastConfig?: unknown;
  setToastConfig?: jest.Mock;
  runtimeConfig?: Record<string, string>;
}

export const RootProviderMock: React.FC<RootProviderMockProps> = ({
  children,
  data,
  setData,
  currentPage,
  setCurrentPage,
  toastConfig,
  setToastConfig,
  runtimeConfig,
}) => {
  const mockContextValue: DataContextValue = {
    data: data,
    setData: setData || jest.fn(),
    currentPage: currentPage,
    setCurrentPage: setCurrentPage || jest.fn(),
    toastConfig: toastConfig || {},
    setToastConfig: setToastConfig || jest.fn(),
    runtimeConfig: runtimeConfig || { AUTH_DISABLED: "true" },
  };

  return (
    <DataContext.Provider value={mockContextValue}>
      {children}
    </DataContext.Provider>
  );
};
