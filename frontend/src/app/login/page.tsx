'use client';

import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import styles from './login.module.css';

export default function LoginPage() {
  const { login } = useAuth();

  const handleSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      // Decode JWT locally to get basic user info
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      
      const userData = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };

      login(credentialResponse.credential, userData);
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
          />
        </div>
      </div>
    </div>
  );
}
