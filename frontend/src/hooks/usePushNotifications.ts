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

    if (!VAPID_PUBLIC_KEY) {
      console.error('VAPID_PUBLIC_KEY não configurada no frontend.');
      alert('Erro de configuração: Chave pública VAPID ausente.');
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Solicita/Verifica permissão
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        alert('Para receber alertas, você precisa permitir as notificações no seu navegador.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // 2. Tenta obter inscrição existente
      let subscription = await registration.pushManager.getSubscription();
      
      // 3. Se não existe ou se as chaves mudaram, cria uma nova
      if (!subscription) {
        // Converte a chave VAPID base64 para Uint8Array
        const padding = '='.repeat((4 - (VAPID_PUBLIC_KEY.length % 4)) % 4);
        const base64 = (VAPID_PUBLIC_KEY + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });
      }

      // 4. Envia para o backend (sempre tenta sincronizar)
      try {
        await api.post('/notifications/subscribe', subscription.toJSON());
        setIsSubscribed(true);
        alert('Notificações ativadas e sincronizadas com sucesso!');
        return true;
      } catch (apiError: any) {
        console.error('Erro na API ao salvar inscrição:', apiError);
        const errorData = apiError.response?.data;
        const msg = errorData?.error?.description || errorData?.message || 'Erro ao salvar inscrição no servidor.';
        alert(`O navegador autorizou, mas o servidor retornou erro: ${msg}`);
        return false;
      }
    } catch (error: any) {
      console.error('Erro detalhado ao inscrever para push:', error);
      alert('Erro técnico ao ativar notificações. Por favor, recarregue a página e tente novamente.');
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
