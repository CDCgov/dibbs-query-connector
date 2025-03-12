"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
// import classNames from "classnames";
import { Label, TextInput } from "@trussworks/react-uswds";
import {
  addUserIfNotExists,
  createUserGroup,
} from "@/app/backend/user-management";
import { addUsersToGroup } from "@/app/backend/usergroup-management";
import {
  User,
  UserGroup,
  UserGroupMembership,
  UserRole,
} from "@/app/models/entities/user-management";
import type { ModalRef } from "../../../../ui/designSystem/modal/Modal";
import type { ModalProps } from "../../../../ui/designSystem/modal/Modal";
import { UserManagementMode } from "../../utils";
import Checkbox from "@/app/ui/designSystem/checkbox/Checkbox";
import { RoleDescriptons } from "../../utils";
// import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

const Modal = dynamic<ModalProps>(
  () =>
    import("../../../../ui/designSystem/modal/Modal").then((mod) => mod.Modal),
  { ssr: false },
);

/**
 * The props for the PatientSearchResults component.
 */
export interface UserModalProps {
  modalRef: React.RefObject<ModalRef>;
  mode: UserManagementMode;
  setMode: (arg: UserManagementMode) => void;
  users?: User[] | null;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  userGroups?: UserGroup[] | null;
  setUserGroups: React.Dispatch<React.SetStateAction<UserGroup[]>>;
}

/**
 * Implementation of the Modal component for User Management; handles creation, editing, and deletion
 * of Users, UserGroups, and associated queries
 * @param root0 - UserModal props.
 * @param root0.modalRef - reference passed from parent to control showing/hiding the modal
 * @param root0.mode - Whether the modal should display the form for creating or editing a user
 * @param root0.setMode - Whether the modal should display the form for creating or editing a user
 * @param root0.users - reference passed from parent to control showing/hiding the modal
 * @param root0.setUsers -asdf
 * @param root0.userGroups - reference passed from parent to control showing/hiding the modal
 * @param root0.setUserGroups -asdf
 * @returns - The UserModal component.
 */
const UserModal: React.FC<UserModalProps> = ({
  mode,
  setMode,
  modalRef,
  users,
  setUsers,
  userGroups,
  setUserGroups,
}) => {
  useEffect(() => {
    console.log;
  }, [mode]);
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

  const [errorMessage, setErrorMessage] = useState<string | undefined>("");
  const [userIdsToAdd, setUserIdsToAdd] = useState<string[]>([]);

  const handleSave = async () => {
    console.log("mode before we decide what to do on save", mode);
    if (mode === "create-user") {
      const userToAdd = {
        id: "",
        email: "",
        username: newUser.username,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.qc_role,
      };

      const newUserAdded = await addUserIfNotExists(userToAdd);
      setNewUser({ ...newUser, ...{ id: newUserAdded.id } });
      if (!!newUserAdded && !newUserAdded?.msg) {
        return setMode("select-groups");
      } else {
        console.log("oh no!!", newUserAdded.msg);
        setErrorMessage(newUserAdded.msg);
      }
    }

    if (mode === "select-groups") {
      if (newUser.id) {
        let groupMemberships = 0;
        newUser.userGroupMemberships?.forEach(async (group) => {
          const result = await addUsersToGroup(group.usergroup_id, [
            newUser.id,
          ]);
          if (result.length > 0) {
            groupMemberships++;
          }
          return setUsers({ ...(users as User[]) });
        });
      }
      handleCloseModal();

      // if (!!newUserAdded && !newUserAdded?.msg) {
      //   setMode("select-groups");
      // } else {
      //   console.log("oh no!!", newUserAdded.msg);
      //   setErrorMessage(newUserAdded.msg);
      // }
    }
    if (mode === "create-group") {
      const result = (await createUserGroup(newGroup.name)) as UserGroup;

      if (result) {
        console.log("success!", result);

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
      } else {
        // console.log("oh no!!", result.msg);
        // setErrorMessage(result.msg);
      }
    }
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
    if (mode == "add-queries") {
      console.log("success!");
      handleCloseModal();
    }
  };

  const handleMemberUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.currentTarget);
    const user = e.currentTarget.name;
    const checked = e.target.checked;
    console.log(user, checked);
    setUserIdsToAdd([...userIdsToAdd, user]);
    console.log(userIdsToAdd);
  };

  const handleAddNewUserToGroup = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      newUser.userGroupMemberships?.push(newGroup);
      return setNewUser({
        ...newUser,
        ...{ userGroupMemberships: newUser.userGroupMemberships },
      });
    }
    const currentGroups = newUser.userGroupMemberships;
    const updatedGroups = currentGroups?.filter(
      (g) => g.usergroup_id != groupId,
    );

    return setNewUser({
      ...newUser,
      ...{ userGroupMemberships: updatedGroups },
    });
  };

  useEffect(() => {
    console.log(newUser);
  }, [newUser]);

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
    });
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
          onChange={(e) => {
            console.log(e.target.value);
            setNewUser({
              ...newUser,
              ...{ qc_role: e.target.value as UserRole },
            });
          }}
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

  const userGroupIds = newUser.userGroupMemberships?.flatMap(
    (gr) => gr.usergroup_id,
  );

  const renderSelectUserGroup = () => {
    console.log(
      userIdsToAdd.includes(newUser.id),
      newUser,
      newUser.id,
      userIdsToAdd,
    );
    return (
      <>
        <div>User groups</div>
        {userGroups &&
          userGroups.length > 0 &&
          userGroups.map((group) => {
            return (
              <div>
                <Checkbox
                  id={group.id}
                  label={`${group.name}`}
                  checked={userGroupIds?.includes(group.id)}
                  onChange={handleAddNewUserToGroup}
                />
              </div>
            );
          })}
      </>
    );
  };

  const renderUserGroupFields = () => {
    return (
      <>
        <div>User groups</div>
      </>
    );
  };

  const renderModalContent = (mode: UserManagementMode) => {
    console.log("current mode for render?", mode);
    switch (mode) {
      case "create-user":
        return renderAddUser();
      case "select-groups":
        return renderSelectUserGroup();

      default:
    }
  };

  const userMode = mode === "create-user" || mode === "remove-user";
  const userGroupMode = mode === "select-groups";

  const groupMode =
    mode === "create-group" ||
    mode === "remove-group" ||
    mode == "add-members" ||
    mode == "add-queries";

  const modalState = {
    heading: "",
    buttonText: "",
    render: () => {},
  };

  return (
    <Modal
      id="user-mgmt"
      heading={
        mode === "create-user"
          ? "New user"
          : mode == "select-groups"
            ? "Add to user groups"
            : mode === "create-group"
              ? "Create user group"
              : mode === "add-members"
                ? "Assign members"
                : "Edit changes"
      }
      modalRef={modalRef}
      buttons={[
        {
          text:
            mode === "create-user"
              ? "Next: Add to user groups"
              : mode == "select-groups"
                ? "Add User"
                : mode == "create-group"
                  ? "Next: Assign members"
                  : mode === "add-members"
                    ? "Next: Assign queries"
                    : mode === "add-queries"
                      ? "Save Changes"
                      : "Save changes",
          type: "submit" as const,
          id: "modal-save-button",
          className: "usa-button",
          onClick: handleSave,
        },
      ]}
      errorMessage={errorMessage}
    >
      {renderModalContent(mode)}
    </Modal>
  );
};

export default UserModal;
