import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Crown,
  Users,
  Shield,
  Key,
  CreditCard,
  Bell,
  Settings,
  Search,
  Lock,
  RefreshCw,
  AlertTriangle,
  Send,
  Eye,
  Activity,
  X,
  CheckCircle2,
  XCircle,
  Wallet,
  Copy,
  PlusCircle,
  FileText,
  LogOut
} from 'lucide-react';
import { isUserOwner as checkIsOwner, isUserAdmin as checkIsAdmin, UserRoleBadge } from './UserRoleBadge.tsx';
import DiamondPlusIcon from './DiamondPlusIcon.tsx';

interface OwnerDashboardModalProps {
  onClose: () => void;
  currentUser?: any;
}

export type DashboardSection =
  | 'topup_pending'
  | 'saldo_owner'
  | 'ringkasan'
  | 'manajemen_key'
  | 'manajemen_vip'
  | 'manajemen_pengguna'
  | 'pengumuman'
  | 'riwayat_aktivitas'
  | 'pengaturan';

export function OwnerDashboardModal({ onClose, currentUser }: OwnerDashboardModalProps) {
  const isOwnerIdentity = checkIsOwner(currentUser);
  const isAdminIdentity = !isOwnerIdentity && checkIsAdmin(currentUser);

  const [ownerToken, setOwnerToken] = useState<string>(() => localStorage.getItem('ze_owner_token') || '');
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifiedOwner, setIsVerifiedOwner] = useState<boolean>(false);

  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Default to prioritized TOP UP PENDING section
  const [activeSection, setActiveSection] = useState<DashboardSection>('topup_pending');

  // Stats & Core Data
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    onlineUsers: 0,
    vipUsers: 0,
    adminUsers: 0,
    pendingApprovalCount: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [keysList, setKeysList] = useState<any[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Financial Ledger Data (Rp7.800.970 opening balance)
  const [ownerFinance, setOwnerFinance] = useState<{
    balance: number;
    totalRevenue: number;
    ledger: any[];
  }>({
    balance: 7800970,
    totalRevenue: 7800970,
    ledger: []
  });
  const [isFinanceLoading, setIsFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);

  // Proof image zoom & confirmation dialogs
  const [inspectProofImage, setInspectProofImage] = useState<string | null>(null);
  const [approveConfirmOrder, setApproveConfirmOrder] = useState<any | null>(null);
  const [rejectModalOrder, setRejectModalOrder] = useState<any | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const paymentLockRef = useRef<boolean>(false);

  // Top Up Filter Tab in 'topup_pending'
  const [topupFilter, setTopupFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  // Key Generation State
  const [genKeyType, setGenKeyType] = useState<'1day' | '1hour' | '2days' | '1week' | '1month' | 'permanent'>('1month');
  const [genKeyCount, setGenKeyCount] = useState<number>(1);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [revokeKeyTarget, setRevokeKeyTarget] = useState<string | null>(null);

  // VIP Grant State
  const [vipSearchQuery, setVipSearchQuery] = useState('');
  const [vipDurationMonths, setVipDurationMonths] = useState<number>(2);
  const [vipLevelSelect, setVipLevelSelect] = useState<'basic' | 'exclusive'>('basic');
  const [isGrantingVip, setIsGrantingVip] = useState(false);
  const [revokeVipTarget, setRevokeVipTarget] = useState<any | null>(null);

  // User Management State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [adminRoleModalTarget, setAdminRoleModalTarget] = useState<any | null>(null);
  const [suspendModalTarget, setSuspendModalTarget] = useState<any | null>(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');

  // Global Notification State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifCategory, setNotifCategory] = useState<string>('PENGUMUMAN');
  const [isSendingNotif, setIsSendingNotif] = useState(false);

  // Change Password State
  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3400);
  }, []);

  const copyToClipboard = (text: string, label = 'Teks') => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast(`${label} disalin ke clipboard!`, 'success');
    } catch {
      showToast('Gagal menyalin teks', 'error');
    }
  };

  const buildAuthHeaders = useCallback(
    (tokenOverride?: string): Record<string, string> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      const tok = tokenOverride !== undefined ? tokenOverride : ownerToken;
      if (tok) {
        headers['Authorization'] = `Bearer ${tok}`;
      }
      if (currentUser?.id) {
        headers['x-ze-actor-id'] = String(currentUser.id);
      }
      return headers;
    },
    [ownerToken, currentUser?.id]
  );

  // Verify server-side session authority on open
  useEffect(() => {
    let cancelled = false;
    const verifyAuthority = async () => {
      setIsCheckingSession(true);
      try {
        const res = await fetch('/api/owner/session', {
          headers: buildAuthHeaders()
        });
        const data = await res.json();
        if (cancelled) return;
        if (data?.isOwner) {
          setIsVerifiedOwner(true);
          setIsAuthenticated(true);
        } else if (data?.isAdmin && isAdminIdentity) {
          setIsVerifiedOwner(false);
          setIsAuthenticated(true);
        } else {
          setIsVerifiedOwner(false);
          setIsAuthenticated(false);
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) setIsCheckingSession(false);
      }
    };
    verifyAuthority();
    return () => {
      cancelled = true;
    };
  }, [buildAuthHeaders, isAdminIdentity]);

  // Load Financial Ledger (strictly OWNER only)
  const loadOwnerFinance = useCallback(async () => {
    if (!isVerifiedOwner) return;
    setIsFinanceLoading(true);
    setFinanceError(null);
    try {
      const res = await fetch('/api/owner/balance', {
        headers: buildAuthHeaders()
      });
      if (res.status === 403) {
        setFinanceError('Akses Ditolak: Saldo kas Owner hanya dapat diakses oleh Akun Owner resmi.');
        return;
      }
      const data = await res.json();
      if (data?.success) {
        setOwnerFinance({
          balance: data.balance ?? 7800970,
          totalRevenue: data.totalRevenue ?? 7800970,
          ledger: data.ledger || []
        });
      } else {
        setFinanceError(data?.error || 'Gagal memuat saldo kas Owner');
      }
    } catch {
      setFinanceError('Gagal memuat saldo');
    } finally {
      setIsFinanceLoading(false);
    }
  }, [isVerifiedOwner, buildAuthHeaders]);

  const loadDashboardData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const headers = buildAuthHeaders();
      const [dashRes, usersRes, keysRes, payRes, notifRes] = await Promise.all([
        fetch('/api/owner/dashboard', { headers }),
        fetch('/api/owner/users', { headers }),
        fetch('/api/owner/keys', { headers }),
        fetch('/api/owner/payments', { headers }),
        fetch('/api/owner/notifications/history', { headers })
      ]);

      if (dashRes.status === 403) {
        setIsAuthenticated(false);
        showToast('Sesi akses tidak valid atau telah dicabut.', 'error');
        return;
      }

      const [dashData, usersData, keysData, payData, notifData] = await Promise.all([
        dashRes.json(),
        usersRes.json(),
        keysRes.json(),
        payRes.json(),
        notifRes.json()
      ]);

      if (dashData?.success) {
        setStats(dashData.stats);
        setRecentActivities(dashData.recentActivities || []);
      }
      if (usersData?.success) {
        setUsersList(usersData.users || []);
      }
      if (keysData?.success) {
        setKeysList(keysData.keys || []);
      }
      if (payData?.success) {
        setTransactions(payData.transactions || []);
      }
      if (notifData?.success) {
        setNotificationHistory(notifData.history || []);
      }
    } catch {
      showToast('Gagal memuat beberapa data dashboard', 'error');
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated, buildAuthHeaders, showToast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  useEffect(() => {
    if (isAuthenticated && activeSection === 'saldo_owner') {
      loadOwnerFinance();
    }
  }, [isAuthenticated, activeSection, loadOwnerFinance]);

  // Realtime updates via SSE
  useEffect(() => {
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource('/api/events');
      evtSource.addEventListener('owner-order-updated', () => {
        loadDashboardData();
        if (activeSection === 'saldo_owner') {
          loadOwnerFinance();
        }
      });
      evtSource.addEventListener('user-notification', (e: any) => {
        try {
          const data = JSON.parse(e.data);
          if (data.userId === 'ZE-OWNER') {
            showToast(data.notification?.title || 'Notifikasi baru masuk!', 'success');
            loadDashboardData();
          }
        } catch {}
      });
    } catch {}
    return () => {
      evtSource?.close();
    };
  }, [loadDashboardData, loadOwnerFinance, activeSection, showToast]);

  // Login Handler (Master Password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const res = await fetch('/api/owner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: passwordInput.trim(),
          userId: currentUser?.id
        })
      });
      const data = await res.json();
      if (data?.success && data.token) {
        localStorage.setItem('ze_owner_token', data.token);
        setOwnerToken(data.token);
        setIsVerifiedOwner(true);
        setIsAuthenticated(true);
        setPasswordInput('');
        showToast('Autentikasi Owner Berhasil. Panel aktif sepenuhnya.');
      } else {
        setAuthError(data?.message || 'Kata sandi master salah. Akses ditolak.');
      }
    } catch {
      setAuthError('Gagal menghubungi server verifikasi');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutOwner = () => {
    localStorage.removeItem('ze_owner_token');
    setOwnerToken('');
    setIsVerifiedOwner(false);
    setIsAuthenticated(false);
    onClose();
  };

  // Top Up Approval (ACC) Handler
  const handleApproveTopup = async (order: any) => {
    if (!isVerifiedOwner) {
      showToast('Akses Ditolak: Hanya Akun Owner yang memiliki hak untuk ACC top up', 'error');
      return;
    }
    if (paymentLockRef.current) return;

    paymentLockRef.current = true;
    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/owner/payments/approve', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ orderId: order.orderId })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(
          `Top Up ${order.orderId} (Rp${order.amount?.toLocaleString('id-ID')}) BERHASIL DI-ACC! Saldo ditambahkan.`,
          'success'
        );
        setApproveConfirmOrder(null);
        await loadDashboardData();
        await loadOwnerFinance();
      } else {
        showToast(data?.message || 'Gagal menyetujui pengajuan top up', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan koneksi saat memproses ACC', 'error');
    } finally {
      paymentLockRef.current = false;
      setIsProcessingAction(false);
    }
  };

  // Top Up Rejection (TOLAK) Handler
  const handleRejectTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerifiedOwner) {
      showToast('Akses Ditolak: Hanya Akun Owner yang memiliki hak untuk menolak top up', 'error');
      return;
    }
    if (!rejectModalOrder || paymentLockRef.current) return;
    if (!rejectReasonInput.trim()) {
      showToast('Alasan penolakan wajib diisi agar pengguna memahami kendala transfer', 'error');
      return;
    }

    paymentLockRef.current = true;
    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/owner/payments/reject', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          orderId: rejectModalOrder.orderId,
          reason: rejectReasonInput.trim()
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(`Pengajuan ${rejectModalOrder.orderId} telah DITOLAK.`, 'success');
        setRejectModalOrder(null);
        setRejectReasonInput('');
        await loadDashboardData();
      } else {
        showToast(data?.message || 'Gagal menolak pengajuan', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan koneksi saat menolak pengajuan', 'error');
    } finally {
      paymentLockRef.current = false;
      setIsProcessingAction(false);
    }
  };

  // Key Generation
  const handleGenerateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerifiedOwner) {
      showToast('Hanya Owner yang dapat mencetak Key secara manual', 'error');
      return;
    }
    setIsGeneratingKey(true);
    try {
      const res = await fetch('/api/owner/keys/generate', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          type: genKeyType,
          count: genKeyCount,
          userName: 'Owner Manual Generate'
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(`Berhasil mencetak ${data.keys?.length || 1} Key baru!`, 'success');
        await loadDashboardData();
      } else {
        showToast(data?.message || 'Gagal mencetak Key', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan saat mencetak Key', 'error');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Key Revocation
  const handleRevokeKey = async (keyStr: string) => {
    if (!isVerifiedOwner) return;
    try {
      const res = await fetch('/api/owner/keys/revoke', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ key: keyStr })
      });
      const data = await res.json();
      if (data?.success) {
        showToast('Key berhasil dicabut!', 'success');
        setRevokeKeyTarget(null);
        await loadDashboardData();
      } else {
        showToast(data?.message || 'Gagal mencabut Key', 'error');
      }
    } catch {
      showToast('Gagal mencabut Key', 'error');
    }
  };

  // Grant VIP
  const handleGrantVip = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = vipSearchQuery.trim();
    if (!cleanQuery) {
      showToast('Masukkan ID atau username pengguna', 'error');
      return;
    }

    setIsGrantingVip(true);
    try {
      const res = await fetch('/api/owner/vip/grant', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          targetUserId: cleanQuery,
          level: vipLevelSelect,
          durationDays: vipDurationMonths * 30
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(`Status VIP ${vipLevelSelect.toUpperCase()} diberikan ke ${cleanQuery}!`, 'success');
        setVipSearchQuery('');
        await loadDashboardData();
      } else {
        showToast(data?.message || 'Gagal memberikan status VIP', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan saat memberikan VIP', 'error');
    } finally {
      setIsGrantingVip(false);
    }
  };

  // Revoke VIP
  const handleRevokeVip = async (userId: string) => {
    try {
      const res = await fetch('/api/owner/vip/revoke', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ targetUserId: userId })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(`Status VIP dicabut dari ${userId}`, 'success');
        setRevokeVipTarget(null);
        await loadDashboardData();
      } else {
        showToast(data?.message || 'Gagal mencabut VIP', 'error');
      }
    } catch {
      showToast('Gagal mencabut VIP', 'error');
    }
  };

  // Promote / Demote Admin
  const handleToggleAdminRole = async (targetUser: any, promote: boolean) => {
    try {
      const res = await fetch('/api/owner/users/role', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          targetUserId: targetUser.id,
          promote,
          permissions: ['manage_chats', 'moderate_posts', 'manage_keys']
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(data.message || 'Perubahan peran admin berhasil disimpan', 'success');
        setAdminRoleModalTarget(null);
        await loadDashboardData();
      } else {
        showToast(data?.message || 'Gagal mengubah peran admin', 'error');
      }
    } catch {
      showToast('Gagal mengubah peran admin', 'error');
    }
  };

  // Suspend / Unsuspend User
  const handleToggleSuspendUser = async (targetUser: any, suspend: boolean) => {
    try {
      const res = await fetch('/api/owner/users/suspend', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          targetUserId: targetUser.id,
          suspend,
          reason: suspendReasonInput.trim() || 'Pelanggaran ketentuan komunitas ZE.io'
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast(data.message || 'Status penangguhan pengguna diperbarui', 'success');
        setSuspendModalTarget(null);
        setSuspendReasonInput('');
        await loadDashboardData();
      } else {
        showToast(data?.message || 'Gagal mengubah status penangguhan', 'error');
      }
    } catch {
      showToast('Gagal memperbarui status penangguhan', 'error');
    }
  };

  // Broadcast Notification
  const handleBroadcastNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast('Judul dan pesan pengumuman wajib diisi', 'error');
      return;
    }

    setIsSendingNotif(true);
    try {
      const res = await fetch('/api/owner/notifications/send', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          title: notifTitle.trim(),
          message: notifMessage.trim(),
          category: notifCategory
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast('Pengumuman global berhasil disiarkan!', 'success');
        setNotifTitle('');
        setNotifMessage('');
        await loadDashboardData();
      } else {
        showToast(data?.message || 'Gagal mengirim pengumuman', 'error');
      }
    } catch {
      showToast('Gagal mengirim pengumuman', 'error');
    } finally {
      setIsSendingNotif(false);
    }
  };

  // Change Owner Password
  const handleChangeOwnerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currPassword || !newPassword) {
      showToast('Lengkapi kedua kolom kata sandi', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Kata sandi baru minimal 6 karakter', 'error');
      return;
    }

    setIsUpdatingPass(true);
    try {
      const res = await fetch('/api/owner/change-password', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({
          currentPassword: currPassword,
          newPassword: newPassword
        })
      });
      const data = await res.json();
      if (data?.success) {
        showToast('Kata sandi master Owner berhasil diubah!', 'success');
        setCurrPassword('');
        setNewPassword('');
      } else {
        showToast(data?.message || 'Kata sandi saat ini salah', 'error');
      }
    } catch {
      showToast('Gagal memperbarui kata sandi', 'error');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  // Top Up Transactions calculation
  const topupTransactions = transactions.filter((t) => t.purchaseType === 'topup');
  const pendingTopups = topupTransactions.filter(
    (t) =>
      t.status === 'WAITING_OWNER_APPROVAL' ||
      t.status === 'WAITING_PROOF' ||
      t.status === 'WAITING_PAYMENT' ||
      t.status === 'PENDING'
  );
  const approvedTopups = topupTransactions.filter((t) => t.status === 'APPROVED' || t.status === 'paid');
  const rejectedTopups = topupTransactions.filter((t) => t.status === 'REJECTED');
  const totalApprovedNominal = approvedTopups.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const displayedTopups =
    topupFilter === 'pending'
      ? pendingTopups
      : topupFilter === 'approved'
      ? approvedTopups
      : topupFilter === 'rejected'
      ? rejectedTopups
      : topupTransactions;

  // Filtered Users
  const filteredUsers = (usersList || []).filter((u) => {
    if (!userSearchTerm) return true;
    const term = userSearchTerm.toLowerCase();
    return (
      String(u.id || '').toLowerCase().includes(term) ||
      String(u.name || '').toLowerCase().includes(term) ||
      String(u.username || '').toLowerCase().includes(term)
    );
  });

  // Filtered VIP Users
  const vipUsersList = (usersList || []).filter((u) => u.vip || u.isVip);

  // 1. CHECKING SESSION (Full-Screen Transparent Android View)
  if (isCheckingSession) {
    return (
      <div className="fixed inset-0 z-[135] w-screen h-[100dvh] ze-transparent-page bg-transparent flex items-center justify-center text-white select-none">
        <div className="pointer-events-none fixed inset-0 z-0 shadow-[inset_0_0_85px_rgba(0,0,0,0.94),inset_0_0_28px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-white/12" />
        <div
          className="relative z-10 px-6 py-5 rounded-3xl bg-black/35 border border-white/18 shadow-[0_16px_44px_rgba(0,0,0,0.88)] flex flex-col items-center gap-3"
          style={{
            backdropFilter: 'blur(14px) saturate(160%)',
            WebkitBackdropFilter: 'blur(14px) saturate(160%)'
          }}
        >
          <RefreshCw size={22} className="animate-spin text-white" />
          <span className="text-xs font-extrabold tracking-wider text-zinc-200 uppercase">
            Memeriksa Otoritas Owner...
          </span>
        </div>
      </div>
    );
  }

  // 2. LOGIN GATE (Full-Screen Transparent Android View — No Floating Window)
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[135] w-screen h-[100dvh] ze-transparent-page bg-transparent flex flex-col text-white overflow-hidden select-none">
        <div className="pointer-events-none fixed inset-0 z-0 shadow-[inset_0_0_85px_rgba(0,0,0,0.94),inset_0_0_28px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-white/12" />

        {/* Full-Width Top Bar */}
        <div
          className="relative z-10 w-full px-3.5 py-3 border-b border-white/15 bg-black/28 flex items-center justify-between gap-2 shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.75)]"
          style={{
            backdropFilter: 'blur(14px) saturate(160%)',
            WebkitBackdropFilter: 'blur(14px) saturate(160%)'
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-black/35 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-90 transition shrink-0 shadow-md"
              title="Kembali"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Shield size={16} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase leading-tight truncate">
                MENU OWNER RESMI
              </h1>
              <p className="text-[10px] text-zinc-300 leading-tight truncate">
                Verifikasi Kredensial Master
              </p>
            </div>
          </div>
        </div>

        {/* Centered Vertical Android Login Card */}
        <div className="relative z-10 flex-1 w-full overflow-y-auto px-4 py-8 flex flex-col justify-center">
          <div
            className="w-full p-5 rounded-3xl bg-black/32 border border-white/18 shadow-[0_18px_48px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.16)] flex flex-col gap-4"
            style={{
              backdropFilter: 'blur(16px) saturate(165%)',
              WebkitBackdropFilter: 'blur(16px) saturate(165%)'
            }}
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Akses Panel Kontrol Master
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Masukkan kata sandi master untuk membuka seluruh kendali Owner ZE.io.
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
                  Kata Sandi Master
                </label>
                <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-black/50 border border-white/20">
                  <Lock size={15} className="text-zinc-300 shrink-0" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Ketik kata sandi master..."
                    className="w-full bg-transparent text-white placeholder-zinc-400 text-sm focus:outline-none min-w-0"
                    autoFocus
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200 flex items-start gap-2">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-300" />
                  <span className="leading-snug">{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn || !passwordInput.trim()}
                className="w-full py-3.5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw size={14} className="animate-spin shrink-0" />
                    <span>Mengautentikasi...</span>
                  </>
                ) : (
                  <span>Buka Menu Owner</span>
                )}
              </button>
            </form>

            <p className="text-[10px] text-zinc-300 text-center leading-relaxed">
              Seluruh aktivitas akses panel dicatat otomatis pada audit log server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 3. MAIN FULL-SCREEN TRANSPARENT ANDROID OWNER MENU
  return (
    <div className="fixed inset-0 z-[135] w-screen h-[100dvh] ze-transparent-page bg-transparent flex flex-col text-white overflow-hidden select-none">
      {/* Transparent Corner & Edge Vignette Shadow Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 shadow-[inset_0_0_85px_rgba(0,0,0,0.94),inset_0_0_28px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-white/12" />

      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 left-3 right-3 z-[170] mx-auto max-w-sm px-4 py-2.5 rounded-2xl text-xs font-bold border shadow-[0_14px_38px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all text-center break-words ${
            toast.type === 'success'
              ? 'bg-emerald-950/85 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-950/85 text-rose-300 border-rose-500/40'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* FULL-WIDTH ANDROID HEADER BAR (Transparent with Edge Shadow, Zero Collision) */}
      <div
        className="relative z-10 w-full px-3.5 py-3 border-b border-white/15 bg-black/28 flex items-center justify-between gap-2 shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.75),inset_0_-1px_0_rgba(255,255,255,0.1)]"
        style={{
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)'
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-black/35 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-90 transition shrink-0 shadow-md"
            title="Kembali"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-md">
            <Crown size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                MENU OWNER
              </h1>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wider bg-white text-black uppercase shrink-0 whitespace-nowrap">
                {isVerifiedOwner ? 'OWNER' : 'ADMIN'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-300 leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              Kontrol Sistem, Kas &amp; Lisensi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isVerifiedOwner && (
            <div className="px-2 py-1.5 rounded-xl bg-black/40 border border-amber-400/35 flex items-center gap-1 shadow-sm">
              <DiamondPlusIcon size={12} />
              <span className="text-[10px] font-black text-amber-300 tracking-tight">UNLIMITED</span>
            </div>
          )}
          <button
            onClick={loadDashboardData}
            className="w-9 h-9 rounded-2xl bg-black/35 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-90 transition shadow-md"
            title="Segarkan Data"
          >
            <RefreshCw size={15} className={isLoadingData ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleLogoutOwner}
            className="w-9 h-9 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-300 cursor-pointer active:scale-90 transition shadow-md"
            title="Keluar Sesi Owner"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* HORIZONTAL ANDROID NAVIGATION PILLS (Smooth Touch Swipe) */}
      <div
        className="relative z-10 w-full px-3 py-2.5 border-b border-white/12 bg-black/22 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0"
        style={{
          backdropFilter: 'blur(12px) saturate(150%)',
          WebkitBackdropFilter: 'blur(12px) saturate(150%)'
        }}
      >
        <button
          onClick={() => setActiveSection('topup_pending')}
          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-wide whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSection === 'topup_pending'
              ? 'bg-white text-black shadow-md'
              : 'bg-black/30 text-zinc-200 border border-white/12'
          }`}
        >
          <CreditCard size={13} />
          <span>TOP UP PENDING</span>
          {pendingTopups.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none ${
                activeSection === 'topup_pending' ? 'bg-black text-white' : 'bg-emerald-500 text-black'
              }`}
            >
              {pendingTopups.length}
            </span>
          )}
        </button>

        {isVerifiedOwner && (
          <button
            onClick={() => setActiveSection('saldo_owner')}
            className={`px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-wide whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeSection === 'saldo_owner'
                ? 'bg-white text-black shadow-md'
                : 'bg-black/30 text-zinc-200 border border-white/12'
            }`}
          >
            <Wallet size={13} />
            <span>SALDO OWNER</span>
          </button>
        )}

        <button
          onClick={() => setActiveSection('ringkasan')}
          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-wide whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSection === 'ringkasan'
              ? 'bg-white text-black shadow-md'
              : 'bg-black/30 text-zinc-200 border border-white/12'
          }`}
        >
          <Activity size={13} />
          <span>RINGKASAN</span>
        </button>

        <button
          onClick={() => setActiveSection('manajemen_key')}
          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-wide whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSection === 'manajemen_key'
              ? 'bg-white text-black shadow-md'
              : 'bg-black/30 text-zinc-200 border border-white/12'
          }`}
        >
          <Key size={13} />
          <span>KEY AKSES</span>
        </button>

        <button
          onClick={() => setActiveSection('manajemen_vip')}
          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-wide whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSection === 'manajemen_vip'
              ? 'bg-white text-black shadow-md'
              : 'bg-black/30 text-zinc-200 border border-white/12'
          }`}
        >
          <Crown size={13} />
          <span>AKUN VIP</span>
        </button>

        <button
          onClick={() => setActiveSection('manajemen_pengguna')}
          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-wide whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSection === 'manajemen_pengguna'
              ? 'bg-white text-black shadow-md'
              : 'bg-black/30 text-zinc-200 border border-white/12'
          }`}
        >
          <Users size={13} />
          <span>PENGGUNA</span>
        </button>

        <button
          onClick={() => setActiveSection('pengumuman')}
          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-wide whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSection === 'pengumuman'
              ? 'bg-white text-black shadow-md'
              : 'bg-black/30 text-zinc-200 border border-white/12'
          }`}
        >
          <Bell size={13} />
          <span>PENGUMUMAN</span>
        </button>

        <button
          onClick={() => setActiveSection('riwayat_aktivitas')}
          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-wide whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSection === 'riwayat_aktivitas'
              ? 'bg-white text-black shadow-md'
              : 'bg-black/30 text-zinc-200 border border-white/12'
          }`}
        >
          <FileText size={13} />
          <span>AUDIT LOG</span>
        </button>

        <button
          onClick={() => setActiveSection('pengaturan')}
          className={`px-3 py-2 rounded-xl text-[11px] font-extrabold tracking-wide whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeSection === 'pengaturan'
              ? 'bg-white text-black shadow-md'
              : 'bg-black/30 text-zinc-200 border border-white/12'
          }`}
        >
          <Settings size={13} />
          <span>KEAMANAN</span>
        </button>
      </div>

      {/* SCROLLABLE FULL-SCREEN ANDROID VIEWPORT — Semua Berderet Rapi ke Bawah */}
      <div className="relative z-10 flex-1 w-full overflow-y-auto overflow-x-hidden px-3.5 py-4 pb-10 flex flex-col gap-4">
        {/* ========================================================================= */}
        {/* SECTION 1: TOP UP PENDING (VERIFIKASI & ACC OWNER)                        */}
        {/* ========================================================================= */}
        {activeSection === 'topup_pending' && (
          <div className="flex flex-col gap-4">
            <div className="px-1 flex flex-col gap-1">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Verifikasi &amp; ACC Top Up Saldo
              </h2>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Tinjau bukti transfer dan setujui (ACC) atau tolak pengajuan saldo Diamond+ pengguna.
              </p>
            </div>

            {/* Horizontal Sub-filters (No wrapping chaos on Android) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <button
                onClick={() => setTopupFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                  topupFilter === 'pending'
                    ? 'bg-white text-black shadow'
                    : 'bg-black/35 text-zinc-200 border border-white/14'
                }`}
              >
                Menunggu ACC ({pendingTopups.length})
              </button>
              <button
                onClick={() => setTopupFilter('approved')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                  topupFilter === 'approved'
                    ? 'bg-white text-black shadow'
                    : 'bg-black/35 text-zinc-200 border border-white/14'
                }`}
              >
                Disetujui ({approvedTopups.length})
              </button>
              <button
                onClick={() => setTopupFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                  topupFilter === 'rejected'
                    ? 'bg-white text-black shadow'
                    : 'bg-black/35 text-zinc-200 border border-white/14'
                }`}
              >
                Ditolak ({rejectedTopups.length})
              </button>
              <button
                onClick={() => setTopupFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                  topupFilter === 'all'
                    ? 'bg-white text-black shadow'
                    : 'bg-black/35 text-zinc-200 border border-white/14'
                }`}
              >
                Semua ({topupTransactions.length})
              </button>
            </div>

            {/* Vertical/2-Col Android Metric Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div
                className="p-3.5 rounded-2xl bg-black/28 border border-white/16 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.14)] flex flex-col gap-1"
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <span className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">
                  Menunggu ACC
                </span>
                <span className="text-xl font-black text-white">{pendingTopups.length}</span>
              </div>

              <div
                className="p-3.5 rounded-2xl bg-black/28 border border-white/16 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.14)] flex flex-col gap-1"
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <span className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">
                  Total Disetujui
                </span>
                <span className="text-xl font-black text-emerald-300">{approvedTopups.length}</span>
              </div>

              <div
                className="col-span-2 p-3.5 rounded-2xl bg-black/28 border border-white/16 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.14)] flex items-center justify-between gap-2"
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <span className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">
                  Nominal Terverifikasi
                </span>
                <span className="text-base font-black text-white font-mono">
                  Rp{totalApprovedNominal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Stacked Top Up Request Cards */}
            {displayedTopups.length === 0 ? (
              <div
                className="w-full py-12 px-4 text-center rounded-3xl bg-black/28 border border-white/15 shadow-[0_12px_34px_rgba(0,0,0,0.78)] flex flex-col items-center gap-2"
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <CreditCard size={28} className="text-zinc-300 opacity-75" />
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {topupFilter === 'pending'
                    ? 'Tidak ada pengajuan top up yang menunggu verifikasi saat ini.'
                    : 'Belum ada transaksi pada kategori ini.'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayedTopups.map((tx) => {
                  const isPending =
                    tx.status === 'WAITING_OWNER_APPROVAL' ||
                    tx.status === 'WAITING_PROOF' ||
                    tx.status === 'WAITING_PAYMENT' ||
                    tx.status === 'PENDING';
                  const isApproved = tx.status === 'APPROVED' || tx.status === 'paid';
                  const isRejected = tx.status === 'REJECTED';
                  const hasProof = Boolean(tx.proofImageUrl);

                  return (
                    <div
                      key={tx.orderId}
                      className="w-full p-4 rounded-3xl bg-black/30 border border-white/16 shadow-[0_14px_36px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col gap-3"
                      style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {hasProof ? (
                          <div
                            onClick={() => setInspectProofImage(tx.proofImageUrl)}
                            className="w-16 h-16 rounded-2xl bg-black/60 border border-white/25 overflow-hidden cursor-pointer relative shrink-0 shadow-md"
                            title="Ketuk untuk lihat bukti transfer"
                          >
                            <img
                              src={tx.proofImageUrl}
                              alt="Bukti Transfer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                              <Eye size={15} className="text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-white/8 border border-white/15 flex flex-col items-center justify-center text-zinc-300 shrink-0 text-[9px] font-bold text-center px-1">
                            <CreditCard size={16} className="mb-0.5" />
                            <span>QRIS</span>
                          </div>
                        )}

                        <div className="min-w-0 flex-1 flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs font-black text-white truncate">
                              {tx.userName || 'Pengguna'}
                            </span>
                            <span className="text-sm font-black text-emerald-300 font-mono shrink-0">
                              Rp{Number(tx.amount || 0).toLocaleString('id-ID')}
                            </span>
                          </div>

                          <p className="text-[11px] font-mono text-zinc-300 break-all leading-tight">
                            {tx.orderId} • ID: {tx.userId}
                          </p>

                          <p className="text-[10px] text-zinc-400">
                            {new Date(tx.createdAt).toLocaleString('id-ID')}
                          </p>

                          {tx.proofNote && (
                            <p className="text-[11px] text-zinc-200 italic leading-snug pt-0.5">
                              "{tx.proofNote}"
                            </p>
                          )}

                          {isRejected && tx.rejectionReason && (
                            <p className="text-[11px] text-rose-300 leading-snug pt-0.5">
                              <strong>Alasan Tolak:</strong> {tx.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Full-Width Android Action Row */}
                      <div className="pt-2.5 border-t border-white/12">
                        {isPending ? (
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setRejectModalOrder(tx)}
                              className="py-2.5 rounded-2xl bg-rose-500/18 hover:bg-rose-500/28 border border-rose-500/35 text-rose-200 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <XCircle size={14} />
                              <span>TOLAK</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setApproveConfirmOrder(tx)}
                              className="py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95"
                            >
                              <CheckCircle2 size={14} />
                              <span>ACC TOP UP</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-300 uppercase font-bold">
                              Status Verifikasi
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                isApproved
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/35'
                              }`}
                            >
                              {tx.statusLabel || tx.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: SALDO OWNER & LEDGER TRANSAKSI (Stacked Mobile Cards)          */}
        {/* ========================================================================= */}
        {activeSection === 'saldo_owner' && (
          <div className="flex flex-col gap-4">
            <div className="px-1 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-xs font-black text-white uppercase tracking-wider">
                  Saldo Kas &amp; Ledger Owner
                </h2>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Buku kas pemasukan resmi ZE.io &amp; hak akses Unlimited Diamond+.
                </p>
              </div>
              <button
                onClick={loadOwnerFinance}
                className="px-3 py-1.5 rounded-xl bg-black/35 border border-white/20 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
              >
                <RefreshCw size={12} className={isFinanceLoading ? 'animate-spin' : ''} />
                <span>Segarkan</span>
              </button>
            </div>

            {financeError ? (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/35 text-xs text-rose-200">
                {financeError}
              </div>
            ) : (
              <>
                {/* Stacked Balance Cards */}
                <div className="flex flex-col gap-3">
                  <div
                    className="w-full p-4 rounded-3xl bg-black/32 border border-amber-400/35 shadow-[0_14px_38px_rgba(0,0,0,0.82),inset_0_0_22px_rgba(245,158,11,0.12)] flex items-center justify-between gap-3"
                    style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] uppercase tracking-widest text-amber-300 font-black flex items-center gap-1">
                        <Crown size={11} />
                        <span>Saldo Diamond+ Akun Owner</span>
                      </span>
                      <div className="flex items-center gap-1.5 text-xl font-black text-white">
                        <DiamondPlusIcon size={19} />
                        <span>UNLIMITED (∞)</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="w-full p-4 rounded-3xl bg-black/28 border border-white/16 shadow-[0_14px_38px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col gap-1"
                    style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
                  >
                    <span className="text-[10px] uppercase tracking-widest text-zinc-300 font-bold">
                      Saldo Kas Aktif Owner
                    </span>
                    <span className="text-2xl font-black text-white font-mono">
                      Rp{ownerFinance.balance.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-zinc-300">
                      Termasuk saldo awal pembukaan Rp7.800.970
                    </span>
                  </div>

                  <div
                    className="w-full p-4 rounded-3xl bg-black/28 border border-white/16 shadow-[0_14px_38px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col gap-1"
                    style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
                  >
                    <span className="text-[10px] uppercase tracking-widest text-zinc-300 font-bold">
                      Total Akumulasi Pemasukan
                    </span>
                    <span className="text-2xl font-black text-emerald-300 font-mono">
                      Rp{ownerFinance.totalRevenue.toLocaleString('id-ID')}
                    </span>
                    <span className="text-[11px] text-zinc-300">
                      Penjualan Key, paket VIP Pass &amp; Top Up terverifikasi
                    </span>
                  </div>
                </div>

                {/* Vertical Stacked Ledger Mutasi Cards (No cramped PC table!) */}
                <div className="flex flex-col gap-2.5">
                  <h3 className="px-1 text-[11px] font-black text-white uppercase tracking-wider">
                    Mutasi Buku Kas ({ownerFinance.ledger.length})
                  </h3>

                  {ownerFinance.ledger.length === 0 ? (
                    <div
                      className="py-10 px-4 text-center rounded-3xl bg-black/28 border border-white/15 text-xs text-zinc-300"
                      style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                    >
                      Belum ada mutasi tercatat pada buku kas.
                    </div>
                  ) : (
                    ownerFinance.ledger.map((entry) => (
                      <div
                        key={entry.id}
                        className="w-full p-3.5 rounded-2xl bg-black/28 border border-white/15 shadow-[0_10px_26px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col gap-1.5"
                        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-white/12 border border-white/15 text-[10px] font-bold text-white uppercase">
                            {entry.type}
                          </span>
                          <span className="text-xs font-black text-emerald-300 font-mono">
                            +Rp{Number(entry.amount || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-200 leading-snug break-words">
                          {entry.description}
                        </p>
                        <div className="pt-1.5 border-t border-white/10 flex items-center justify-between gap-2 text-[10px] text-zinc-300">
                          <span>
                            {new Date(entry.timestamp).toLocaleString('id-ID', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                          </span>
                          <span className="font-mono text-white font-bold">
                            Kas: Rp{Number(entry.balanceAfter || 0).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: RINGKASAN SISTEM                                               */}
        {/* ========================================================================= */}
        {activeSection === 'ringkasan' && (
          <div className="flex flex-col gap-4">
            <div className="px-1 flex flex-col gap-0.5">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Ringkasan Sistem &amp; Metrik
              </h2>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Statistik pengguna aktif, anggota VIP, dan aktivitas terbaru ZE.io.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div
                className="p-4 rounded-2xl bg-black/28 border border-white/16 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.14)] flex flex-col gap-1"
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <span className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">
                  Total Pengguna
                </span>
                <span className="text-2xl font-black text-white">{stats.totalUsers || 0}</span>
              </div>

              <div
                className="p-4 rounded-2xl bg-black/28 border border-white/16 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.14)] flex flex-col gap-1"
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <span className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">
                  Online Saat Ini
                </span>
                <span className="text-2xl font-black text-emerald-300">{stats.onlineUsers || 1}</span>
              </div>

              <div
                className="p-4 rounded-2xl bg-black/28 border border-white/16 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.14)] flex flex-col gap-1"
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <span className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">
                  Anggota VIP
                </span>
                <span className="text-2xl font-black text-amber-300">{vipUsersList.length}</span>
              </div>

              <div
                className="p-4 rounded-2xl bg-black/28 border border-white/16 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.14)] flex flex-col gap-1"
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <span className="text-[10px] uppercase tracking-wider text-zinc-300 font-bold">
                  Lisensi Key
                </span>
                <span className="text-2xl font-black text-white">{keysList.length}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <h3 className="px-1 text-[11px] font-black text-white uppercase tracking-wider">
                Aktivitas Sistem Terbaru
              </h3>
              {(recentActivities || []).slice(0, 8).map((act, idx) => (
                <div
                  key={act.id || idx}
                  className="w-full p-3.5 rounded-2xl bg-black/28 border border-white/14 shadow-[0_8px_24px_rgba(0,0,0,0.7)] flex flex-col gap-1 text-xs"
                  style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white break-all">{act.action}</span>
                    <span className="text-[10px] text-zinc-300 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed break-words">
                    {act.details || act.target}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: MANAJEMEN KEY AKSES (Stacked Mobile Cards)                     */}
        {/* ========================================================================= */}
        {activeSection === 'manajemen_key' && (
          <div className="flex flex-col gap-4">
            <div className="px-1 flex flex-col gap-0.5">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Manajemen Lisensi Key Resmi
              </h2>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Cetak kode Key baru secara instan atau cabut lisensi Key aktif.
              </p>
            </div>

            <form
              onSubmit={handleGenerateKeys}
              className="w-full p-4 rounded-3xl bg-black/28 border border-white/16 shadow-[0_14px_38px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col gap-3"
              style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            >
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Cetak Key Akses Manual
              </h3>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Durasi Lisensi</label>
                <select
                  value={genKeyType}
                  onChange={(e) => setGenKeyType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/55 border border-white/20 text-xs text-white focus:outline-none"
                >
                  <option value="1day">Key 1 Hari (5.000 Diamond+)</option>
                  <option value="1week">Key 1 Minggu (30.000 Diamond+)</option>
                  <option value="1month">Key 1 Bulan (60.000 Diamond+)</option>
                  <option value="permanent">Key Permanen (88.000 Diamond+ PROMO)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Jumlah Key (Maks 20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={genKeyCount}
                  onChange={(e) => setGenKeyCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/55 border border-white/20 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingKey}
                className="w-full py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {isGeneratingKey ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Mencetak Key...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle size={15} />
                    <span>Cetak Key Sekarang</span>
                  </>
                )}
              </button>
            </form>

            {/* Stacked Key Cards */}
            <div className="flex flex-col gap-2.5">
              <h3 className="px-1 text-[11px] font-black text-white uppercase tracking-wider">
                Daftar Lisensi Key ({keysList.length})
              </h3>

              {keysList.filter(Boolean).map((k) => {
                const isUsed =
                  k.usageStatus === 'SUDAH DIGUNAKAN' ||
                  Boolean(k.boundUid) ||
                  k.status === 'active';
                const usageLabel = isUsed ? 'SUDAH DIGUNAKAN' : 'BELUM DIGUNAKAN';
                const boundOwnerUid =
                  k.boundUid ||
                  (k.status !== 'available' && k.issuedTo && String(k.issuedTo).toUpperCase().startsWith('ZE-')
                    ? String(k.issuedTo).toUpperCase()
                    : '');

                return (
                  <div
                    key={k.id || k.key}
                    className="w-full p-3.5 rounded-2xl bg-black/28 border border-white/15 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col gap-2"
                    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs text-emerald-300 break-all">
                        {k.key}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isUsed
                              ? 'bg-amber-500/20 text-amber-200 border border-amber-500/35'
                              : 'bg-sky-500/20 text-sky-200 border border-sky-500/35'
                          }`}
                        >
                          {usageLabel}
                        </span>
                        {(k.status === 'revoked' || k.status === 'expired') && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/35">
                            {k.status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-300 flex-wrap">
                      <span>
                        Tipe: <strong className="text-white uppercase">{k.type}</strong> •{' '}
                        UID Pemilik:{' '}
                        <strong className="font-mono text-emerald-300">
                          {boundOwnerUid || 'Belum Terikat'}
                        </strong>
                      </span>
                      <span>{new Date(k.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(k.key, 'Key')}
                        className="px-3 py-1.5 rounded-xl bg-white/12 border border-white/20 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Copy size={12} />
                        <span>Salin</span>
                      </button>
                      {k.status !== 'revoked' && (
                        <button
                          type="button"
                          onClick={() => setRevokeKeyTarget(k.key)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/18 border border-rose-500/35 text-rose-200 text-[11px] font-bold cursor-pointer active:scale-95"
                        >
                          Cabut Key
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: MANAJEMEN PENGGUNA VIP (Stacked Mobile Cards)                  */}
        {/* ========================================================================= */}
        {activeSection === 'manajemen_vip' && (
          <div className="flex flex-col gap-4">
            <div className="px-1 flex flex-col gap-0.5">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Manajemen Anggota VIP
              </h2>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Berikan atau cabut status VIP Basic &amp; VIP Eksklusif pengguna.
              </p>
            </div>

            <form
              onSubmit={handleGrantVip}
              className="w-full p-4 rounded-3xl bg-black/28 border border-white/16 shadow-[0_14px_38px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col gap-3"
              style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            >
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Berikan Status VIP
              </h3>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">ID atau Username Target</label>
                <input
                  type="text"
                  placeholder="Contoh: ZE-12345 atau username..."
                  value={vipSearchQuery}
                  onChange={(e) => setVipSearchQuery(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/55 border border-white/20 text-xs text-white placeholder-zinc-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-300">Tingkat VIP</label>
                  <select
                    value={vipLevelSelect}
                    onChange={(e) => setVipLevelSelect(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-black/55 border border-white/20 text-xs text-white focus:outline-none"
                  >
                    <option value="basic">VIP Basic</option>
                    <option value="exclusive">VIP Eksklusif</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-zinc-300">Masa Aktif</label>
                  <select
                    value={vipDurationMonths}
                    onChange={(e) => setVipDurationMonths(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl bg-black/55 border border-white/20 text-xs text-white focus:outline-none"
                  >
                    <option value={2}>2 Bulan (60 Hari)</option>
                    <option value={4}>4 Bulan (120 Hari)</option>
                    <option value={12}>1 Tahun Penuh</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGrantingVip || !vipSearchQuery.trim()}
                className="w-full py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
              >
                {isGrantingVip ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Crown size={14} />
                    <span>Aktifkan VIP Sekarang</span>
                  </>
                )}
              </button>
            </form>

            {/* Stacked VIP Cards */}
            <div className="flex flex-col gap-2.5">
              <h3 className="px-1 text-[11px] font-black text-white uppercase tracking-wider">
                Daftar Anggota VIP Aktif ({vipUsersList.length})
              </h3>

              {vipUsersList.length === 0 ? (
                <div
                  className="py-10 px-4 text-center rounded-3xl bg-black/28 border border-white/15 text-xs text-zinc-300"
                  style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                  Belum ada anggota VIP aktif saat ini.
                </div>
              ) : (
                vipUsersList.map((u) => (
                  <div
                    key={u.id}
                    className="w-full p-3.5 rounded-2xl bg-black/28 border border-white/15 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)] flex items-center justify-between gap-3"
                    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  >
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-white truncate">
                          {u.name || u.username}
                        </span>
                        <UserRoleBadge user={u} size="xs" />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-300 truncate">{u.id}</span>
                      <span className="text-[10px] text-amber-300 font-bold">
                        {u.vipLevel === 'exclusive' ? 'VIP Eksklusif' : 'VIP Basic'} • Berlaku s/d{' '}
                        {u.vipExpiresAt ? new Date(u.vipExpiresAt).toLocaleDateString('id-ID') : 'Aktif'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRevokeVipTarget(u)}
                      className="px-3 py-2 rounded-xl bg-rose-500/18 border border-rose-500/35 text-rose-200 text-[11px] font-bold shrink-0 cursor-pointer active:scale-95"
                    >
                      Cabut VIP
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 6: MANAJEMEN PENGGUNA & ADMIN (Stacked Mobile Cards)              */}
        {/* ========================================================================= */}
        {activeSection === 'manajemen_pengguna' && (
          <div className="flex flex-col gap-3.5">
            <div className="px-1 flex flex-col gap-0.5">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Manajemen Pengguna &amp; Admin
              </h2>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Atur wewenang Admin (Centang Perak) dan status blokir akun.
              </p>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/20 shadow-md">
              <Search size={15} className="text-zinc-300 shrink-0" />
              <input
                type="text"
                placeholder="Cari nama, username, atau ID..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-zinc-400 focus:outline-none min-w-0"
              />
            </div>

            <div className="flex flex-col gap-2.5">
              {filteredUsers.map((u) => {
                const isOwner = checkIsOwner(u);
                const isAdmin = checkIsAdmin(u);

                return (
                  <div
                    key={u.id}
                    className="w-full p-3.5 rounded-2xl bg-black/28 border border-white/15 shadow-[0_10px_28px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col gap-2.5"
                    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-white truncate">
                            {u.name || u.username}
                          </span>
                          <UserRoleBadge user={u} size="xs" />
                        </div>
                        <span className="text-[11px] font-mono text-zinc-300 truncate">{u.id}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            isOwner
                              ? 'bg-white text-black'
                              : isAdmin
                              ? 'bg-white/20 text-white border border-white/25'
                              : 'bg-white/10 text-zinc-300'
                          }`}
                        >
                          {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'User'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.isSuspended
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/35'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                          }`}
                        >
                          {u.isSuspended ? 'Blokir' : 'Aktif'}
                        </span>
                      </div>
                    </div>

                    {!isOwner && (
                      <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAdminRoleModalTarget(u)}
                          className="py-2 rounded-xl bg-white/12 border border-white/20 text-white text-[11px] font-bold cursor-pointer active:scale-95"
                        >
                          {isAdmin ? 'Cabut Admin' : 'Angkat Admin'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSuspendModalTarget(u)}
                          className="py-2 rounded-xl bg-rose-500/18 border border-rose-500/35 text-rose-200 text-[11px] font-bold cursor-pointer active:scale-95"
                        >
                          {u.isSuspended ? 'Buka Blokir' : 'Tangguhkan'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 7: PENGUMUMAN GLOBAL                                              */}
        {/* ========================================================================= */}
        {activeSection === 'pengumuman' && (
          <div className="flex flex-col gap-4">
            <div className="px-1 flex flex-col gap-0.5">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Siaran Pengumuman Global
              </h2>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Kirim pesan resmi langsung ke kotak notifikasi seluruh pengguna ZE.io.
              </p>
            </div>

            <form
              onSubmit={handleBroadcastNotification}
              className="w-full p-4 rounded-3xl bg-black/28 border border-white/16 shadow-[0_14px_38px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col gap-3"
              style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            >
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Kategori</label>
                <select
                  value={notifCategory}
                  onChange={(e) => setNotifCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/55 border border-white/20 text-xs text-white focus:outline-none"
                >
                  <option value="PENGUMUMAN">PENGUMUMAN RESMI</option>
                  <option value="UPDATE">PEMBARUAN SISTEM</option>
                  <option value="MAINTENANCE">PEMELIHARAAN SERVER</option>
                  <option value="PROMO">PROMO SPESIAL</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Judul Pengumuman</label>
                <input
                  type="text"
                  placeholder="Contoh: Pembaruan Sistem ZE.io..."
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/55 border border-white/20 text-xs text-white placeholder-zinc-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Isi Pesan Lengkap</label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan isi pengumuman untuk seluruh pengguna..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/55 border border-white/20 text-xs text-white placeholder-zinc-400 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingNotif || !notifTitle.trim() || !notifMessage.trim()}
                className="w-full py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 cursor-pointer"
              >
                {isSendingNotif ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Menyiarkan...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Siarkan Pengumuman</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex flex-col gap-2.5">
              <h3 className="px-1 text-[11px] font-black text-white uppercase tracking-wider">
                Histori Pengumuman Terakhir
              </h3>
              {notificationHistory.slice(0, 6).map((n) => (
                <div
                  key={n.id}
                  className="w-full p-3.5 rounded-2xl bg-black/28 border border-white/14 shadow-[0_8px_24px_rgba(0,0,0,0.7)] flex flex-col gap-1"
                  style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <strong className="text-white truncate">{n.title}</strong>
                    <span className="text-[10px] text-zinc-300 shrink-0">
                      {new Date(n.createdAt).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed break-words">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 8: AUDIT LOG SISTEM (Stacked Mobile Cards)                        */}
        {/* ========================================================================= */}
        {activeSection === 'riwayat_aktivitas' && (
          <div className="flex flex-col gap-3">
            <div className="px-1 flex flex-col gap-0.5">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Audit Log Keamanan Server
              </h2>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Catatan aktivitas administratif dan transaksi sistem.
              </p>
            </div>

            {(recentActivities || []).map((log, idx) => (
              <div
                key={log.id || idx}
                className="w-full p-3.5 rounded-2xl bg-black/28 border border-white/15 shadow-[0_10px_26px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.12)] flex flex-col gap-1.5 text-xs"
                style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-black text-white break-all">{log.action}</span>
                  <span className="text-[10px] text-zinc-300 shrink-0">
                    {new Date(log.timestamp).toLocaleString('id-ID', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-200 leading-relaxed break-words">
                  {log.details || log.target || '-'}
                </p>
                <span className="text-[10px] font-mono text-zinc-400">
                  Pelaku: {log.performedBy}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 9: PENGATURAN KEAMANAN OWNER                                      */}
        {/* ========================================================================= */}
        {activeSection === 'pengaturan' && (
          <div className="flex flex-col gap-4">
            <div className="px-1 flex flex-col gap-0.5">
              <h2 className="text-xs font-black text-white uppercase tracking-wider">
                Pengaturan Keamanan Master
              </h2>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Perbarui kata sandi master akses Menu Owner.
              </p>
            </div>

            <form
              onSubmit={handleChangeOwnerPassword}
              className="w-full p-4 rounded-3xl bg-black/28 border border-white/16 shadow-[0_14px_38px_rgba(0,0,0,0.82),inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col gap-3.5"
              style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
            >
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  placeholder="Masukkan kata sandi lama..."
                  value={currPassword}
                  onChange={(e) => setCurrPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/55 border border-white/20 text-xs text-white placeholder-zinc-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-300">Kata Sandi Baru</label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/55 border border-white/20 text-xs text-white placeholder-zinc-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPass || !currPassword || !newPassword}
                className="w-full py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider hover:bg-zinc-200 transition shadow-lg disabled:opacity-40 cursor-pointer"
              >
                {isUpdatingPass ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Confirmation Dialog: ACC TOP UP */}
      {approveConfirmOrder && (
        <div className="fixed inset-0 z-[160] ze-transparent-page bg-black/55 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-black/80 backdrop-blur-2xl border border-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col gap-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              Konfirmasi ACC Top Up
            </h3>
            <p className="text-xs text-zinc-200 leading-relaxed">
              Setujui (ACC) top up untuk{' '}
              <strong className="text-white">{approveConfirmOrder.userName}</strong> ({approveConfirmOrder.userId})
              senilai{' '}
              <strong className="text-emerald-300">
                Rp{approveConfirmOrder.amount?.toLocaleString('id-ID')}
              </strong>
              ? Saldo pengguna langsung bertambah.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setApproveConfirmOrder(null)}
                disabled={isProcessingAction}
                className="py-2.5 rounded-2xl bg-white/12 border border-white/15 text-zinc-200 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleApproveTopup(approveConfirmOrder)}
                disabled={isProcessingAction}
                className="py-2.5 rounded-2xl bg-emerald-500 text-black font-black text-xs hover:bg-emerald-400 transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isProcessingAction ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Proses...</span>
                  </>
                ) : (
                  'ACC Sekarang'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: TOLAK TOP UP */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-[160] ze-transparent-page bg-black/55 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-black/80 backdrop-blur-2xl border border-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col gap-3.5">
            <h3 className="text-sm font-black text-white uppercase tracking-wide">
              Tolak Pengajuan Top Up
            </h3>
            <p className="text-xs text-zinc-200 leading-snug">
              Pengajuan {rejectModalOrder.orderId} (Rp{rejectModalOrder.amount?.toLocaleString('id-ID')}) milik{' '}
              <strong>{rejectModalOrder.userName}</strong> akan ditolak.
            </p>

            <form onSubmit={handleRejectTopup} className="flex flex-col gap-3">
              <textarea
                rows={3}
                placeholder="Alasan penolakan (contoh: bukti transfer belum sesuai)..."
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/60 border border-white/20 text-xs text-white placeholder-zinc-400 focus:outline-none resize-none"
                required
              />

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModalOrder(null);
                    setRejectReasonInput('');
                  }}
                  disabled={isProcessingAction}
                  className="py-2.5 rounded-2xl bg-white/12 border border-white/15 text-zinc-200 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction || !rejectReasonInput.trim()}
                  className="py-2.5 rounded-2xl bg-rose-500 text-white font-black text-xs hover:bg-rose-600 transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isProcessingAction ? 'Memproses...' : 'Tolak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Key Dialog */}
      {revokeKeyTarget && (
        <div className="fixed inset-0 z-[160] ze-transparent-page bg-black/55 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-black/80 backdrop-blur-2xl border border-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col gap-4 text-center">
            <h3 className="text-sm font-black text-white uppercase">Cabut Lisensi Key?</h3>
            <p className="text-xs text-zinc-200 break-all">
              Key <strong className="text-white font-mono">{revokeKeyTarget}</strong> tidak dapat digunakan lagi.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setRevokeKeyTarget(null)}
                className="py-2.5 rounded-2xl bg-white/12 text-xs font-bold text-zinc-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleRevokeKey(revokeKeyTarget)}
                className="py-2.5 rounded-2xl bg-rose-500 text-white text-xs font-black hover:bg-rose-600 cursor-pointer"
              >
                Cabut Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke VIP Dialog */}
      {revokeVipTarget && (
        <div className="fixed inset-0 z-[160] ze-transparent-page bg-black/55 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-black/80 backdrop-blur-2xl border border-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col gap-4 text-center">
            <h3 className="text-sm font-black text-white uppercase">Cabut Status VIP?</h3>
            <p className="text-xs text-zinc-200">
              Status VIP dari <strong className="text-white">{revokeVipTarget.name || revokeVipTarget.id}</strong> akan dibatalkan.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setRevokeVipTarget(null)}
                className="py-2.5 rounded-2xl bg-white/12 text-xs font-bold text-zinc-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleRevokeVip(revokeVipTarget.id)}
                className="py-2.5 rounded-2xl bg-rose-500 text-white text-xs font-black hover:bg-rose-600 cursor-pointer"
              >
                Cabut VIP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Role Dialog */}
      {adminRoleModalTarget && (
        <div className="fixed inset-0 z-[160] ze-transparent-page bg-black/55 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-black/80 backdrop-blur-2xl border border-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col gap-4 text-center">
            <h3 className="text-sm font-black text-white uppercase">
              {checkIsAdmin(adminRoleModalTarget) ? 'Cabut Hak Admin?' : 'Angkat Jadi Admin?'}
            </h3>
            <p className="text-xs text-zinc-200 leading-relaxed">
              Akun <strong className="text-white">{adminRoleModalTarget.name}</strong> ({adminRoleModalTarget.id}) akan{' '}
              {checkIsAdmin(adminRoleModalTarget)
                ? 'dikembalikan menjadi pengguna biasa.'
                : 'diberi wewenang Admin (Centang Perak).'}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setAdminRoleModalTarget(null)}
                className="py-2.5 rounded-2xl bg-white/12 text-xs font-bold text-zinc-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleToggleAdminRole(adminRoleModalTarget, !checkIsAdmin(adminRoleModalTarget))}
                className="py-2.5 rounded-2xl bg-white text-black text-xs font-black hover:bg-zinc-200 cursor-pointer"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Dialog */}
      {suspendModalTarget && (
        <div className="fixed inset-0 z-[160] ze-transparent-page bg-black/55 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm p-5 rounded-3xl bg-black/80 backdrop-blur-2xl border border-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col gap-3.5">
            <h3 className="text-sm font-black text-white uppercase">
              {suspendModalTarget.isSuspended ? 'Buka Blokir Akun?' : 'Tangguhkan Akun?'}
            </h3>
            <p className="text-xs text-zinc-200">
              Pengguna: <strong className="text-white">{suspendModalTarget.name}</strong> ({suspendModalTarget.id})
            </p>

            {!suspendModalTarget.isSuspended && (
              <input
                type="text"
                placeholder="Alasan penangguhan..."
                value={suspendReasonInput}
                onChange={(e) => setSuspendReasonInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/60 border border-white/20 text-xs text-white placeholder-zinc-400 focus:outline-none"
              />
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setSuspendModalTarget(null)}
                className="py-2.5 rounded-2xl bg-white/12 text-xs font-bold text-zinc-200 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleToggleSuspendUser(suspendModalTarget, !suspendModalTarget.isSuspended)}
                className="py-2.5 rounded-2xl bg-rose-500 text-white text-xs font-black hover:bg-rose-600 cursor-pointer"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Resolution Proof Lightbox */}
      {inspectProofImage && (
        <div
          className="fixed inset-0 z-[180] ze-transparent-page bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setInspectProofImage(null)}
        >
          <div className="relative max-w-full max-h-[90dvh]">
            <img
              src={inspectProofImage}
              alt="Bukti Transfer Detail"
              className="max-h-[86dvh] w-auto object-contain rounded-2xl border border-white/25 shadow-2xl"
            />
            <button
              onClick={() => setInspectProofImage(null)}
              className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full bg-black/80 border border-white/25 text-white flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerDashboardModal;
