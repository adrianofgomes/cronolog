'use client';

import React from 'react';
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';
import api, { BASE_URL } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      setError(null);
      setIsLoggingIn(true);
      try {
        const response = await api.post('/auth/login', { id_token: credentialResponse.credential }, { silent: true });
        await login(response.data.data.token, response.data.data.user);
      } catch (err: any) {
        console.error('Login Failed', err);
        const backendMessage = err.response?.data?.error?.description || err.response?.data?.message;
        const errorMessage = backendMessage || err.message || 'Erro desconhecido';
        
        if (err.isNetworkError || err.message?.includes('fetch')) {
          setError(`Erro de conexão com a API (${BASE_URL}): ${errorMessage}`);
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  const handleError = () => {
    console.error('Login Failed');
    setError('Não foi possível conectar com o Google. Tente novamente.');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>Cronolog</div>
        <h1 className={styles.title}>Bem-vindo</h1>
        <p className={styles.description}>
          Entre com sua conta Google para acessar o sistema.
        </p>
        
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        <div className={styles.loginButtonContainer}>
          {isLoggingIn ? (
            <div className={styles.loading}>Autenticando...</div>
          ) : (
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap
              theme="filled_blue"
              shape="pill"
              text="continue_with"
              width="320"
            />
          )}
        </div>
      </div>
    </div>
  );
}
