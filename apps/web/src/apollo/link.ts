import {
  ApolloLink,
  createHttpLink,
  FetchResult,
  HttpLink,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { toast } from 'react-toastify';
import ROUTER_PATH from '@/constants/RouterPath';

import {
  setAccessTokenStorage,
  getAccessTokenStorage,
} from '@/services/storage';
import getAccessTokenPromise from '@/utils/getAccessToken';

const operationName = 'GetConcerts';

// https://localhost:8282/graphql
/* Configuration imported from '.env' file */
const backendProtocol = (import.meta as any).env.REACT_APP_PROTOCOL ?? 'http';
const backendHost = (import.meta as any).env.REACT_APP_HOST ?? 'localhost';
const backendPort = (import.meta as any).env.REACT_APP_PORT ?? '8181';
const backendGraphql = (import.meta as any).env.REACT_APP_GRAPHQL ?? 'graphql';

const backendAddress = `${backendProtocol}://${backendHost}:${backendPort}/${backendGraphql}`;

console.log('backendAddress backendAddress', backendAddress);

// https://github.com/apollographql/apollo-client/issues/84#issuecomment-763833895
const httpLink = new HttpLink({
  uri: backendAddress,
});
const httpLink2 = new HttpLink({
  uri: 'http://localhost:8282/graphql',
  credentials: 'same-origin',
});

const linkTokenHeader = setContext((operation, { headers }) => {
  console.log('---------------------------', operation.operationName);
  const token = getAccessTokenStorage();
  const authorization = token ? `Bearer ${token}` : '';
  return {
    headers: {
      ...headers,
      authorization,
    },
  };
});

export const possibleRefreshTokenErrors = [
  'Refresh token is not in database!', // refresh token is not in the database
  'Refresh token was expired. Please make a new signin request', // refresh token is expired
];

export const possibleAccessTokenErrors = [
  'Login required.', // access token is not sent or Header key is not correct
  'Error decoding signature', // access token or prefix is invalid
  'Signature has expired', // access token is expired
];

const errorHandler = ({ graphQLErrors, networkError, operation, forward }) => {
  console.log('operation', operation);
  if (graphQLErrors)
    graphQLErrors.forEach(async ({ err, message }) => {
      if (networkError?.response?.status === 401) {
        //clearRefreshTokenStorage();
        //clearAccessTokenStorage();
        //clearUserStorage();
        //window.location.href = ROUTER_PATH.SIGNIN;
        const accessToken = await getAccessTokenPromise();
        console.log(
          'getAccessTokenPromise getAccessTokenPromise getAccessTokenPromise',
          accessToken,
        );
        setAccessTokenStorage(accessToken as string);
      }

      if (possibleRefreshTokenErrors.includes(message)) {
        //clearRefreshTokenStorage();
        //clearAccessTokenStorage();
        //clearUserStorage();
        //window.location.href = ROUTER_PATH.SIGNIN;
      }

      console.log('graphQLErrors', message);
      console.log('err err err err', err?.extensions?.code);
      if (networkError) {
        console.log('networkError', networkError);
      }
      // response.errors = undefined
    });
};

export const linkError = onError(errorHandler);

/*
const errorLink = onError(
  ({ graphQLErrors, networkError, operation, response }) => {
    console.log(
      'networkError networkError networkError networkError',
      networkError,
    );
    console.log(
      'graphQLErrors graphQLErrors graphQLErrors graphQLErrors',
      graphQLErrors,
    );

    console.log(
      'networkError?.response?.status',
      networkError?.response?.status,
    );

    if (graphQLErrors?.length) {
      graphQLErrors.forEach(
        (err: {
          extensions: { exception: { status: number }; code: string };
          message: string | null | undefined;
        }) => {
          console.log(
            'err?.extensions?.exception?.status',
            err?.extensions?.exception?.status,
          );
        },
      );
    }

    if (networkError?.response?.status === 403) {
      clearRefreshTokenStorage();
      clearAccessTokenStorage();
      clearUserStorage();
      window.location.href = ROUTER_PATH.SIGNIN;
    }
    /*
    if (networkError?.response?.status === 401) {
      clearAuthStorage();
      clearUserStorage();
      window.location.href = ROUTER_PATH.SIGNIN;
    }

    if (graphQLErrors?.length) {
      graphQLErrors.forEach(
        (err: {
          extensions: { exception: { status: number }; code: string };
          message: string | null | undefined;
        }) => {
          toast.error(err?.message);

          console.log('graphQLErrors', err);

          if (err?.extensions?.exception?.status === 401) {
            clearAuthStorage();
            clearUserStorage();
            window.location.href = ROUTER_PATH.SIGNIN;
          }

          if (
            err.extensions.code === ERRORS.UNAUTHENTICATED ||
            err.extensions.code === ERRORS.FORBIDDEN
          ) {
            clearAuthStorage();
            clearUserStorage();
            // window.location.href = ROUTER_PATH.SIGNIN;
          }
        },
      );
    }
  },
);
*/

const graphqlEndpoints = ApolloLink.split(
  (operation) => operation.operationName === operationName,
  httpLink2,
  httpLink,
);

const link = ApolloLink.from([linkTokenHeader, linkError, graphqlEndpoints]);

export default link;
