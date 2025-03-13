"use client";

import { signOut, useSession } from "next-auth/react";
import { useIdleTimer } from "react-idle-timer";
import { Modal, ModalRef } from "../../designSystem/modal/Modal";
import { useRef } from "react";

const IDLE_TIMEOUT = 60;

/**
 * @returns SessionTimeout component which handles tracking idle time for a logged in user.
 */
const SessionTimeout: React.FC = () => {
  const { status } = useSession();
  const modalRef = useRef<ModalRef>(null);
  const { start, reset, getRemainingTime } = useIdleTimer({
    timeout: IDLE_TIMEOUT * 120000,
    onIdle,
    stopOnIdle: true,
    startManually: true,
  });

  if (status == "authenticated") {
    start();
  }

  async function logout() {
    await signOut({ redirectTo: "/" });
  }

  function onIdle() {
    console.log("on idle");
    modalRef.current?.toggleModal();

    /* const id = setTimeout(()=>{
        modalRef.current?.toggleModal();
        logout().then();
      },10000);
*/
  }

  function handleStay() {
    console.log("on stay");
    // clearTimeout(countDown.current);
    modalRef.current?.toggleModal();
    reset();
  }

  console.log(getRemainingTime());

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
          onClick: logout,
        },
      ]}
    >
      You've been inactive for too long. Please choose to stay signed in or
      signout. Otherwise, you will be signed out automatically in 5 minutes.
    </Modal>
  );
};

export default SessionTimeout;
