"use client";
import { useContext, useState } from "react";
import dynamic from "next/dynamic";
// import classNames from "classnames";
import { Label, TextInput } from "@trussworks/react-uswds";
import {
  addUserIfNotExists,
  updateUserDetails,
} from "@/app/backend/user-management";
import {
  addMultipleUsersToGroup,
  createUserGroup,
  updateUserGroup,
} from "@/app/backend/usergroup-management";
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
import { UserManagementContext } from "../UserManagementProvider";

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
  modalMode: UserManagementMode;
  setModalMode: (arg: UserManagementMode) => void;
  refreshView: React.Dispatch<React.SetStateAction<boolean | string>>;
  userGroups?: UserGroup[] | null;
}

/**
 * Implementation of the Modal component for User Management; handles creation, editing, and deletion
 * of Users, UserGroups, and associated queries
 * @param root0 - UserModal props.
 * @param root0.modalRef - reference passed from parent to control showing/hiding the modal
 * @param root0.modalMode - Indicates which content the modal should render
 * @param root0.setModalMode - State function to control which content the modal should render
 * @param root0.refreshView - State function that indicates if the list of Users should be refreshed
 * @param root0.userGroups - reference passed from parent to control showing/hiding the modal
 * @returns - The UserModal component.
 */
const UserModal: React.FC<UserModalProps> = ({
  modalMode,
  setModalMode,
  modalRef,
  refreshView,
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
  const [newGroup, setNewGroup] = useState<UserGroup>({
    id: "",
    name: "",
    member_size: 0,
    query_size: 0,
  });
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { openEditSection } = useContext(UserManagementContext);

  const handleButtonClick = async () => {
    setErrorMessage("");

    if (modalMode == "create-user") {
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
          return setModalMode("select-groups");
        }
      }

      // add new user to the db
      const newUserAdded = await addUserIfNotExists(userToAdd);
      if (newUserAdded.msg) {
        return setErrorMessage(newUserAdded.msg);
      } else {
        setNewUser({ ...newUser, ...newUserAdded });
        return setModalMode("select-groups");
      }
    }

    if (modalMode == "select-groups") {
      if (newUser.id && !errorMessage) {
        // update db on save
        newUser.userGroupMemberships?.forEach(async (membership) => {
          await addMultipleUsersToGroup(membership.usergroup_id, [newUser.id]);
        });

        refreshView("Users");
        return handleCloseModal();
      } else {
        setErrorMessage("Error adding user to group.");
      }
    }

    if (modalMode == "create-group") {
      const groupToAdd = {
        id: newGroup.id || "",
        name: newGroup.name,
        memberSize: newGroup.member_size,
        querySize: newGroup.query_size,
      };

      if (groupToAdd.id) {
        const updatedGroup = await updateUserGroup(
          groupToAdd.id,
          groupToAdd.name,
        );
        if (updatedGroup) {
          setNewGroup({ ...newGroup, ...(updatedGroup as UserGroup) });
        } else {
          return setErrorMessage("Unable to add group.");
        }
      } else {
        const newGroupAdded = await createUserGroup(newGroup.name);
        if (!newGroupAdded) {
          return setErrorMessage("Unable to add group.");
        } else {
          setNewGroup({ ...newGroup, ...(newGroupAdded as UserGroup) });
        }
      }
      handleCloseModal();
      refreshView("User groups");
      openEditSection(
        newGroup.name,
        "Members",
        "Members",
        newGroup.id,
        newGroup.members as User[],
      );
      return setModalMode("closed");
    }
  };

  // updates local state on checkbox toggle
  const toggleUserGroupMembership = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const groupName = e.currentTarget.nextSibling?.textContent || "";
    const groupId = e.currentTarget.name;
    const checked = e.target.checked;

    if (checked) {
      const newGroupMembership: UserGroupMembership = {
        membership_id: "",
        usergroup_name: groupName,
        usergroup_id: groupId,
        is_member: checked,
      };
      newUser?.userGroupMemberships?.push(newGroupMembership);

      return setNewUser({
        ...newUser,
        ...{ userGroupMemberships: newUser.userGroupMemberships },
      });
    }

    const currentGroups = newUser.userGroupMemberships;
    const updatedGroupMemberships = currentGroups?.filter((g) => {
      return g.usergroup_id !== groupId;
    });

    return setNewUser({
      ...newUser,
      ...{ userGroupMemberships: updatedGroupMemberships },
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
    setModalMode("closed");
  };

  const getModalButtons = () => {
    const buttons = [
      {
        text: ModalStates[modalMode].buttonText,
        type: "submit" as const,
        id: "modal-step-button",
        className: "usa-button",
        onClick: handleButtonClick,
      },
      {
        text: ModalStates[modalMode].secondaryBtnText,
        type: "button" as const,
        id: "modal-back-button",
        className: "usa-button usa-button--secondary",
        onClick: async () =>
          setModalMode(ModalStates[modalMode].prevStep || "closed"),
      },
    ];

    if (modalMode == "create-user") {
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
      (membership) => membership.usergroup_id,
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

  const renderAddUserGroup = () => {
    return (
      <>
        <Label htmlFor="username">User group name</Label>
        <TextInput
          id="group-name"
          name="group-name"
          type="text"
          value={newGroup.name}
          onChange={(e) =>
            setNewGroup({ ...newGroup, ...{ name: e.target.value } })
          }
          required
        />
      </>
    );
  };

  const renderModalContent = (mode: UserManagementMode) => {
    switch (mode) {
      case "create-user":
        return renderAddUser();
      case "select-groups":
        return renderSelectUserGroups();
      case "create-group":
        return renderAddUserGroup();
    }
  };

  return (
    <Modal
      id="user-mgmt"
      heading={ModalStates[modalMode].heading}
      modalRef={modalRef}
      buttons={getModalButtons()}
      errorMessage={errorMessage}
    >
      {renderModalContent(modalMode)}
    </Modal>
  );
};

export default UserModal;
