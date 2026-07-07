'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, []);

  async function checkSubscription() {
    if (!('serviceWorker' in navigator)) return;
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Erro ao verificar inscrição push:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Seu navegador não suporta notificações push.');
      return;
    }

    try {
      setIsLoading(true);
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        throw new Error('Permissão de notificação negada.');
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Converte a chave VAPID base64 para Uint8Array
      const padding = '='.repeat((4 - (VAPID_PUBLIC_KEY!.length % 4)) % 4);
      const base64 = (VAPID_PUBLIC_KEY! + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      });

      // Envia para o backend
      await api.post('/notifications/subscribe', subscription.toJSON());
      
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('Erro ao inscrever para push:', error);
      alert('Erro ao ativar notificações. Verifique as configurações do navegador.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  return {
    permission,
    isSubscribed,
    isLoading,
    subscribe
  };
}
