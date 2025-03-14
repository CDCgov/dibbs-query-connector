"use client";

import { signOut, useSession } from "next-auth/react";
import { useIdleTimer } from "react-idle-timer";
import type { ModalProps, ModalRef } from "../../designSystem/modal/Modal";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

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

  if (status == "unauthenticated") {
    return null;
  }

  const [started, setStarted] = useState(false);
  const modalRef = useRef<ModalRef>(null);
  const { activate, start, reset, pause, getRemainingTime } = useIdleTimer({
    timeout: IDLE_TIMEOUT_MSEC,
    promptBeforeIdle: PROMPT_TIMEOUT_MSEC,
    onPrompt: handlePrompt,
    onIdle: handleLogout,
    stopOnIdle: true,
    startManually: true,
  });

  function handlePrompt() {
    modalRef.current?.toggleModal();
  }

  async function handleLogout() {
    modalRef.current?.modalIsOpen && modalRef.current?.toggleModal();
    //stop timer and logout
    reset();
    pause();
    await signOut({ redirect: false }); // TODO tests this again
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
  }, [status, started, setStarted]);

  return (
    <Modal
      id="session-timeout"
      modalRef={modalRef}
      heading="Your session will end soon"
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
      You've been inactive for too long. Please choose to stay signed in or
      signout. Otherwise, you will be signed out automatically in 5 minutes.
    </Modal>
  );
};

export default SessionTimeout;
