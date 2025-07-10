"use client";
import { RefObject, useCallback, useContext, useEffect, useState } from "react";
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
import { SubjectType, UserManagementContext } from "../UserManagementProvider";
import { viewMode } from "../userManagementContainer/userManagementContainer";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { CustomUserQuery } from "@/app/models/entities/query";

const Modal = dynamic<ModalProps>(
  () =>
    import("../../../../ui/designSystem/modal/Modal").then((mod) => mod.Modal),
  { ssr: false },
);

/**
 * The props for the UserModal component.
 */
export interface UserModalProps {
  modalRef: React.RefObject<ModalRef | null>;
  modalMode: UserManagementMode;
  setModalMode: (arg: UserManagementMode) => void;
  refreshView: React.Dispatch<React.SetStateAction<boolean | viewMode>>;
  userGroups?: UserGroup[] | null;
  subjectData?: UserGroup | User;
  tabFocusRef?: RefObject<HTMLButtonElement | null>;
  rowFocusRefs?: RefObject<RefObject<HTMLTableRowElement | null>[]>;
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
 * @param root0.subjectData - The UserGroup or User subject
 * @param root0.tabFocusRef - Ref to return focus to the Users/User Groups table tab
 * @param root0.rowFocusRefs - Refs for each row of table data, for focus control
 * @returns - The UserModal component.
 */
const UserModal: React.FC<UserModalProps> = ({
  modalMode,
  setModalMode,
  modalRef,
  refreshView,
  userGroups,
  subjectData,
  tabFocusRef,
  rowFocusRefs,
}) => {
  const emptyUser = {
    id: "",
    username: "",
    firstName: "",
    lastName: "",
    qcRole: UserRole.STANDARD,
    userGroupMemberships: [],
  };
  const emptyGroup = {
    id: "",
    name: "",
    memberSize: 0,
    querySize: 0,
    queries: [],
    members: [],
  };

  const [newUser, setNewUser] = useState<User>(emptyUser);
  const [newGroup, setNewGroup] = useState<UserGroup>(emptyGroup);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [activeField, setActiveField] = useState<string>("");
  const { openEditSection } = useContext(UserManagementContext);

  const existingGroup = subjectData as UserGroup;
  const existingUser = subjectData as User;
  const role = getRole();

  const handleOutsideModalClick = useCallback(
    (event: MouseEvent | KeyboardEvent) => {
      const clickTarget = (event.target as HTMLElement).getAttribute(
        "data-testid",
      );

      if (
        clickTarget == "modalOverlay" ||
        (!!modalRef.current?.modalIsOpen &&
          (event as KeyboardEvent).key == "Escape")
      ) {
        handleCloseModal();
        resetModalState();
      }
    },
    [],
  );

  useEffect(() => {
    window.addEventListener("mousedown", handleOutsideModalClick);

    // Cleanup
    return () => {
      window.removeEventListener("mousedown", handleOutsideModalClick);
    };
  }, []);

  useEffect(() => {
    if (modalMode === "closed") {
      handleCloseModal();
      resetModalState();
    }
  }, [modalMode]);

  useEffect(() => {
    if (newGroup.id !== "" && modalMode !== "edit-group") {
      refreshView("Update User groups");
      setNewGroup(emptyGroup);
    }
  }, [newGroup]);

  const updateUserFields = () => {
    const updatedValues = Object.entries(newUser).map(([key, val]) => {
      if (key == "qcRole") {
        val = existingUser?.qcRole;
      }
      if (val === "") {
        val = existingUser?.[key as keyof typeof newUser];
      }

      return [key, val];
    });

    return Object.fromEntries(updatedValues);
  };

  const handleButtonClick = async () => {
    if (!!errorMessage) {
      return;
    }

    if (modalMode == "create-user") {
      const userToAdd = {
        id: newUser.id || "",
        email: "",
        username: newUser.username,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        qcRole: newUser.qcRole,
      };

      const hasError = Object.entries(userToAdd).some(
        ([key, val]) => val == "" && key != "id" && key != "email",
      );

      if (!!hasError) {
        return setErrorMessage("Please fill out all required fields");
      }

      // if we have an ID but we're in create-user mode, we backnav'd here;
      // we should update rather than add as a new user
      if (userToAdd.id) {
        const udpatedUser = await updateUserDetails(
          userToAdd.id,
          userToAdd.username,
          userToAdd.firstName,
          userToAdd.lastName,
          userToAdd.qcRole,
        );

        if (udpatedUser?.msg) {
          return setErrorMessage(udpatedUser.msg);
        } else {
          setNewUser({ ...newUser, ...udpatedUser });
          refreshView("Update Users");
          setErrorMessage("");
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

    if (modalMode == "edit-user") {
      const userToUpdate = updateUserFields();
      if (
        (userToUpdate.firstName === "" ||
          userToUpdate.firstName === existingUser.firstName) &&
        (userToUpdate.lastName === "" ||
          userToUpdate.lastName === existingUser.lastName)
      ) {
        // we haven't changed anything; don't update the db
        return setModalMode("closed");
      }

      const updatedUser = await updateUserDetails(
        userToUpdate.id,
        userToUpdate.username,
        userToUpdate.firstName,
        userToUpdate.lastName,
        userToUpdate.qcRole,
      );

      if (updatedUser) {
        setNewUser(emptyUser);
        refreshView("Update Users");
        setModalMode("closed");
      } else {
        setModalMode("closed");
        return setErrorMessage("Unable to update user.");
      }
    }

    if (modalMode == "select-groups") {
      if (newUser.id && !errorMessage) {
        // update db on save
        newUser.userGroupMemberships?.forEach(async (membership) => {
          await addUsersToGroup(membership.usergroupId, [newUser.id]);
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
        memberSize: existingGroup?.memberSize || newGroup.memberSize || 0,
        querySize: existingGroup?.querySize || newGroup.querySize || 0,
      };

      if (newGroup.name == "" && existingGroup && existingGroup?.name != "") {
        // we haven't changed anything, but we still want to trigger
        // the drawer open with newGroup update
        setNewGroup({ ...newGroup, ...existingGroup });

        return setModalMode("closed");
      }

      if (
        newGroup.name == "" &&
        (!existingGroup || existingGroup?.name == "") &&
        !errorMessage
      ) {
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
      } finally {
        tabFocusRef?.current?.focus();
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
        membershipId: "",
        usergroupName: groupName,
        usergroupId: groupId,
        isMember: checked,
      };
      newUser?.userGroupMemberships?.push(newGroupMembership);

      return setNewUser({
        ...newUser,
        ...{ userGroupMemberships: newUser.userGroupMemberships },
      });
    }

    const currentGroups = newUser.userGroupMemberships;
    const updatedGroupMemberships = currentGroups?.filter((g) => {
      return g.usergroupId !== groupId;
    });

    return setNewUser({
      ...newUser,
      ...{ userGroupMemberships: updatedGroupMemberships },
    });
  };

  const handleCloseModal = () => {
    resetModalState();
    setErrorMessage("");
    modalRef?.current?.toggleModal();
  };

  const resetModalState = () => {
    setErrorMessage("");
    setActiveField("");
    setNewUser(emptyUser);
    setNewGroup(emptyGroup);
  };

  const emptyGroups = !userGroups || (userGroups && userGroups.length == 0);

  const getModalButtons = () => {
    const buttons = [
      {
        text:
          modalMode == "create-user" && emptyGroups
            ? "Add user" // if there are no groups, don't move to second step
            : role == UserRole.ADMIN && modalMode == "create-group"
              ? "Next: Assign queries"
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
        className: "usa-button usa-button--secondary shadow-none",
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

  const validateInput = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    const field = (e.target.previousSibling as HTMLElement).innerHTML;
    if (value.trim() === "" && !!modalRef.current?.modalIsOpen) {
      return setErrorMessage(`${field} cannot be blank`);
    }
  };

  const renderAddUser = () => {
    return (
      <>
        <Label htmlFor="firstName">First name</Label>
        <TextInput
          id="firstName"
          name="firstName"
          type="text"
          value={newUser.firstName}
          onChange={handleUserInput("firstName")}
          onBlur={validateInput}
          required
        />
        <Label htmlFor="lastName">Last name</Label>
        <TextInput
          id="lastName"
          name="lastName"
          type="text"
          value={newUser.lastName}
          onChange={handleUserInput("lastName")}
          onBlur={validateInput}
          required
        />
        <Label htmlFor="username">Email address</Label>
        <TextInput
          id="email"
          name="email"
          type="email"
          value={newUser.username}
          onChange={handleUserInput("username")}
          onBlur={validateInput}
          required
        />
        <Label htmlFor="auth-method">Permissions</Label>
        <select
          className="usa-select"
          id="user-role"
          name="user-role"
          value={newUser.qcRole}
          onChange={(e) =>
            setNewUser({
              ...newUser,
              ...{ qcRole: e.target.value as UserRole },
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

  const renderEditUser = () => {
    return (
      <>
        <Label htmlFor="firstName">First name</Label>
        <TextInput
          id="firstName"
          name="firstName"
          type="text"
          value={
            activeField == "firstName" || newUser.firstName !== ""
              ? newUser.firstName
              : existingUser?.firstName
          }
          onChange={handleUserInput("firstName")}
          onBlur={validateInput}
          required
        />
        <Label htmlFor="lastName">Last name</Label>
        <TextInput
          id="lastName"
          name="lastName"
          type="text"
          value={
            activeField == "lastName" || newUser.lastName !== ""
              ? newUser.lastName
              : existingUser?.lastName
          }
          onChange={handleUserInput("lastName")}
          onBlur={validateInput}
          required
        />
      </>
    );
  };

  const renderSelectUserGroups = () => {
    const userGroupIds = newUser.userGroupMemberships?.flatMap(
      (membership) => membership.usergroupId,
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

  const handleUserInput =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setErrorMessage("");
      setActiveField(field);

      setNewUser({
        ...newUser,
        ...{ [field]: e.target.value },
      });
    };

  const handleInputUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    setActiveField("group-name");

    return setNewGroup({
      ...newGroup,
      ...{
        name: e.target.value,
      },
    });
  };

  const renderAddUserGroup = () => {
    const value =
      modalMode == "create-group" || activeField == "group-name"
        ? newGroup.name
        : existingGroup?.name;

    return (
      <>
        <Label htmlFor="username">User group name</Label>
        <TextInput
          id="group-name"
          name="group-name"
          type="text"
          value={value}
          onChange={handleInputUpdate}
          onBlur={validateInput}
          required
        />
      </>
    );
  };

  const renderConfirmDeleteGroup = (group: UserGroup) => {
    return (
      <>
        {`Would you like to delete ${group.name}? This action cannot be undone`}
      </>
    );
  };

  const renderModalContent = (mode: UserManagementMode) => {
    switch (mode) {
      case "create-user":
        return renderAddUser();
      case "edit-user":
        return renderEditUser();
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

  const buttonsList = getModalButtons();

  let buttonText = ModalStates[modalMode].buttonText;
  if (modalMode == "edit-group" && role == "Admin") {
    buttonText = `Save & update queries`;
    buttonsList[0].text = buttonText;
  }
  if (modalMode == "edit-user") {
    buttonText = `Save changes`;
    buttonsList[0].text = buttonText;
  }
  if (modalMode == "remove-group") {
    buttonsList[0].className = "usa-button--destructive";
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
