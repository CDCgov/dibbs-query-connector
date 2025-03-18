import { render, screen } from "@testing-library/react";
import WithAuth from "./WithAuth";
import * as nextAuthReact from "next-auth/react";
import * as authUtils from "@/app/utils/auth";
import { UserRole } from "@/app/models/entities/users";
import * as nextNavigation from "next/navigation";
import * as Utils from "@/app/(pages)/userManagement/utils";
import { Session } from "next-auth";
import { SessionContextValue } from "next-auth/react";

jest.mock("next-auth/react");

jest.mock("@/app/utils/auth", () => ({
  isAuthDisabledClientCheck: jest.fn().mockReturnValue(false),
}));

jest.mock("@/app/(pages)/userManagement/utils", () => ({
  getContextRole: jest.fn().mockReturnValue("Standard"),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  usePathname: jest.fn(),
}));

describe("WithAuth component (page access guard)", () => {
  const DummyComponent = () => <>Special content</>;

  beforeAll(() => {
    jest
      .spyOn(nextNavigation, "usePathname")
      .mockReturnValue("/userManagement");
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("Renders content when auth is disabled", () => {
    jest
      .spyOn(authUtils, "isAuthDisabledClientCheck")
      .mockReturnValueOnce(true);

    render(
      <WithAuth>
        <DummyComponent />
      </WithAuth>,
    );

    expect(screen.getByText("Special content")).toBeInTheDocument();
  });

  it("Renders content if user is logged in and has role access", () => {
    const session: SessionContextValue = {
      data: { user: { role: UserRole.SUPER_ADMIN } } as Session,
      status: "authenticated",
      update: jest.fn(),
    };
    jest.spyOn(Utils, "getContextRole").mockReturnValueOnce("Super Admin");
    jest.spyOn(nextAuthReact, "useSession").mockReturnValueOnce(session);

    render(
      <WithAuth>
        <DummyComponent />
      </WithAuth>,
    );
    expect(document.body).toMatchSnapshot();

    expect(screen.getByText("Special content")).toBeInTheDocument();
  });

  it("Renders unauthorized if user is logged in and does not have role access", () => {
    const session: SessionContextValue = {
      data: { user: { role: UserRole.STANDARD } } as Session,
      status: "authenticated",
      update: jest.fn(),
    };

    jest.spyOn(nextAuthReact, "useSession").mockReturnValueOnce(session);

    render(
      <WithAuth>
        <DummyComponent />
      </WithAuth>,
    );
    expect(
      screen.getByText("You are not authorized to access this page."),
    ).toBeInTheDocument();
  });
  it("Redirects user to landing page if user is not logged in", () => {
    const session: SessionContextValue = {
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    };

    jest.spyOn(nextAuthReact, "useSession").mockReturnValueOnce(session);
    const redirectSpy = jest.spyOn(nextNavigation, "redirect");

    render(
      <WithAuth>
        <DummyComponent />
      </WithAuth>,
    );
    expect(redirectSpy).toHaveBeenCalledWith("/");
  });
  it("Renders empty content while the session is being retrieved", () => {
    const session: SessionContextValue = {
      data: null,
      status: "loading",
      update: jest.fn(),
    };

    jest.spyOn(nextAuthReact, "useSession").mockReturnValueOnce(session);
    render(
      <WithAuth>
        <DummyComponent />
      </WithAuth>,
    );
    expect(screen.queryByText("Special content")).not.toBeInTheDocument();
    expect(document.body).toMatchSnapshot();
  });
});
