import type { JSX } from 'react';
import { useMemo, useCallback, useEffect, useState } from 'react';
import type { IUserListItem } from 'containers/UserList/UserListItem';
import userListItem from 'containers/UserList/UserListItem';
import UserEdit from 'containers/Users/UserEdit';
import UserNew from 'containers/Users/UserNew';
import SidebarWrapper from 'components/Core/Sidebar/SidebarWrapper';
import ModalWrapper from 'components/Core/Modal/ModalWrapper';
import TopLineLoading from 'components/Loading/TopLineLoading';
import NoData from 'components/NoData';
import type { User, Users, GetUsersQuery } from 'modules/graphql/generated';
import {
  useUpdateUserMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetUsersLazyQuery,
  GetUsersDocument,
} from 'modules/graphql/generated';
import UserFilters from 'containers/UserFilters';
import List from 'containers/UserList/ListLegacy';
import AddUser from './Action/AddUser';
import type { UserList } from './types';
import './index.scss';

function UserList({
  id,
  canEdit = false,
  canDelete = false,
  canAdd = false,
}: UserList): JSX.Element {
  const [state, setUser] = useState<{
    deletingUser?: User | boolean;
    editingUser?: User | boolean;
    newUser?: User | boolean;
  }>({
    deletingUser: false,
    editingUser: false,
    newUser: false,
  });
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
  }>({
    page: 1,
    pageSize: 5,
  });
  const [term, setTerm] = useState('');

  const [getUsers, { loading, error, data }] = useGetUsersLazyQuery({
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  });

  console.log('useGetUserListLazyQuery', { loading, error, data });

  useEffect(() => {
    getUsers({
      variables: {
        filters: term,
        page: pagination.page,
        pageSize: pagination.pageSize,
      },
    });
  }, [getUsers, pagination, term]);

  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const onDelete = useCallback((user: User): void => {
    setUser({ editingUser: false, newUser: false, deletingUser: user });
  }, []);

  const onClose = useCallback(() => {
    setUser({ editingUser: false, newUser: false, deletingUser: false });
  }, []);

  const onAdd = useCallback((): void => {
    setUser({ editingUser: false, newUser: true, deletingUser: false });
  }, []);

  const onEdit = useCallback((user: User): void => {
    setUser({ editingUser: user, newUser: false, deletingUser: false });
  }, []);

  const onEditUser = useCallback(
    async (user: User): Promise<void> => {
      await updateUser({
        variables: {
          input: {
            username: user?.username,
            email: user?.email,
            first_name: user?.first_name,
            last_name: user?.last_name,
          },
          id: user.id!,
        },
        optimisticResponse: {
          __typename: 'Mutation',
          updateUser: {
            success: true,
            __typename: 'Status',
          },
        },
        update(cache, _) {
          const cachedUserList = cache.readQuery<GetUsersQuery>({
            query: GetUsersDocument,
            variables: {
              page: pagination.page,
              pageSize: pagination.pageSize,
              filters: term,
            },
          });

          const userList = cachedUserList?.users?.results || [];

          const users = userList.map((d) => {
            if (d?.id !== user?.id) return d;
            return {
              ...user,
              id: user.id,
              password: user.password,
              created_at: Math.floor(Date.now() / 1000),
              modified_at: Math.floor(Date.now() / 1000),
              __typename: 'User',
            };
          });

          const newData = {
            users: {
              results: users,
              pageInfo: cachedUserList?.users?.pageInfo,
              __typename: 'Users',
            },
          };

          cache.writeQuery({
            query: GetUsersDocument,
            variables: {
              page: pagination.page,
              pageSize: pagination.pageSize,
              filters: term,
            },
            data: {
              __typename: 'Query',
              ...newData,
            },
          });
        },
      });
      onClose();
    },
    [pagination, onClose, updateUser],
  );

  const onNewUser = useCallback(
    async (user: User): Promise<void> => {
      await createUser({
        variables: {
          email: user.email,
          password: user.password,
        },
        optimisticResponse: {
          __typename: 'Mutation',
          createUser: {
            email: user?.email,
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            created_at: Math.floor(Date.now() / 1000),
            modified_at: Math.floor(Date.now() / 1000),
            __typename: 'User',
          },
        },
        update(cache, mutationResult) {
          const resultMessage = mutationResult?.data?.createUser;
          const cachedUserList = cache.readQuery<GetUsersQuery>({
            query: GetUsersDocument,
            variables: {
              page: pagination.page,
              pageSize: pagination.pageSize,
              filters: term,
            },
          });

          const userList = cachedUserList?.users?.results || [];

          const newUser = [
            ...userList,
            ...[
              {
                ...user,
                id: Math.floor(Math.random() * 2),
                first_name: resultMessage?.first_name || '',
                last_name: resultMessage?.last_name || '',
                created_at: Math.floor(Date.now() / 1000),
                modified_at: Math.floor(Date.now() / 1000),
                __typename: 'User',
              },
            ],
          ];

          const newData = {
            users: {
              results: newUser,
              pageInfo: cachedUserList?.users?.pageInfo,
              __typename: 'Users',
            },
          };

          cache.writeQuery({
            query: GetUsersDocument,
            variables: {
              page: pagination.page,
              pageSize: pagination.pageSize,
              filters: term,
            },
            data: {
              __typename: 'Query',
              ...newData,
            },
          });
        },
      });
      onClose();
    },
    [pagination, createUser, onClose],
  );

  const onDeleteUser = useCallback(
    async (user: User): Promise<void> => {
      await deleteUser({
        variables: {
          id: user?.id!,
        },
        optimisticResponse: {
          __typename: 'Mutation',
          deleteUser: {
            __typename: 'Status',
            success: true,
          },
        },
        update(cache, _) {
          const cachedUserList: { users: Users } | null = cache.readQuery({
            query: GetUsersDocument,
            variables: {
              filters: term,
              page: pagination.page,
              pageSize: pagination.pageSize,
            },
          });

          const filtered: never[] =
            cachedUserList?.users?.results?.filter(
              (({ id: userId }: { id: number }) => userId !== user.id) as any,
            ) || [];

          const newUser = [...filtered];

          const newData = {
            users: {
              __typename: 'Users',
              pageInfo: cachedUserList?.users.pageInfo,
              results: newUser,
            },
          };

          cache.writeQuery({
            data: {
              __typename: 'Query',
              ...newData,
            },
            query: GetUsersDocument,
            variables: {
              filters: term,
              page: pagination.page,
              pageSize: pagination.pageSize,
            },
          });
        },
      });
      onClose();
    },
    [deleteUser, onClose, pagination.page, pagination.pageSize, term],
  );

  const searchTerms = useCallback(
    async (term: string): Promise<void> => {
      setTerm(term);
      await getUsers({
        variables: {
          filters: term,
          page: pagination.page,
          pageSize: pagination.pageSize,
        },
      });
    },
    [getUsers, pagination.page, pagination.pageSize],
  );

  const onChangePage = useCallback(
    async (page: number): Promise<void> => {
      setPagination((prevState) => ({
        ...prevState,
        page,
      }));

      await getUsers({
        variables: {
          filters: term,
          page: page || pagination.page,
          pageSize: pagination.pageSize,
        },
      });
    },
    [getUsers, term, pagination.page, pagination.pageSize],
  );

  const onChangePageSize = useCallback(
    async (pageSize: number): Promise<void> => {
      setPagination((prevState) => ({
        ...prevState,
        pageSize,
      }));

      await getUsers({
        variables: {
          filters: term,
          page: pagination.page,
          pageSize: pageSize || pagination.pageSize,
        },
      });
    },
    [pagination, getUsers],
  );

  const users: any = data?.users || [];
  const results = users?.results || [];
  const pageInfo = users?.pageInfo || {};

  const rows = useMemo(
    () =>
      results?.map((user: any) =>
        userListItem({
          canDelete,
          canEdit,
          id,
          onDelete,
          onEdit,
          user,
        } as IUserListItem),
      ),
    [results, canDelete, canEdit, id, onDelete, onEdit],
  );

  const header = useMemo(
    () => [
      { label: '', sortable: false },
      { label: 'First name', sortable: false },
      { label: 'Last name', sortable: false },
      { label: 'Email', sortable: false },
      { label: 'Created at', sortable: true, type: 'date' },
      { label: 'Modified at', sortable: true, type: 'date' },
    ],
    [],
  );

  if (loading) return <TopLineLoading />;

  return (
    <div className="c-user-list">
      <AddUser canAdd={canAdd} onAdd={onAdd} />

      {!results.length && <NoData />}
      <UserFilters onSearchTerm={searchTerms} currentTerm={term} />
      <List
        id={id}
        header={header}
        rows={rows}
        data={results}
        count={pageInfo?.count}
        currentPage={pagination?.page}
        setCurrentPage={onChangePage}
        currentPageSize={pagination?.pageSize}
        setCurrentPageSize={onChangePageSize}
      />

      <SidebarWrapper isOpened={!!state.editingUser} setIsOpened={onClose}>
        <UserEdit data={state.editingUser} onSubmit={onEditUser} />
      </SidebarWrapper>

      <SidebarWrapper isOpened={!!state.newUser} setIsOpened={onClose}>
        <UserNew onSubmit={onNewUser} />
      </SidebarWrapper>

      <ModalWrapper
        title="Delete"
        hide={onClose}
        isShowing={state.deletingUser}
        onConfirm={async () =>
          onDeleteUser(state.deletingUser as unknown as User)
        }
      >
        <p>Warning, you are about to perform an irreversible action</p>
      </ModalWrapper>
    </div>
  );
}

export default UserList;
