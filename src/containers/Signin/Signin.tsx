import { useContext, useCallback } from 'react';
import { AuthContext } from 'AuthContext';
import { useSigninMutation } from 'modules/graphql/generated';
import SiginForm from 'components/SigninForm';
import { INITIAL_VALUES } from './constants';

function Signin(): JSX.Element {
  const { activateAuth }: any = useContext(AuthContext);
  const [signin, { reset }] = useSigninMutation({
    onCompleted: ({ signin: signinData }: { signin: string }) =>
      activateAuth(signinData),
    onError: () => {
      reset();
    },
  });

  const handleSubmit = useCallback(
    async (formData: { email: string; password: string }) => {
      await signin({
        variables: {
          email: formData.email,
          password: formData.password,
        },
      });
    },
    [signin],
  );

  return <SiginForm initialValues={INITIAL_VALUES} onSubmit={handleSubmit} />;
}

export default Signin;
