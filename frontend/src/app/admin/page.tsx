'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ArrowLeft, UserCheck, FileWarning, Trash2, Settings, Server, Database, Info, Sparkles } from 'lucide-react';
import Link from 'next/link';
import styles from './admin.module.css';
import Header from '@/components/common/Header';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { toDateTimeLocal } from '@/lib/dateUtils';

interface PendingUser {
  id: number | null;
  googleId: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  status: string;
}

interface SystemInfo {
  app_version: string;
  app_build: number;
  app_date: string;
  php_version: string;
  db_status: string;
  ai_status: string;
  server_software: string;
  os: string;
  debug_mode: boolean;
  test_tokens: boolean;
  max_upload_size: string;
  post_max_size: string;
  memory_limit: string;
}

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [orphanedFiles, setOrphanedFiles] = useState<string[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

  const fetchAdminData = async () => {
    try {
      setIsFetching(true);
      const [usersRes, filesRes, infoRes] = await Promise.all([
        api.get('/users/admin/pending'),
        api.get('/users/admin/attachments/orphaned'),
        api.get('/users/admin/system-info')
      ]);
      setPendingUsers(usersRes.data.data || []);
      setOrphanedFiles(filesRes.data.data || []);
      setSystemInfo(infoRes.data.data || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Erro ao carregar dados administrativos.');
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!user.isAdmin) {
        router.push('/');
      } else {
        fetchAdminData();
      }
    }
  }, [user, isLoading, router]);

  const handleApprove = async (googleId: string) => {
    try {
      setActionLoading(googleId);
      await api.post(`/users/admin/${googleId}/approve`, { status: 'active' });
      setPendingUsers(prev => prev.filter(u => u.googleId !== googleId));
    } catch (err) {
      console.error('Error approving user:', err);
      alert('Erro ao aprovar usuário.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrphaned = (filename: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Excluir arquivo órfão',
      message: 'Tem certeza que deseja excluir este arquivo permanentemente?',
      onConfirm: async () => {
        try {
          setActionLoading(filename);
          await api.delete(`/users/admin/attachments/orphaned/${filename}`);
          setOrphanedFiles(prev => prev.filter(f => f !== filename));
        } catch (err) {
          alert('Erro ao excluir arquivo.');
        } finally {
          setActionLoading(null);
          setModalConfig(null);
        }
      }
    });
  };

  if (isLoading || isFetching) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.backButton}>
            <ArrowLeft size={18} /> Voltar ao Dashboard
          </Link>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>Painel Administrativo</h1>
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {systemInfo && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Settings size={20} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Informações do Sistema
            </h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}><Info size={20} /></div>
                <div className={styles.infoContent}>
                  <label>Aplicação</label>
                  <p>v{systemInfo.app_version} (Build {systemInfo.app_build})</p>
                  <small>Último deploy: {toDateTimeLocal(new Date(systemInfo.app_date)).replace('T', ' ')}</small>
                </div>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}><Server size={20} /></div>
                <div className={styles.infoContent}>
                  <label>Servidor</label>
                  <p>PHP {systemInfo.php_version}</p>
                  <small>{systemInfo.os} - {systemInfo.server_software}</small>
                </div>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}><Database size={20} /></div>
                <div className={styles.infoContent}>
                  <label>Banco de Dados</label>
                  <p className={systemInfo.db_status === 'Conectado' ? styles.statusOk : styles.statusError}>
                    {systemInfo.db_status}
                  </p>
                </div>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}><Sparkles size={20} /></div>
                <div className={styles.infoContent}>
                  <label>Inteligência Artificial</label>
                  <p className={systemInfo.ai_status === 'Conectado' ? styles.statusOk : styles.statusError}>
                    {systemInfo.ai_status}
                  </p>
                </div>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}><Settings size={20} /></div>
                <div className={styles.infoContent}>
                  <label>Limites PHP</label>
                  <p>Upload: {systemInfo.max_upload_size}</p>
                  <small>Memória: {systemInfo.memory_limit}</small>
                </div>
              </div>
            </div>
            <div className={styles.securityBadges}>
               <span className={`${styles.badge} ${systemInfo.debug_mode ? styles.badgeWarning : styles.badgeSuccess}`}>
                 Debug: {systemInfo.debug_mode ? 'Ativado' : 'Desativado'}
               </span>
               <span className={`${styles.badge} ${systemInfo.test_tokens ? styles.badgeWarning : styles.badgeSuccess}`}>
                 Test Tokens: {systemInfo.test_tokens ? 'Ativado' : 'Desativado'}
               </span>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Usuários Aguardando Aprovação</h2>
          
          {pendingUsers.length === 0 ? (
            <div className={styles.noUsers}>Nenhum usuário pendente no momento.</div>
          ) : (
            <div className={styles.userList}>
              {pendingUsers.map(u => (
                <div key={u.googleId} className={styles.userCard}>
                  <div className={styles.userInfo}>
                    <div className={styles.userAvatar}>
                      <UserCheck size={20} />
                    </div>
                    <div className={styles.userDetails}>
                      <h3>{u.name || 'Sem Nome'}</h3>
                      <p>{u.email}</p>
                      <p><small>ID: {u.googleId}</small></p>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button 
                      className={styles.approveButton}
                      onClick={() => handleApprove(u.googleId)}
                      disabled={actionLoading === u.googleId}
                    >
                      {actionLoading === u.googleId ? 'Aprovando...' : 'Aprovar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section} style={{ marginTop: '2rem' }}>
          <h2 className={styles.sectionTitle}>Limpeza de Arquivos Órfãos</h2>
          {orphanedFiles.length === 0 ? (
            <p>Nenhum arquivo órfão encontrado.</p>
          ) : (
            <div className={styles.userList}>
              {orphanedFiles.map(f => (
                <div key={f} className={styles.userCard}>
                  <div className={styles.userInfo}>
                    <FileWarning size={20} color="#d97706" />
                    <span>{f}</span>
                  </div>
                  <button className={styles.deleteButton} onClick={() => handleDeleteOrphaned(f)} disabled={actionLoading === f}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {modalConfig && (
          <ConfirmationModal 
            isOpen={modalConfig.isOpen}
            title={modalConfig.title}
            message={modalConfig.message}
            onConfirm={modalConfig.onConfirm}
            onCancel={() => setModalConfig(null)}
          />
        )}
      </main>
    </div>
  );
}
