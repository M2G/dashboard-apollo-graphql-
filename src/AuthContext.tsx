/*eslint-disable*/
import { createContext, useState, useMemo } from 'react';

import jwt_decode from "jwt-decode";
import {
  clearAuthStorage,
  clearUserStorage,
  getAuthStorage,
  getUserStorage,
  setAuthStorage,
  setUserStorage,
} from './services/storage';

export const AuthContext = createContext<Record<any, any>>({});

function Provider({ children }: any) {
  const [isAuth, setIsAuth] = useState<any>(() => getAuthStorage());
  const [userData, setUserData] = useState(() => getUserStorage());

  const value = {
    isAuth,
    userData: userData ? JSON.parse(userData) : null,
    activateAuth: (token: string) => {
      const decodedToken: {
        email: string;
        _id: string;
      } = jwt_decode(token) || {};

      console.log('decodedToken', decodedToken);

      const user = {
        email: decodedToken.email,
        _id: decodedToken._id,
      };
      setUserStorage(JSON.stringify(user));
      setUserData(JSON.stringify(user));
      setAuthStorage(token);
      setIsAuth(true);
    },
    removeAuth: () => {
      setIsAuth(false);
      setUserStorage(JSON.stringify({}));
      clearUserStorage();
      clearAuthStorage();
    },
  };

  console.log('AuthContext value', value);

  const authValue = useMemo(() => value, [value]);

  return <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>;
}

export default { Consumer: AuthContext.Consumer, Provider };
