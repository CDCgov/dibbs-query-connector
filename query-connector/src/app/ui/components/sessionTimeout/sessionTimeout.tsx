"use client";

import { signOut, useSession } from "next-auth/react";
import { useIdleTimer } from "react-idle-timer";
import type { ModalProps, ModalRef } from "../../designSystem/modal/Modal";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PAGES } from "@/app/shared/page-routes";

const Modal = dynamic<ModalProps>(
  () => import("../../designSystem/modal/Modal").then((mod) => mod.Modal),
  { ssr: false },
);

// 60 mins inactivity
export const IDLE_TIMEOUT_MSEC = 60 * 60000;
// 5 mins to answer prompt / 5 mins before timeout
export const PROMPT_TIMEOUT_MSEC = 5 * 60000;

export interface SessionTimeoutProps {
  idleTimeMsec: number;
  promptTimeMsec: number;
}

/**
 * @param root0 Props of SessionTimeout component
 * @param root0.idleTimeMsec amout of time that the user needs to be idle in order to trigger automatic signout
 * @param root0.promptTimeMsec amount of time that the prompt will be displayed to a user. This time uses as reference the idle timeout
 * for example if it is set to 5 mins then the prompt will become visible 5 mins before the idle time has been reached.
 * @returns SessionTimeout component which handles tracking idle time for a logged in user.
 */
const SessionTimeout: React.FC<SessionTimeoutProps> = ({
  idleTimeMsec,
  promptTimeMsec,
}) => {
  const { status, data } = useSession();
  const [remainingTime, setRemainingTime] = useState("");
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  const expTimerId = useRef<NodeJS.Timeout | null>(null);
  const [started, setStarted] = useState(false);
  const modalRef = useRef<ModalRef>(null);
  const expiresBeforeIdle: boolean = !!(
    data?.expiresIn && data?.expiresIn < idleTimeMsec
  );

  // this does not work because the idle timer resets on non idle and the expiration period should be enforced!
  // set timer for expiration and ensure timer stops when login out!

  const { activate, start, reset, pause, getRemainingTime } = useIdleTimer({
    timeout: idleTimeMsec,
    promptBeforeIdle: promptTimeMsec,
    onPrompt: handlePrompt,
    onIdle: handleLogout,
    stopOnIdle: true,
    startManually: true,
    disabled: status !== "authenticated",
  });

  function handlePrompt() {
    intervalId.current = setInterval(() => {
      const msecs = getRemainingTime();
      const mins = Math.floor(msecs / 60000);
      const secs = Math.floor((msecs / 1000) % 60);

      setRemainingTime(
        `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
      );
    }, 500);

    modalRef.current?.toggleModal();
  }

  async function handleLogout() {
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
    }

    modalRef.current?.modalIsOpen && modalRef.current?.toggleModal();
    //stop timer and logout
    reset();
    pause();
    await signOut({ redirectTo: PAGES.LANDING });
  }

  function handleStay() {
    modalRef.current?.modalIsOpen && modalRef.current?.toggleModal();
    activate();
  }

  // Inititalize timer
  useEffect(() => {
    // trigger expired token timer
    if (expiresBeforeIdle && expTimerId.current == null) {
      expTimerId.current = setTimeout(async () => {
        await handleLogout();
      }, data?.expiresIn);
    }

    if (!started && status === "authenticated") {
      setStarted(true);
      start();
    }
  }, [status, started, setStarted, start, expTimerId, expiresBeforeIdle, data]);

  return (
    <Modal
      id="session-timeout"
      modalRef={modalRef}
      heading={`Your session will end in ${remainingTime}`}
      forceAction
      className={"width-auto padding-x-3"}
      buttons={[
        {
          text: "Yes, stay signed in",
          type: "button" as const,
          id: "session-timeout-stayin",
          className: "usa-button",
          onClick: handleStay,
        },
        {
          text: "Sign out",
          type: "button" as const,
          id: "session-timeout-signout",
          className: "usa-button usa-button--outline",
          onClick: handleLogout,
        },
      ]}
    >
      <p>
        You've been inactive for over 55 minutes.
        <br />
        Do you wish to stay signed in?
      </p>
    </Modal>
  );
};

export default SessionTimeout;
