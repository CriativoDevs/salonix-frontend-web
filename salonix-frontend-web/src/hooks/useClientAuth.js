import { useContext } from 'react';
import { ClientAuthContext } from '../contexts/ClientAuthContextInstance';

export const useClientAuth = () => useContext(ClientAuthContext);
