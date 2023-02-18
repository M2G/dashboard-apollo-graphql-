/* eslint-disable */
import { Suspense, lazy, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ROUTER_PATH from 'constants/RouterPath';

const Home = lazy(() => import('containers/Home'));
const Signin = lazy(() => import('containers/Signin'));
const Signup = lazy(() => import('containers/Signup'));
const ForgotPassword = lazy(() => import('containers/ForgotPassword'));
const ResetPassword = lazy(() => import('containers/ResetPassword'));
const ChangePassword = lazy(() => import('containers/ChangePassword'));
const Profil = lazy(() => import('containers/Profil'));

import TopLineLoading from 'components/Loading/TopLineLoading';
import { AuthContext } from '../AuthContext';

/**
 * Top level application router
 *
 * @returns {Component}
 */

const Router = () => {
  const { isAuth } = useContext(AuthContext);
  const { userData } = useContext(AuthContext);

  console.log('isAuth userData userData', {
    isAuth,
    userData
  });

  const userId = userData?._id;

  console.log('userId userId', userId)

  return (
    <main>
      <Suspense fallback={<TopLineLoading />}>
        <Routes>
          {isAuth && userId && (
            <Route path={ROUTER_PATH.HOME} element={<Home />} />
          )}
          {isAuth && userId && (
            <Route path={ROUTER_PATH.PROFIL} element={<Profil />} />
          )}
          {isAuth && userId && (
            <Route
              path={ROUTER_PATH.CHANGE_PASSWORD}
              element={<ChangePassword />}
            />
          )}

          {!isAuth && (
            <Route
              path={ROUTER_PATH.RESET_PASSWORD}
              element={<ResetPassword />}
            />
          )}
          {!isAuth && (
            <Route
              path={ROUTER_PATH.FORGOT_PASSWORD}
              element={<ForgotPassword />}
            />
          )}
          {!isAuth && <Route path={ROUTER_PATH.SIGNUP} element={<Signup />} />}
          {!isAuth && <Route path={ROUTER_PATH.SIGNIN} element={<Signin />} />}
          {!isAuth && (
            <Route
              path="*"
              element={<Navigate to={ROUTER_PATH.SIGNIN} replace />}
            />
          )}
        </Routes>
      </Suspense>
    </main>
  );
};

export default Router;
