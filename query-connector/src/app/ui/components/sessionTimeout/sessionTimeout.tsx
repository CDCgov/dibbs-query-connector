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
const IDLE_TIMEOUT_MSEC = 60 * 60000;
// 5 mins to answer prompt / 5 mins before timeout
const PROMPT_TIMEOUT_MSEC = 5 * 60000;

/**
 * @returns SessionTimeout component which handles tracking idle time for a logged in user.
 */
const SessionTimeout: React.FC = () => {
  const { status } = useSession();

  const [remainingTime, setRemainingTime] = useState("");
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  const [started, setStarted] = useState(false);
  const modalRef = useRef<ModalRef>(null);
  const { activate, start, reset, pause, getRemainingTime } = useIdleTimer({
    timeout: IDLE_TIMEOUT_MSEC,
    promptBeforeIdle: PROMPT_TIMEOUT_MSEC,
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
    if (!started && status === "authenticated") {
      setStarted(true);
      start();
    }
  }, [status, started, setStarted, start]);

  return (
    <Modal
      id="session-timeout"
      modalRef={modalRef}
      heading={`Your session will end in ${remainingTime}`}
      forceAction
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
      You've been inactive for over 55 minutes. Do you wish to stay signed in?
    </Modal>
  );
};

export default SessionTimeout;
