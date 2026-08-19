# SecureFlow — Account system frontend

Unified frontend roof for:
- **Account system** (this repo focus): multi-user wallets, QR pay, linked banks/UPI
- **Payment system** (partner): hooks via transfer ledger
- **Fraud detection** (partner): risk scores, freeze, explainable AI UI

## Demo accounts

| Role | Email | Password |
|------|--------|----------|
| User 1 (Aarav Sharma) | aarav@secureflow.app | user1 |
| User 2 (Priya Patel) | priya@secureflow.app | user2 |
| Admin | admin@secureflow.app | admin |

OTP (users): `123456`  
Default security PIN: `1234`

## Try P2P + QR

1. Log in as Aarav Sharma → **Receive QR** → copy payload  
2. Incognito / other browser → Priya Patel → **Send money** → paste payload or select Aarav Sharma → send  
3. Balances update both sides; history shows date, time, day, amount, location, from → to  
4. Log in as Admin → aggregated ledger & balances  

## Run

```bash
npm install
npm run dev
```
