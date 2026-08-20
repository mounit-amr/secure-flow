/** Demo users: Aarav, Ved, and 1 admin */
export const DEMO_USERS = [
  {
    id: "user_1",
    name: "Aarav Sharma",
    email: "aarav@secureflow.app",
    phone: "+91 98765 43210",
    password: "user1",
    role: "user",
    balance: 12500.5,
    upiId: "aarav@okaxis",
    healthScore: 78,
    joinedAt: "2026-01-15",
  },
  {
    id: "user_2",
    name: "Ved Patel",
    email: "ved@secureflow.app",
    phone: "+91 91234 56789",
    password: "user2",
    role: "user",
    balance: 8420.0,
    upiId: "ved@paytm",
    healthScore: 85,
    joinedAt: "2026-02-01",
  },
  {
    id: "admin_1",
    name: "Rohan Mehta",
    email: "admin@secureflow.app",
    phone: "+91 90000 00000",
    password: "admin",
    role: "admin",
    balance: 0,
    upiId: null,
    healthScore: 100,
    joinedAt: "2025-11-01",
  },
];

export const mockAccountsByUser = {
  user_1: [
    {
      id: "acc_1a",
      name: "HDFC Salary",
      type: "Bank",
      last4: "4821",
      balance: 8450.5,
      status: "active",
      icon: "🏦",
      securityPin: "1234",
    },
  ],
  user_2: [
    {
      id: "acc_2a",
      name: "Ved Wallet",
      type: "Wallet",
      last4: "9033",
      balance: 5200.0,
      status: "active",
      icon: "💳",
      securityPin: "1234",
    },
  ],
};

function dayName(iso) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "long" });
}

const allSeedTransactions = [
  {
    id: "txn_s1",
    fromUserId: "user_2",
    toUserId: "user_1",
    fromName: "Ved Patel",
    toName: "Aarav Sharma",
    accountId: "acc_1a",
    accountName: "HDFC Salary",
    merchant: "Received from Ved Patel",
    amount: 500.0,
    direction: "in",
    date: "2026-08-14T10:30:00",
    day: "Friday",
    location: "Mumbai, Maharashtra, India",
    riskScore: 8,
    riskLevel: "low",
    status: "completed",
    category: "P2P",
    explainable: null,
  },
  {
    id: "txn_s2",
    fromUserId: "user_1",
    toUserId: "user_2",
    fromName: "Aarav Sharma",
    toName: "Ved Patel",
    accountId: "acc_1a",
    accountName: "HDFC Salary",
    merchant: "Sent to Ved Patel",
    amount: -250.0,
    direction: "out",
    date: "2026-08-13T16:45:00",
    day: "Thursday",
    location: "Bengaluru, Karnataka, India",
    riskScore: 12,
    riskLevel: "low",
    status: "completed",
    category: "P2P",
    explainable: null,
  },
  {
    id: "txn_2",
    fromUserId: null,
    toUserId: "user_1",
    fromName: "External",
    toName: "Aarav Sharma",
    accountId: "acc_1a",
    accountName: "HDFC Salary",
    merchant: "Card-Not-Present · Moscow",
    amount: -2450.0,
    direction: "out",
    date: "2026-08-14T09:15:00",
    day: "Friday",
    location: "Moscow, Russia",
    riskScore: 94,
    riskLevel: "critical",
    status: "flagged",
    category: "Transfer",
    explainable: {
      reasons: [
        "New recipient never used before",
        "Location mismatch: Device in India, transaction from Moscow, RU",
        "Amount significantly higher than average ($180)",
        "Card-not-present + high-risk geo",
      ],
      summary: "Flagged: New Recipient + Location Mismatch + High Amount",
    },
  },
  {
    id: "txn_3",
    fromUserId: null,
    toUserId: "user_1",
    fromName: "External",
    toName: "Aarav Sharma",
    accountId: "acc_1b",
    accountName: "PhonePe",
    merchant: "Wire Transfer · New Recipient",
    amount: -1200.0,
    direction: "out",
    date: "2026-08-14T07:45:00",
    day: "Friday",
    location: "Lagos, Nigeria",
    riskScore: 78,
    riskLevel: "high",
    status: "flagged",
    category: "Transfer",
    explainable: {
      reasons: [
        "New recipient + IP mismatch",
        "Unusual time of day for wire transfers",
        "Amount exceeds daily average by 4.2x",
      ],
      summary: "Flagged: New Recipient + IP Mismatch",
    },
  },
  {
    id: "txn_4",
    fromUserId: null,
    toUserId: "user_1",
    fromName: "External",
    toName: "Aarav Sharma",
    accountId: "acc_1c",
    accountName: "Coinbase",
    merchant: "BTC Withdrawal",
    amount: -400.0,
    direction: "out",
    date: "2026-08-13T22:10:00",
    day: "Thursday",
    location: "Unknown wallet · Tor exit node",
    riskScore: 45,
    riskLevel: "medium",
    status: "pending_verification",
    category: "Crypto",
    explainable: {
      reasons: [
        "Withdrawal to new wallet address",
        "Typing cadence slightly different from baseline",
      ],
      summary: "Step-up required: New wallet + behavior shift",
    },
  },
  {
    id: "txn_5",
    fromUserId: null,
    toUserId: "user_1",
    fromName: "Merchant",
    toName: "Aarav Sharma",
    accountId: "acc_1b",
    accountName: "PhonePe",
    merchant: "Starbucks",
    amount: -6.75,
    direction: "out",
    date: "2026-08-13T16:30:00",
    day: "Thursday",
    location: "Mumbai, Maharashtra, India",
    riskScore: 5,
    riskLevel: "low",
    status: "completed",
    category: "Food",
    explainable: null,
  },
];

export const seedTransactions = allSeedTransactions.filter((txn) =>
  ["acc_1a", "acc_2a"].includes(txn.accountId),
);

export const bankLogos = [
  { name: "Chase", domain: "chase.com", color: "#117ACA" },
  { name: "Wells Fargo", domain: "wellsfargo.com", color: "#D71E28" },
  { name: "HDFC Bank", domain: "hdfcbank.com", color: "#004C8F" },
  { name: "ICICI Bank", domain: "icicibank.com", color: "#F58220" },
  { name: "SBI", domain: "sbi.co.in", color: "#22409A" },
  { name: "Axis Bank", domain: "axisbank.com", color: "#97144D" },
  { name: "PhonePe", domain: "phonepe.com", color: "#5F259F" },
  { name: "GPay", domain: "pay.google.com", color: "#4285F4" },
  { name: "Paytm", domain: "paytm.com", color: "#00BAF2" },
  { name: "BHIM", domain: "bhimupi.org.in", color: "#00AEEF" },
  { name: "Coinbase", domain: "coinbase.com", color: "#0052FF" },
  { name: "Apple", domain: "apple.com", color: "#A2AAAD" },
];

export const features = [
  {
    icon: "⚡",
    title: "One-Tap Freeze",
    description:
      "Instantly lock every linked bank, UPI, and wallet with a single tap. Average isolation time: 1.8 seconds.",
  },
  {
    icon: "🧠",
    title: "Explainable AI",
    description:
      "Every risk score comes with plain-language reasons so you understand exactly why a transaction was flagged.",
  },
  {
    icon: "📱",
    title: "Phone transfers",
    description:
      "Send money by entering the recipient's phone number. Instant P2P with live location tagged on every transfer.",
  },
  {
    icon: "🛡️",
    title: "First-Hour Protection",
    description:
      "Most fraud damage happens in the first 60 minutes. SecureFlow stops compromise before it escalates.",
  },
  {
    icon: "🔔",
    title: "Smart Alerts",
    description:
      "Step-up verification for medium risk, urgent freeze prompts for high risk — always in plain language.",
  },
  {
    icon: "🏦",
    title: "Multi-Account Coverage",
    description:
      "Link banks, UPI apps, crypto wallets, and payment services. One control plane for all your money.",
  },
];

export const howItWorks = [
  {
    step: 1,
    title: "Link Your Accounts",
    description:
      "Securely connect banks, UPI, and wallets. We use read-only + freeze permissions only.",
  },
  {
    step: 2,
    title: "Pay by phone number",
    description:
      "Enter a registered phone number to send money. Your location is captured automatically for fraud checks.",
  },
  {
    step: 3,
    title: "Real-Time Risk Scoring",
    description:
      "Every transfer is scored instantly. Medium risk triggers step-up; high risk triggers freeze options.",
  },
  {
    step: 4,
    title: "You Stay in Control",
    description:
      "Confirm, dispute, or freeze. Your feedback improves the model and reduces false positives.",
  },
];

export { dayName };
