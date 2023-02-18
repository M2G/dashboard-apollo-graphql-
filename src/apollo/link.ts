/*eslint-disable*/
import { ApolloLink, HttpLink } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { toast } from 'react-toastify';
import ROUTER_PATH from 'constants/RouterPath';
import { clearAuthStorage, clearUserStorage, getAuthStorage } from '../services/storage';

// https://localhost:8282/graphql
/* Configuration imported from '.env' file */
const backendProtocol = 'http';
const backendHost = 'localhost';
const backendPort = '8181';
const backendGraphql = 'graphql';

const backendAddress = `${backendProtocol}://${backendHost}:${backendPort}/${backendGraphql}`;

console.log('backendAddress', backendAddress);

const httpLink = new HttpLink({
  uri: backendAddress
});

const authMiddleware = new ApolloLink((operation: any, forward: any) => {
  const token = getAuthStorage();
  const authorization = token ? `Bearer ${token}` : '';
  operation.setContext(({ headers = {} }: any) => ({
    headers: {
      ...headers,
      authorization
    }
  }));

  return forward(operation);
});

const errorLink = onError(({ operation, graphQLErrors, networkError, response, ...arg }: any) => {
  console.log('ERROR', {
    arg,
    graphQLErrors,
    networkError,
    operation,
    response
  });

  console.log('------------------>', networkError?.response?.status);

  if (networkError?.response === 'invalid_token' || networkError?.response?.status === 401) {
    clearAuthStorage();
    clearUserStorage();
    window.location.href = ROUTER_PATH.SIGNIN;
  }

  if (graphQLErrors?.length) {
    graphQLErrors.forEach((err: any) => {
      toast.error(err?.message);

      console.log('graphQLErrors', err);

      if (err?.extensions?.exception?.status === 401) {
        clearAuthStorage();
        clearUserStorage();
        window.location.href = ROUTER_PATH.SIGNIN;
      }

      // err.message, err.locations, err.path, err.extensions
      if (err.extensions.code === 'UNAUTHENTICATED' || err.extensions.code === 'FORBIDDEN') {
        clearAuthStorage();
        clearUserStorage();
        window.location.href = ROUTER_PATH.SIGNIN;
      }
    });
  }
});

const link = ApolloLink.from([authMiddleware, errorLink, httpLink]);

export default link;
