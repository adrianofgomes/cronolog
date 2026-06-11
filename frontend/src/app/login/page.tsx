'use client';

import React from 'react';
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';
import api from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();

  const handleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      try {
        const response = await api.post('/auth/login', { id_token: credentialResponse.credential });
        login(response.data.data.token, response.data.data.user);
      } catch (error) {
        console.error('Login Failed', error);
      }
    }
  };

  const handleError = () => {
    console.error('Login Failed');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>Cronolog</div>
        <h1 className={styles.title}>Bem-vindo</h1>
        <p className={styles.description}>
          Entre com sua conta Google para acessar o sistema.
        </p>
        <div className={styles.loginButtonContainer}>
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            useOneTap
            theme="filled_blue"
            shape="pill"
            text="continue_with"
            width="320"
          />
        </div>
      </div>
    </div>
  );
}
