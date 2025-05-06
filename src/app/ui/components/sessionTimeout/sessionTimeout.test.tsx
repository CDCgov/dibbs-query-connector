import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import { act, render, screen, waitFor } from "@testing-library/react";
import { SessionContextValue } from "next-auth/react";
import * as nextAuthReact from "next-auth/react";
import SessionTimeout from "./sessionTimeout";
import { UserRole } from "@/app/models/entities/users";
import { Session } from "next-auth";
import { PAGES } from "@/app/shared/page-routes";
import { signOut } from "@/app/backend/session-management";

jest.mock("next-auth/react");
jest.mock("tabbable");
jest.mock("@/app/backend/session-management", () => ({
  signOut: jest.fn(),
}));

describe("SessionTimeout", () => {
  it("Does not display when user is unauthenticated", async () => {
    const session: SessionContextValue = {
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    };

    jest.spyOn(nextAuthReact, "useSession").mockReturnValueOnce(session);

    render(
      <RootProviderMock currentPage={"/"}>
        <SessionTimeout idleTimeMsec={1000} promptTimeMsec={500} />
      </RootProviderMock>,
    );

    // give opportunity for a potential modal to display
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).toHaveAttribute("class", "usa-modal-wrapper is-hidden");
  });

  it("Display when user is authenticated", async () => {
    const session: SessionContextValue = {
      data: { user: { role: UserRole.STANDARD } } as Session,
      status: "authenticated",
      update: jest.fn(),
    };

    jest.spyOn(nextAuthReact, "useSession").mockReturnValue(session);

    render(
      <RootProviderMock currentPage={"/"}>
        <SessionTimeout idleTimeMsec={1000} promptTimeMsec={500} />
      </RootProviderMock>,
    );

    const dialog = screen.getByRole("dialog", { hidden: true });
    await waitFor(() =>
      expect(dialog).toHaveAttribute("class", "usa-modal-wrapper is-visible"),
    );

    const signOutSpy = signOut as jest.Mock;

    await waitFor(() =>
      expect(signOutSpy).toHaveBeenCalledWith({ redirectTo: PAGES.LANDING }),
    );
    jest.clearAllMocks();
  });

  it("Resets idle timer if user decides to stay", async () => {
    const session: SessionContextValue = {
      data: { user: { role: UserRole.STANDARD } } as Session,
      status: "authenticated",
      update: jest.fn(),
    };

    jest.spyOn(nextAuthReact, "useSession").mockReturnValue(session);
    const signOutSpy = signOut as jest.Mock;

    const { user } = renderWithUser(
      <RootProviderMock currentPage={"/"}>
        <SessionTimeout idleTimeMsec={1000} promptTimeMsec={500} />
      </RootProviderMock>,
    );

    const dialog = screen.getByRole("dialog", { hidden: true });
    await waitFor(() =>
      expect(dialog).toHaveAttribute("class", "usa-modal-wrapper is-visible"),
    );
    const stayBtn = screen.getByRole("button", {
      name: /yes, stay signed in/i,
    });
    await user.click(stayBtn);
    expect(signOutSpy).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(dialog).toHaveAttribute("class", "usa-modal-wrapper is-hidden"),
    );
    jest.clearAllMocks();
  });

  it("sign out user on token expiration", async () => {
    const session: SessionContextValue = {
      data: { user: { role: UserRole.STANDARD }, expiresIn: 100 } as Session,
      status: "authenticated",
      update: jest.fn(),
    };

    jest.spyOn(nextAuthReact, "useSession").mockReturnValue(session);
    const signOutSpy = signOut as jest.Mock;

    render(
      <RootProviderMock currentPage={"/"}>
        <SessionTimeout idleTimeMsec={1000} promptTimeMsec={500} />
      </RootProviderMock>,
    );

    // give opportunity for a potential modal to display
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    const dialog = screen.getByRole("dialog", { hidden: true });
    await waitFor(() =>
      expect(dialog).toHaveAttribute("class", "usa-modal-wrapper is-hidden"),
    );

    await waitFor(() =>
      expect(signOutSpy).toHaveBeenCalledWith({ redirectTo: PAGES.LANDING }),
    );
    jest.clearAllMocks();
  });
});
