/*eslint-disable*/
import { useCallback } from 'react';
//import { useLazyQuery } from "@apollo/client";
import { INITIAL_VALUES } from './constants';
//import { USER } from 'gql/queries/users';
import ProfilForm from 'components/ProfilForm';

function Profil() {
  //const [user] = useLazyQuery(USER,  { fetchPolicy: 'no-cache' });

  const handleSubmit = useCallback(async (formData: any) => {
    console.log('formData', formData)
    /*await user(
      {
        variables: {
          ...formData
        }
      }
    );*/
  }, []);

  return <ProfilForm initialValues={INITIAL_VALUES} onSubmit={handleSubmit} />;
}

export default Profil;
