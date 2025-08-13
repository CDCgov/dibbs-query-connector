import { useState } from "react";
import { DataContext, DataContextValue } from "../../shared/DataProvider";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectedQueryDetails } from "@/app/(pages)/queryBuilding/querySelection/utils";
import { EMPTY_QUERY_SELECTION } from "@/app/(pages)/queryBuilding/utils";

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
  initialQuery?: SelectedQueryDetails;
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
  initialQuery,
}) => {
  const [selectedQuery, setSelectedQuery] = useState<SelectedQueryDetails>(
    initialQuery ?? EMPTY_QUERY_SELECTION,
  );

  const mockContextValue: DataContextValue = {
    data: data,
    setData: setData || jest.fn(),
    currentPage: currentPage,
    setCurrentPage: setCurrentPage || jest.fn(),
    toastConfig: toastConfig || {},
    setToastConfig: setToastConfig || jest.fn(),
    runtimeConfig: runtimeConfig || { AUTH_DISABLED: "true" },
    selectedQuery,
    setSelectedQuery,
  };

  return (
    <DataContext.Provider value={mockContextValue}>
      {children}
    </DataContext.Provider>
  );
};
