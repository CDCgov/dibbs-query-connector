"use client";
import { useContext, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Label, TextInput } from "@trussworks/react-uswds";
import {
  addUserIfNotExists,
  updateUserDetails,
} from "@/app/backend/user-management";
import {
  createUserGroup,
  updateUserGroup,
  addUsersToGroup,
  deleteUserGroup,
} from "@/app/backend/usergroup-management";
import {
  User,
  UserGroup,
  UserGroupMembership,
  UserRole,
} from "@/app/models/entities/users";
import type { ModalRef } from "../../../../ui/designSystem/modal/Modal";
import type { ModalProps } from "../../../../ui/designSystem/modal/Modal";
import { UserManagementMode, ModalStates, getRole } from "../../utils";
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";
import { RoleDescriptons } from "../../utils";
import { UserManagementContext } from "../UserManagementProvider";
import { viewMode } from "../userManagementContainer/userManagementContainer";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

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
  refreshView: React.Dispatch<React.SetStateAction<boolean | viewMode>>;
  userGroups?: UserGroup[] | null;
  subjectData?: UserGroup | User;
}

/**
 * Implementation of the Modal component for User Management; handles creation, editing, and deletion
 * of Users, UserGroups, and associated queries
 * @param root0 - UserModal props.
 * @param root0.modalRef - reference passed from parent to control showing/hiding the modal
 * @param root0.modalMode - Indicates which content the modal should render
 * @param root0.setModalMode - State function to control which content the modal should render
 * @param root0.refreshView - State function that indicates if the list of Users should be refreshed
 * @param root0.userGroups - List of UserGroups, to display when adding a new User
 * @param root0.subjectData - List of UserGroups, to display when adding a new User
 * @returns - The UserModal component.
 */
const UserModal: React.FC<UserModalProps> = ({
  modalMode,
  setModalMode,
  modalRef,
  refreshView,
  userGroups,
  subjectData,
}) => {
  const emptyUser = {
    id: "",
    username: "",
    first_name: "",
    last_name: "",
    qc_role: UserRole.STANDARD,
    userGroupMemberships: [],
  };
  const emptyGroup = {
    id: "",
    name: "",
    member_size: 0,
    query_size: 0,
    queries: [],
    members: [],
  };

  const [newUser, setNewUser] = useState<User>(emptyUser);
  const [newGroup, setNewGroup] = useState<UserGroup>(emptyGroup);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { openEditSection } = useContext(UserManagementContext);

  const existingGroup = subjectData as UserGroup;
  const existingUser = subjectData as User;
  const role = getRole();

  useEffect(() => {
    if (modalMode === "closed") {
      handleCloseModal();
    }

    // allows us to fully delete the input value without
    // resetting it to the existing name value, and prevents
    // UI flicker on update
    if (!!existingGroup && newGroup.name != "") {
      existingGroup.name = newGroup.name;
    }
  }, [modalMode]);

  async function openQueriesList() {
    return openEditSection(
      newGroup.name,
      "Queries",
      "Queries",
      newGroup.id,
      newGroup.queries,
    );
  }

  async function openMembersList() {
    return openEditSection(
      newGroup.name,
      "Members",
      "Members",
      newGroup.id,
      newGroup.members as User[],
    );
  }

  useEffect(() => {
    if (newGroup.id !== "" && modalMode !== "edit-group") {
      role == UserRole.SUPER_ADMIN ? openMembersList() : openQueriesList();
      refreshView("Update User groups");
      setNewGroup(emptyGroup);
    }
  }, [newGroup]);

  const handleButtonClick = async () => {
    if (!!errorMessage) {
      return;
    }

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
        refreshView("Update Users");
        return emptyGroups
          ? setModalMode("closed")
          : setModalMode("select-groups");
      }
    }

    if (modalMode == "select-groups") {
      if (newUser.id && !errorMessage) {
        // update db on save
        newUser.userGroupMemberships?.forEach(async (membership) => {
          await addUsersToGroup(membership.usergroup_id, [newUser.id]);
        });

        refreshView("Update Users");
        setNewUser(emptyUser);
        setModalMode("closed");
      } else {
        setErrorMessage("Error adding user to group.");
        setModalMode("closed");
      }
    }

    if (modalMode == "create-group" || modalMode == "edit-group") {
      const groupToAdd = {
        id: existingGroup?.id || newGroup.id,
        name: newGroup.name,
        member_size: existingGroup?.member_size || newGroup.member_size || 0,
        query_size: existingGroup?.query_size || newGroup.query_size || 0,
      };

      if (newGroup.name == "" && existingGroup?.name != "") {
        // we haven't changed anything, but we still want to trigger
        // the drawer open with newGroup update
        setNewGroup({ ...newGroup, ...existingGroup });
        return setModalMode("closed");
      }

      if (newGroup.name == "" && existingGroup?.name == "" && !errorMessage) {
        return setErrorMessage("Please provide a name for the group.");
      }

      // edit exsiting group
      if (groupToAdd.id) {
        if (!!errorMessage) {
          return;
        }

        const updatedGroup = await updateUserGroup(
          groupToAdd.id,
          groupToAdd.name,
        );

        if (updatedGroup) {
          setNewGroup({ ...newGroup, ...(updatedGroup as UserGroup) });
          refreshView("Update User groups");
          setModalMode("closed");
        } else {
          setModalMode("closed");
          return setErrorMessage("Unable to add group.");
        }
      } else {
        // create new group
        if (!!errorMessage) {
          return;
        }

        const newGroupAdded = await createUserGroup(newGroup.name);

        if (!newGroupAdded) {
          setModalMode("closed");
          return setErrorMessage("Unable to add group.");
        } else {
          setNewGroup({ ...newGroup, ...newGroupAdded.items[0] });
          refreshView("Update User groups");
          setModalMode("closed");
        }
      }
    }

    if (modalMode == "remove-group") {
      try {
        const result = await deleteUserGroup(existingGroup.id);

        refreshView("Update User groups");
        showToastConfirmation({
          body: `Removed group '${(result as UserGroup).name}'`,
        });
        setModalMode("closed");
      } catch {
        showToastConfirmation({
          body: `Unable to remove group. Please try again, or contact us if the issue persists.`,
          variant: "error",
        });
      }
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
  const emptyGroups = !userGroups || (userGroups && userGroups.length == 0);

  const getModalButtons = () => {
    const buttons = [
      {
        text:
          modalMode == "create-user" && emptyGroups
            ? "Add user" // if there are no groups, don't move to second step
            : ModalStates[modalMode].buttonText,
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
      // for pages that don't need the Cancel/secondary button
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
          value={newUser.username || existingUser.username}
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
        <div>
          {!emptyGroups
            ? "User groups"
            : "No user groups found. Create a new group on the User Groups tab."}
        </div>

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
  const handleInputUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");

    return setNewGroup({
      ...newGroup,
      ...{
        name: e.target.value,
        id: existingGroup?.id || "",
      },
    });
  };

  const renderAddUserGroup = () => {
    return (
      <>
        <Label htmlFor="username">User group name</Label>
        <TextInput
          id="group-name"
          name="group-name"
          type="text"
          value={newGroup.name || existingGroup?.name || ""}
          onChange={handleInputUpdate}
          required
        />
      </>
    );
  };

  const renderConfirmDeleteGroup = (group: UserGroup) => {
    return (
      <>
        Users and queries assigned to {group.name} will not be deleted, but
        users will no longer be able to view or run {group.name}'s queries.
        <br />
        <br />
        This action cannot be undone.
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
      case "edit-group":
        return renderAddUserGroup();
      case "remove-group":
        return renderConfirmDeleteGroup(existingGroup);
    }
  };

  let heading = ModalStates[modalMode].heading;
  if (modalMode == "remove-group") {
    heading = `Delete group '${existingGroup.name}'?`;
  }

  const buttonsList = getModalButtons();

  let buttonText = ModalStates[modalMode].buttonText;
  if (modalMode == "edit-group" && role == "Admin") {
    buttonText = `Save & update queries`;
    buttonsList[0].text = buttonText;
  }

  return (
    <Modal
      id="user-mgmt"
      heading={heading}
      modalRef={modalRef}
      buttons={buttonsList}
      errorMessage={errorMessage}
    >
      {renderModalContent(modalMode)}
    </Modal>
  );
};

export default UserModal;
