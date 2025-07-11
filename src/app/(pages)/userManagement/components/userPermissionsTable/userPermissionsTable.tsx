"use client";

import {
  useContext,
  Dispatch,
  SetStateAction,
  RefObject,
  createRef,
  useEffect,
} from "react";
import { Button, Icon } from "@trussworks/react-uswds";
import classNames from "classnames";
import { updateUserRole } from "@/app/backend/user-management";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import Table from "../../../../ui/designSystem/table/Table";
import RoleDropdown from "../roleDropdown/RoleDropdown";
import { UserManagementContext } from "../UserManagementProvider";
import styles from "../../userManagement.module.scss";
import { useSession } from "next-auth/react";
import {
  UserRole,
  User,
  UserGroupMembership,
} from "@/app/models/entities/users";
import { UserManagementMode } from "../../utils";

type PermissionsProps = {
  users: User[] | null;
  setUsers: Dispatch<SetStateAction<User[]>>;
  fetchGroupMembers: (groupId: string) => Promise<User[]>;
  openModal: (
    mode: UserManagementMode,
    user: User,
    setModalData?: Dispatch<SetStateAction<UserManagementMode | string>>,
  ) => void;
  rowFocusRefs: RefObject<RefObject<HTMLTableRowElement | null>[] | null>;
  modalData: UserManagementMode | string;
  setModalData?: Dispatch<SetStateAction<UserManagementMode | string>>;
};

/**
 * User section in the user management page
 * @param root0 - The user permissions table
 * @param root0.users The list of users
 * @param root0.setUsers State function to update the list of users
 * @param root0.fetchGroupMembers Function to retrieve a group's list of users
 * @param root0.openModal Function to retrieve a group's list of assigned queries
 * @param root0.rowFocusRefs ref array for the table row buttons that can open the user modal
 * @param root0.modalData 
 * @returns Users table   
 
 */
const UserPermissionsTable: React.FC<PermissionsProps> = ({
  users,
  setUsers,
  fetchGroupMembers,
  openModal,
  rowFocusRefs,
  modalData,
}) => {
  const { openEditSection } = useContext(UserManagementContext);
  const { data: session } = useSession();

  useEffect(() => {
    const row = rowFocusRefs?.current?.filter(
      (tr) => tr.current?.id == modalData,
    )[0];

    row?.current?.focus();
  }, [modalData]);

  async function handleUserRoleChange(id: string, role: UserRole) {
    try {
      if (users) {
        const updatedUser = await updateUserRole(id, role);
        const newUsersList = users.map((u) => {
          if (u.id == updatedUser.items[0].id) {
            u = updatedUser.items[0] as User;
            return {
              ...u,
              ...{ userGroupMemberships: u?.userGroupMemberships },
            };
          } else {
            return u;
          }
        });
        setUsers(newUsersList);
        showToastConfirmation({
          body: "Role successfully updated.",
        });
      }
    } catch (e) {
      showToastConfirmation({
        body: "Unable to update the user role. Please try again.",
        variant: "error",
      });
      throw e;
    }
  }

  function isSelf(user: User): boolean {
    return user.username === session?.user?.username;
  }

  const renderDropdown = (user: User) => {
    return (
      <td className={styles.roleDropdown}>
        {isSelf(user) ? (
          user.qcRole
        ) : (
          <RoleDropdown
            id={user.id}
            defaultValue={user.qcRole}
            OnChange={(role: UserRole) => {
              handleUserRoleChange(user.id, role);
            }}
          />
        )}
      </td>
    );
  };

  const renderGroups = (user: User) => {
    return (
      <td key={user.id}>
        {user?.userGroupMemberships && user.userGroupMemberships?.length > 0
          ? user.userGroupMemberships?.map(
              (membership: UserGroupMembership, idx: number) => {
                return (
                  <Button
                    className={classNames(
                      "margin-right-2",
                      "text-no-underline",
                    )}
                    type="button"
                    unstyled
                    key={membership.usergroupId}
                    aria-description={`Edit ${membership.usergroupName} members`}
                    onClick={async () => {
                      await fetchGroupMembers(membership.usergroupId).then(
                        (members) =>
                          openEditSection(
                            membership.usergroupName,
                            "Members",
                            "Members",
                            membership.usergroupId,
                            members,
                          ),
                      );
                    }}
                  >
                    <span>
                      {membership.usergroupName}
                      {idx + 1 != user.userGroupMemberships?.length && ","}
                    </span>
                  </Button>
                );
              },
            )
          : "--"}
      </td>
    );
  };

  const renderActionButtons = (user: User) => {
    return (
      <Button
        unstyled
        className={classNames(
          styles.hoverBtn,
          "unstyled-button-container",
          "usa-button--unstyled text-bold text-no-underline",
        )}
        type="button"
        onClick={() => {
          const row = rowFocusRefs?.current?.filter(
            (tr) => tr.current?.id == user?.id,
          )[0];
          row?.current?.focus();

          openModal("edit-user", user);
        }}
      >
        <span className="icon-text padding-right-4 display-flex flex-align-center">
          <Icon.Edit
            className="height-3 width-3"
            aria-label="Pencil icon indicating edit ability"
          />
          <span
            data-testid={`edit-group-${user.id}`}
            className="padding-left-05"
          >
            Rename
          </span>
        </span>
      </Button>
    );
  };

  const renderUserRows = (users: User[] | null): React.ReactNode => {
    return users?.map((user: User, i: number) => {
      if (rowFocusRefs && rowFocusRefs.current) {
        rowFocusRefs.current[i] = createRef();
      }
      const display =
        user.firstName && user.lastName
          ? `${user.lastName}, ${user.firstName} ${
              isSelf(user) ? "(self)" : ""
            }`
          : `${user.username}`;

      return (
        <tr
          ref={rowFocusRefs?.current?.[i]}
          key={user.id}
          tabIndex={0}
          id={user.id}
        >
          <td>
            <div className={styles.buttonHoverGroup}>
              <span>{display}</span>

              {renderActionButtons(user)}
            </div>
          </td>
          {renderDropdown(user)}
          {renderGroups(user)}
        </tr>
      );
    });
  };

  return (
    <Table className={styles.userPermissionsTable}>
      <thead>
        <tr>
          <th className="grid-col-5">Name</th>
          <th className="grid-col-3">Permissions</th>
          <th className="grid-col-4">User groups</th>
        </tr>
      </thead>
      <tbody>{renderUserRows(users)}</tbody>
    </Table>
  );
};

export default UserPermissionsTable;
