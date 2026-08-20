import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  DEMO_USERS,
  mockAccountsByUser,
  seedTransactions,
} from "../data/mockData";

const AppContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const defaultSettings = {
  riskSensitivity: "balanced",
  notifications: true,
  biometricEnabled: true,
  monitorTyping: true,
  monitorNavigation: true,
  monitorDevice: true,
  toastDuration: 12,
  theme: "dark",
};

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      typeof payload === "object" && payload
        ? payload.detail || payload.message || "Request failed"
        : payload || "Request failed",
    );
  }

  return payload;
}

function normalizeState(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      users: DEMO_USERS,
      accountsByUser: mockAccountsByUser,
      allTransactions: seedTransactions,
      settings: defaultSettings,
      sessionUserId: null,
      isGlobalFrozen: false,
    };
  }

  const accountsByUser =
    raw.accountsByUser && typeof raw.accountsByUser === "object"
      ? Object.fromEntries(
          Object.entries(raw.accountsByUser).map(([userId, list]) => [
            userId,
            (Array.isArray(list) ? list : []).map((acc) => ({
              ...acc,
              securityPin: acc.securityPin || acc.security_pin || "1234",
            })),
          ]),
        )
      : mockAccountsByUser;

  return {
    users: Array.isArray(raw.users) ? raw.users : DEMO_USERS,
    accountsByUser,
    allTransactions: Array.isArray(raw.allTransactions)
      ? raw.allTransactions
      : seedTransactions,
    settings: {
      ...defaultSettings,
      ...(raw.settings || {}),
    },
    sessionUserId: raw.sessionUserId || null,
    isGlobalFrozen: Boolean(raw.isGlobalFrozen ?? false),
  };
}

export function AppProvider({ children }) {
  const [users, setUsers] = useState(DEMO_USERS);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountsByUser, setAccountsByUser] = useState(mockAccountsByUser);
  const [allTransactions, setAllTransactions] = useState(seedTransactions);
  const [alerts, setAlerts] = useState([]);
  const [isGlobalFrozen, setIsGlobalFrozen] = useState(false);
  const [freezeCountdown, setFreezeCountdown] = useState(null);
  const [showFreezeConfirm, setShowFreezeConfirm] = useState(false);
  const [freezeTarget, setFreezeTarget] = useState("all");
  const [settings, setSettings] = useState(defaultSettings);
  const [hydrated, setHydrated] = useState(false);

  const getAccountPin = useCallback(
    (accountId) => {
      const list = user ? accountsByUser[user.id] || [] : [];
      const target =
        list.find((acc) => acc.id === accountId) ||
        list.find((acc) => acc.status !== "frozen") ||
        list[0] ||
        null;
      const value = target?.securityPin || target?.security_pin || "1234";
      const normalized = String(value).replace(/\D/g, "");
      return normalized.length >= 4 ? normalized : "1234";
    },
    [user, accountsByUser],
  );

  const updateAccountPin = useCallback(
    (accountId, pin) => {
      if (!user) return;
      const nextPin = String(pin || "")
        .replace(/\D/g, "")
        .slice(0, 6);
      setAccountsByUser((prev) => ({
        ...prev,
        [user.id]: (prev[user.id] || []).map((acc) =>
          acc.id === accountId ? { ...acc, securityPin: nextPin } : acc,
        ),
      }));
    },
    [user],
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const raw = await apiRequest("/api/v1/app-state");
        if (cancelled) return;

        const state = normalizeState(raw);
        setUsers(state.users);
        setAccountsByUser(state.accountsByUser);
        setAllTransactions(state.allTransactions);
        setSettings(state.settings);
        setIsGlobalFrozen(state.isGlobalFrozen);

        const sessionUser =
          state.users.find((u) => u.id === state.sessionUserId) || null;
        setUser(sessionUser);
        setIsAuthenticated(Boolean(sessionUser));
      } catch (error) {
        console.warn(
          "Backend app-state unavailable, using demo data:",
          error.message,
        );
        setUsers(DEMO_USERS);
        setAccountsByUser(mockAccountsByUser);
        setAllTransactions(seedTransactions);
        setSettings(defaultSettings);
        setIsGlobalFrozen(false);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      settings.theme || "dark",
    );
  }, [settings.theme]);

  useEffect(() => {
    if (!hydrated) return;

    const payload = {
      users,
      accountsByUser,
      allTransactions,
      settings,
      sessionUserId: isAuthenticated && user ? user.id : null,
      isGlobalFrozen,
    };

    apiRequest("/api/v1/app-state", {
      method: "PUT",
      body: JSON.stringify(payload),
    }).catch((error) => {
      console.warn("Failed to persist app state:", error.message);
    });
  }, [
    users,
    accountsByUser,
    allTransactions,
    settings,
    isAuthenticated,
    user,
    isGlobalFrozen,
    hydrated,
  ]);

  const accounts = user?.role === "user" ? accountsByUser[user.id] || [] : [];
  const isUserFrozen = useCallback(
    (userId) => {
      const userAccounts = accountsByUser[userId] || [];
      return userAccounts.length > 0 && userAccounts[0].status === "frozen";
    },
    [accountsByUser],
  );
  const userAccountIds = new Set(accounts.map((a) => a.id));
  const transactions =
    user?.role === "admin"
      ? allTransactions
      : allTransactions.filter((t) => {
          // Show transactions that belong to this user's accounts
          // For transfers: show only transactions where the account matches the direction
          return userAccountIds.has(t.accountId);
        });

  const addAlert = useCallback((alert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 6));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role === "admin") return;
    const interval = setInterval(() => {
      if (Math.random() < 0.06 && !isGlobalFrozen && settings.notifications) {
        addAlert({
          id: `alert_${Date.now()}`,
          type: "high",
          title: "Suspicious Transaction Detected",
          message: "Review a flagged activity on your account.",
          timestamp: new Date().toISOString(),
        });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isGlobalFrozen, settings.notifications, user, addAlert]);

  const loginLocal = useCallback(
    (email, password) => {
      const q = (email || "").trim().toLowerCase();
      const pw = (password || "").trim();
      const pool = [
        ...DEMO_USERS,
        ...users.filter((u) => !DEMO_USERS.some((d) => d.id === u.id)),
      ];
      const found = pool.find((u) => {
        return (u.email || "").toLowerCase() === q && String(u.password) === pw;
      });
      if (!found) {
        return {
          ok: false,
          error: "Invalid credentials. Try aarav@secureflow.app / user1",
        };
      }
      const live = users.find((u) => u.id === found.id);
      const sessionUser = live
        ? {
            ...found,
            ...live,
            password: found.password,
            email: found.email,
            name: found.name,
          }
        : found;
      setUser(sessionUser);
      setIsAuthenticated(true);
      return { ok: true, user: sessionUser };
    },
    [users],
  );

  const login = useCallback(
    async (email, password) => {
      try {
        const result = await apiRequest("/api/v1/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        const sessionUser = result.user;
        try {
          const nextState = normalizeState(
            await apiRequest("/api/v1/app-state"),
          );
          setUsers(nextState.users);
          setAccountsByUser(nextState.accountsByUser);
          setAllTransactions(nextState.allTransactions);
          setSettings(nextState.settings);
          setIsGlobalFrozen(nextState.isGlobalFrozen);
        } catch (_) {
          /* keep local state if app-state fails */
        }
        setUser(sessionUser);
        setIsAuthenticated(true);
        return { ok: true, user: sessionUser };
      } catch (error) {
        // Backend offline or wrong password — try local demo accounts
        const local = loginLocal(email, password);
        if (local.ok) return local;
        const msg = String(error.message || "");
        return {
          ok: false,
          error: msg.includes("Failed to fetch")
            ? "SecureFlow backend server is unavailable. Ensure the backend server is running on http://localhost:8000."
            : error.message || "Invalid credentials",
        };
      }
    },
    [loginLocal],
  );

  const register = useCallback(async (data) => {
    try {
      const result = await apiRequest("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password || "user",
          securityPin: data.securityPin,
        }),
      });

      const sessionUser = result.user;
      setUser(sessionUser);
      setIsAuthenticated(true);
      setUsers((list) => {
        const exists = list.some((u) => u.id === sessionUser.id);
        if (!exists) return [...list, sessionUser];
        return list.map((u) =>
          u.id === sessionUser.id ? { ...u, ...sessionUser } : u,
        );
      });
      setAccountsByUser((prev) => ({
        ...prev,
        [sessionUser.id]: result.account
          ? [result.account]
          : prev[sessionUser.id] || [],
      }));

      // Reload the authoritative record so Settings and every dependent view
      // use the values that PostgreSQL accepted, including the phone number.
      const persisted = normalizeState(await apiRequest("/api/v1/app-state"));
      setUsers(persisted.users);
      setAccountsByUser(persisted.accountsByUser);
      setAllTransactions(persisted.allTransactions);
      setSettings(persisted.settings);
      setIsGlobalFrozen(persisted.isGlobalFrozen);
      const persistedUser =
        persisted.users.find((entry) => entry.id === sessionUser.id) ||
        sessionUser;
      setUser(persistedUser);
      return { ok: true, user: persistedUser };
    } catch (error) {
      const message = String(error.message || "");
      return {
        ok: false,
        error: message.includes("Failed to fetch")
          ? "SecureFlow server is unavailable. Start the backend and try again."
          : message || "Registration failed.",
      };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setIsGlobalFrozen(false);
    setAlerts([]);
  }, []);

  const updateUser = useCallback((fields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...fields };
      setUsers((list) =>
        list.map((u) => (u.id === prev.id ? { ...u, ...fields } : u)),
      );
      return next;
    });
  }, []);

  const dismissAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const setAccounts = useCallback(
    (updater) => {
      if (!user) return;
      setAccountsByUser((prev) => {
        const current = prev[user.id] || [];
        const next = typeof updater === "function" ? updater(current) : updater;
        return { ...prev, [user.id]: next };
      });
    },
    [user],
  );

  const transferMoney = useCallback(
    ({ toUserId, amount, location, note }) => {
      if (!user || user.role !== "user")
        return { ok: false, error: "Not allowed" };
      if (isGlobalFrozen || isUserFrozen(user.id)) {
        return {
          ok: false,
          error: "Account is frozen. You cannot send or receive money.",
        };
      }
      const amt = Number(amount);
      if (!amt || amt <= 0) return { ok: false, error: "Invalid amount" };
      if (user.balance < amt)
        return { ok: false, error: "Insufficient balance" };
      const receiver = users.find(
        (u) => u.id === toUserId && u.role === "user",
      );
      if (!receiver) return { ok: false, error: "Recipient not found" };
      if (receiver.id === user.id)
        return { ok: false, error: "Cannot pay yourself" };
      if (isUserFrozen(receiver.id)) {
        return {
          ok: false,
          error: "Account is frozen. You cannot send or receive money.",
        };
      }

      const now = new Date();
      const iso = now.toISOString();
      const day = now.toLocaleDateString("en-IN", { weekday: "long" });
      const loc = location || "On-device · SecureFlow QR";
      const txnId = `txn_${Date.now()}`;

      let riskScore = 10;
      if (amt > 2000) riskScore += 30;
      if (amt > 5000) riskScore += 25;
      const hour = now.getHours();
      if (hour < 6 || hour > 23) riskScore += 15;
      const riskLevel =
        riskScore >= 70 ? "high" : riskScore >= 40 ? "medium" : "low";

      setUsers((list) =>
        list.map((u) => {
          if (u.id === user.id)
            return { ...u, balance: +(u.balance - amt).toFixed(2) };
          if (u.id === receiver.id)
            return { ...u, balance: +(u.balance + amt).toFixed(2) };
          return u;
        }),
      );
      setUser((prev) =>
        prev ? { ...prev, balance: +(prev.balance - amt).toFixed(2) } : prev,
      );

      const base = {
        id: txnId,
        fromUserId: user.id,
        toUserId: receiver.id,
        fromName: user.name,
        toName: receiver.name,
        date: iso,
        day,
        location: loc,
        riskScore,
        riskLevel,
        status: riskLevel === "low" ? "completed" : "pending_verification",
        category: "P2P",
        note: note || "",
        explainable:
          riskLevel !== "low"
            ? {
                summary: `P2P transfer flagged (${riskLevel})`,
                reasons: [
                  amt > 2000 ? "Amount above typical peer transfer" : null,
                  hour < 6 || hour > 23 ? "Unusual hour for transfer" : null,
                  "New or infrequent counterparty pattern",
                ].filter(Boolean),
              }
            : null,
      };

      // Create only ONE transaction for the transfer (from sender's perspective)
      setAllTransactions((prev) => [
        {
          ...base,
          accountId: accounts[0]?.id,
          accountName: accounts[0]?.name || "Primary",
          merchant: `Sent to ${receiver.name}`,
          amount: -amt,
          direction: "out",
        },
        ...prev,
      ]);

      // Also create a transaction for the receiver (visible in their account)
      setAllTransactions((prev) => [
        {
          ...base,
          id: `${txnId}_in`,
          accountId: (accountsByUser[receiver.id] || [])[0]?.id,
          accountName:
            (accountsByUser[receiver.id] || [])[0]?.name || "Primary",
          fromUserId: user.id,
          toUserId: receiver.id,
          fromName: user.name,
          toName: receiver.name,
          merchant: `Received from ${user.name}`,
          amount: amt,
          direction: "in",
          status: "completed",
          riskLevel: "low",
          riskScore: 5,
          explainable: null,
        },
        ...prev,
      ]);

      addAlert({
        id: `pay_${Date.now()}`,
        type: riskLevel === "low" ? "success" : "medium",
        title:
          riskLevel === "low" ? "Payment sent" : "Payment sent · review needed",
        message: `₹${amt.toFixed(2)} sent to ${receiver.name}`,
        timestamp: iso,
      });

      return { ok: true, txnId, riskLevel };
    },
    [
      user,
      users,
      isGlobalFrozen,
      isUserFrozen,
      accounts,
      accountsByUser,
      addAlert,
    ],
  );

  const startFreezeFlow = useCallback((target = "all") => {
    setFreezeTarget(target);
    setShowFreezeConfirm(true);
    setFreezeCountdown(60);
  }, []);

  const confirmFreeze = useCallback(() => {
    if (!user) return;
    if (freezeTarget === "all") {
      setIsGlobalFrozen(true);
      setAccounts((prev) => prev.map((acc) => ({ ...acc, status: "frozen" })));
      addAlert({
        id: `alert_freeze_${Date.now()}`,
        type: "success",
        title: "All Accounts Frozen",
        message: "Every linked account has been locked.",
        timestamp: new Date().toISOString(),
      });
    } else {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === freezeTarget ? { ...acc, status: "frozen" } : acc,
        ),
      );
      addAlert({
        id: `alert_freeze_${Date.now()}`,
        type: "success",
        title: "Account Frozen",
        message: "Selected account has been locked.",
        timestamp: new Date().toISOString(),
      });
    }
    setShowFreezeConfirm(false);
    setFreezeCountdown(null);
    setFreezeTarget("all");
  }, [freezeTarget, user, setAccounts, addAlert]);

  const cancelFreeze = useCallback(() => {
    setShowFreezeConfirm(false);
    setFreezeCountdown(null);
    setFreezeTarget("all");
  }, []);

  useEffect(() => {
    if (freezeCountdown === null || freezeCountdown <= 0) return;
    const t = setTimeout(
      () => setFreezeCountdown((c) => (c > 0 ? c - 1 : 0)),
      1000,
    );
    return () => clearTimeout(t);
  }, [freezeCountdown]);

  const unfreezeAccount = useCallback(
    (accountId) => {
      setAccounts((prev) => {
        const next = prev.map((acc) =>
          acc.id === accountId ? { ...acc, status: "active" } : acc,
        );
        if (next.every((a) => a.status === "active")) setIsGlobalFrozen(false);
        return next;
      });
    },
    [setAccounts],
  );

  const unfreezeAll = useCallback(() => {
    setAccounts((prev) => prev.map((acc) => ({ ...acc, status: "active" })));
    setIsGlobalFrozen(false);
    addAlert({
      id: `alert_unfreeze_${Date.now()}`,
      type: "success",
      title: "Accounts Unfrozen",
      message: "All accounts are active again.",
      timestamp: new Date().toISOString(),
    });
  }, [setAccounts, addAlert]);

  const updateTransactionStatus = useCallback((txnId, status, feedback) => {
    setAllTransactions((prev) =>
      prev.map((t) =>
        t.id === txnId || t.id === `${txnId}_in`
          ? {
              ...t,
              status,
              userFeedback: feedback || null,
              verifiedAt: ["confirmed", "cancelled", "reported"].includes(
                status,
              )
                ? new Date().toISOString()
                : t.verifiedAt,
            }
          : t,
      ),
    );
  }, []);

  const healthScore =
    user?.role === "admin"
      ? 100
      : accounts.filter((a) => a.status === "active").length === accounts.length
        ? Math.min(100, (user?.healthScore || 70) + 5)
        : Math.max(20, (user?.healthScore || 70) - 30);

  const otherUsers = users.filter(
    (u) => u.role === "user" && u.id !== user?.id,
  );

  const value = {
    users,
    user,
    isAuthenticated,
    accounts,
    transactions,
    allTransactions,
    alerts,
    isGlobalFrozen,
    isUserFrozen,
    freezeCountdown,
    showFreezeConfirm,
    freezeTarget,
    settings,
    healthScore,
    otherUsers,
    getAccountPin,
    updateAccountPin,
    login,
    register,
    logout,
    updateUser,
    addAlert,
    dismissAlert,
    startFreezeFlow,
    confirmFreeze,
    cancelFreeze,
    unfreezeAccount,
    unfreezeAll,
    updateTransactionStatus,
    setSettings,
    setAccounts,
    transferMoney,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
