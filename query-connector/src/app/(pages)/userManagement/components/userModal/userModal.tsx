"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
// import classNames from "classnames";
import { Label, TextInput } from "@trussworks/react-uswds";
import {
  addUserIfNotExists,
  updateUserDetails,
  // createUserGroup,
} from "@/app/backend/user-management";
import { addUsersToGroup } from "@/app/backend/usergroup-management";
import {
  User,
  UserGroup,
  UserGroupMembership,
  UserRole,
} from "@/app/models/entities/users";
import type { ModalRef } from "../../../../ui/designSystem/modal/Modal";
import type { ModalProps } from "../../../../ui/designSystem/modal/Modal";
import { UserManagementMode, ModalStates } from "../../utils";
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";
import { RoleDescriptons } from "../../utils";

const Modal = dynamic<ModalProps>(
  () =>
    import("../../../../ui/designSystem/modal/Modal").then((mod) => mod.Modal),
  { ssr: false },
);

/**
 * The props for the UserModal component.
 */
export interface UserModalProps {
  modalRef: React.RefObject<ModalRef>;
  mode: UserManagementMode;
  setMode: (arg: UserManagementMode) => void;
  refreshUsers: React.Dispatch<React.SetStateAction<boolean>>;
  userGroups?: UserGroup[] | null;
}

/**
 * Implementation of the Modal component for User Management; handles creation, editing, and deletion
 * of Users, UserGroups, and associated queries
 * @param root0 - UserModal props.
 * @param root0.modalRef - reference passed from parent to control showing/hiding the modal
 * @param root0.mode - Indicates which content the modal should render
 * @param root0.setMode - State function to control which content the modal should render
 * @param root0.refreshUsers - State function that indicates if the list of Users should be refreshed
 * @param root0.userGroups - reference passed from parent to control showing/hiding the modal
 * @returns - The UserModal component.
 */
const UserModal: React.FC<UserModalProps> = ({
  mode,
  setMode,
  modalRef,
  refreshUsers,
  userGroups,
}) => {
  const [newUser, setNewUser] = useState<User>({
    id: "",
    username: "",
    first_name: "",
    last_name: "",
    qc_role: UserRole.STANDARD,
    userGroupMemberships: [],
  });
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleButtonClick = async () => {
    setErrorMessage("");

    if (mode == "create-user") {
      const userToAdd = {
        id: newUser.id || "",
        email: "",
        username: newUser.username,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.qc_role,
      };

      if (userToAdd.id) {
        // if we have an ID but we're in create-user mode, we backnav'd here;
        // we should update rather than add as a new user
        const udpatedUser = await updateUserDetails(
          userToAdd.id,
          userToAdd.username,
          userToAdd.firstName,
          userToAdd.lastName,
          userToAdd.role,
        );
        if (udpatedUser?.msg) {
          return setErrorMessage(udpatedUser.msg);
        } else {
          setNewUser({ ...newUser, ...udpatedUser });
          return setMode("select-groups");
        }
      }

      // add new user to the db
      const newUserAdded = await addUserIfNotExists(userToAdd);
      if (newUserAdded.msg) {
        return setErrorMessage(newUserAdded.msg);
      } else {
        setNewUser({ ...newUser, ...newUserAdded });
        return setMode("select-groups");
      }
    }

    if (mode == "select-groups") {
      if (newUser.id && !errorMessage) {
        // update db on save
        newUser.userGroupMemberships?.forEach(async (group) => {
          console.log(group.group_name);
          await addUsersToGroup(group.usergroup_id, [newUser.id]);
        });

        refreshUsers(true);
        return handleCloseModal();
      } else {
        setErrorMessage("Error adding user to group.");
      }
    }

    // if (mode == "create-group") {
    //   const result = (await createUserGroup(newGroup.name)) as UserGroup;

    //   if (result) {
    //     console.log("success!", result);
    //   }
    // }
    // fetchUsers().then(() => {
    //   console.log("kcd", users);
    //   setMode("add-members");
    //   setNewGroup({ ...newGroup, ...{ id: result.id, name: result.name } });
    // });
    // const userList: QCResponse<User> = await getUsers();
    // console.log(userList);
    // // get(true).then((users) => {
    // //   fetchuser(servers);
    // // });
    // handleCloseModal();
    // setShouldUpdateData(true);
    // {
    // console.log("oh no!!", result.msg);
    // setErrorMessage(result.msg);
    // }
    // }
    // if (mode == "add-members" && newGroup.id) {
    //   console.log(newGroup);
    //   const result = await updateUserGroupMembers(
    //     newGroup.id,
    //     newGroup.name,
    //     userIdsToAdd,
    //   );
    //   if (result) {
    //     console.log("success!");
    //     setMode("add-queries");

    //     // const userList: QCResponse<User> = await getUsers();
    //     // console.log(userList);
    //     // // get(true).then((users) => {
    //     // //   fetchuser(servers);
    //     // // });
    //     // handleCloseModal();
    //     // setShouldUpdateData(true);
    //   } else {
    //   }
    // }
  };

  // updates local state on checkbox toggle
  const toggleUserGroupMembership = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const groupName = e.currentTarget.nextSibling?.textContent || "";
    const groupId = e.currentTarget.name;
    const checked = e.target.checked;

    if (checked) {
      const newGroup: UserGroupMembership = {
        id: "",
        group_name: groupName,
        usergroup_id: groupId,
        is_member: checked,
      };
      newUser?.userGroupMemberships?.push(newGroup);

      return setNewUser({
        ...newUser,
        ...{ userGroupMemberships: newUser.userGroupMemberships },
      });
    }

    const currentGroups = newUser.userGroupMemberships;
    const updatedGroups = currentGroups?.filter((g) => {
      return g.usergroup_id !== groupId;
    });

    return setNewUser({
      ...newUser,
      ...{ userGroupMemberships: updatedGroups },
    });
  };

  const handleCloseModal = () => {
    resetModalState();
    modalRef?.current?.toggleModal();
  };

  const resetModalState = () => {
    setNewUser({
      id: "",
      username: "",
      first_name: "",
      last_name: "",
      qc_role: UserRole.STANDARD,
      userGroupMemberships: [],
    });
    setErrorMessage("");
    setMode("closed");
  };

  const getModalButtons = () => {
    const buttons = [
      {
        text: ModalStates[mode].buttonText,
        type: "submit" as const,
        id: "modal-step-button",
        className: "usa-button",
        onClick: handleButtonClick,
      },
      {
        text: "Back",
        type: "button" as const,
        id: "modal-back-button",
        className: "usa-button usa-button--secondary",
        onClick: async () => setMode(ModalStates[mode].prevStep || "closed"),
      },
    ];

    if (mode == "create-user") {
      buttons.pop();
    }

    return buttons;
  };

  const renderAddUser = () => {
    return (
      <>
        <Label htmlFor="username">Email address</Label>
        <TextInput
          id="email"
          name="email"
          type="email"
          value={newUser.username}
          onChange={(e) =>
            setNewUser({ ...newUser, ...{ username: e.target.value } })
          }
          required
        />
        <Label htmlFor="auth-method">Permissions</Label>
        <select
          className="usa-select"
          id="user-role"
          name="user-role"
          value={newUser.qc_role}
          onChange={(e) =>
            setNewUser({
              ...newUser,
              ...{ qc_role: e.target.value as UserRole },
            })
          }
        >
          <option value="Standard">Standard</option>
          <option value="Admin">Admin</option>
          <option value="Super Admin">Super Admin</option>
        </select>
        <div className="role-descriptions">
          {Object.entries(RoleDescriptons).map(([role, description]) => (
            <div key={`${role}`} className="role-description">
              <span className="text-bold">{`${role}:`}</span> {description}
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderSelectUserGroups = () => {
    const userGroupIds = newUser.userGroupMemberships?.flatMap(
      (gr) => gr.usergroup_id,
    );

    return (
      <>
        <div>User groups</div>
        {userGroups &&
          userGroups.length > 0 &&
          userGroups.map((group) => {
            return (
              <div key={group.id}>
                <Checkbox
                  id={group.id}
                  label={`${group.name}`}
                  checked={userGroupIds?.includes(group.id)}
                  onChange={toggleUserGroupMembership}
                />
              </div>
            );
          })}
      </>
    );
  };

  const renderModalContent = (mode: UserManagementMode) => {
    switch (mode) {
      case "create-user":
        return renderAddUser();
      case "select-groups":
        return renderSelectUserGroups();
    }
  };

  return (
    <Modal
      id="user-mgmt"
      heading={ModalStates[mode].heading}
      modalRef={modalRef}
      buttons={getModalButtons()}
      errorMessage={errorMessage}
    >
      {renderModalContent(mode)}
    </Modal>
  );
};

export default UserModal;
