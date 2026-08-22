const API_BASE = window.location.origin;
// Point directly to SecureFlow on 8001
// Change line 3 to:
const SECUREFLOW_URL = "/api/proxy-analyze";

async function processPaymentRequest(payload) {
  try {
    const response = await fetch(SECUREFLOW_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Analysis Result:", data);
    return data;
  } catch (error) {
    console.error("Connection Failed:", error);
    alert("Payment Error: SecureFlow is unreachable. Please start SecureFlow and try again.");
    return null;
  }
}
const defaultState = {
  senderAccount: "1234567890",
  senderName: "Alice Johnson",
  receiverAccount: "9876543210",
  receiverName: "Bob Smith",
  amount: "5000",
  currency: "INR",
  senderCountry: "IN",
  receiverCountry: "IN",
  deviceId: "DEVICE-102",
  sessionId: "SESS-" + Math.floor(1000 + Math.random() * 9000)
};

function normalizeCountryCode(value) {
  if (!value) return "";
  const code = String(value).trim().toUpperCase();
  if (code.includes("-")) return code.split("-")[0].trim();
  return code.slice(0, 2);
}

function populateForm(data) {
  document.getElementById("senderAccount").value = data.senderAccount;
  document.getElementById("senderName").value = data.senderName;
  document.getElementById("receiverAccount").value = data.receiverAccount;
  document.getElementById("receiverName").value = data.receiverName;
  document.getElementById("amount").value = data.amount;
  document.getElementById("currency").value = data.currency;
  document.getElementById("senderCountry").value = normalizeCountryCode(data.senderCountry);
  document.getElementById("receiverCountry").value = normalizeCountryCode(data.receiverCountry);
  document.getElementById("deviceId").value = data.deviceId;
  document.getElementById("sessionId").value = data.sessionId;
}

function setPreset(type) {
  if (type === "normal") {
    populateForm({ ...defaultState, amount: "2000", senderCountry: "IN", receiverCountry: "IN" });
  } else if (type === "large") {
    populateForm({ ...defaultState, amount: "750000", senderCountry: "IN", receiverCountry: "IN" });
  } else if (type === "international") {
    populateForm({ ...defaultState, amount: "45000", currency: "USD", senderCountry: "IN", receiverCountry: "US" });
  }
}

populateForm(defaultState);

document.getElementById("paymentForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const amt = document.getElementById("amount").value;
  const curr = document.getElementById("currency").value;
  const rec = document.getElementById("receiverName").value;

  document.getElementById("modalAmount").innerText = `${curr} ${amt}`;
  document.getElementById("modalReceiver").innerText = rec;
  document.getElementById("otpModal").classList.remove("hidden");
});

function closeModal() {
  document.getElementById("otpModal").classList.add("hidden");
}

function buildSecureFlowPayload(amount, receiverAccount, currency, senderCountry, receiverCountry) {
  return {
    transaction_id: "tx_" + Date.now(),
    user_id: "usr_demo_101",
    amount: parseFloat(amount),
    recipient_account: receiverAccount,
    currency,
    velocity_1h: 1.0,
    new_beneficiary: 1,
    location_distance_km: senderCountry !== receiverCountry ? 999.0 : 0.0,
    typing_cadence_variance: 0.45,
    active_screenshare: 0,
    is_on_active_call: false,
    screen_sharing_active: false
  };
}

function showResult(data, isDeclined) {
  const resultCard = document.getElementById("resultCard");
  document.getElementById("resultStatus").textContent = isDeclined ? "DECLINED" : "APPROVED";
  document.getElementById("resultVerdict").textContent = `Verdict: ${data.verdict || data.action || (isDeclined ? "BLOCK" : "APPROVED")}`;
  document.getElementById("resultRisk").textContent = `Risk score: ${data.risk_score ?? data.fraud_score ?? "N/A"}`;
  const reasons = Array.isArray(data.reasons) ? data.reasons.join("; ") : data.reasons || "None";
  document.getElementById("resultReasons").textContent = `Reasons: ${reasons}`;
  const shap = data.shap_explanation ?? data.shap_values ?? data.explanation ?? "No SHAP explanation returned.";
  document.getElementById("resultShap").textContent = `SHAP explanation:\n${typeof shap === "string" ? shap : JSON.stringify(shap, null, 2)}`;
  resultCard.classList.remove("hidden");
}

async function sendTransactionToSecureFlow(payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(SECUREFLOW_API, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error("SecureFlow responded with " + response.status);
    }

    return await response.json();
  } catch (err) {
    console.warn("SecureFlow communication issue:", err);
    throw new Error("SecureFlow is unreachable. Please start SecureFlow and try again.");
  } finally {
    clearTimeout(timeoutId);
  }
}

async function submitPayment() {
  closeModal();
  document.getElementById("processingModal").classList.remove("hidden");

  const amount = document.getElementById("amount").value;
  const receiverAccount = document.getElementById("receiverAccount").value;
  const currency = document.getElementById("currency").value;
  const senderCountry = normalizeCountryCode(document.getElementById("senderCountry").value);
  const receiverCountry = normalizeCountryCode(document.getElementById("receiverCountry").value);
  const payload = buildSecureFlowPayload(amount, receiverAccount, currency, senderCountry, receiverCountry);

  try {
    console.log("Sending txn to SecureFlow:", payload);
    const data = await sendTransactionToSecureFlow(payload);
    console.log("SecureFlow response:", data);

    const isDeclined = data.is_fraud === true || data.action === "BLOCK" || data.status === "DECLINED" || data.verdict === "DECLINED";
    showResult(data, isDeclined);
    if (isDeclined) {
      const reasons = Array.isArray(data.reasons) ? data.reasons.join("\n") : data.reasons || "No reason provided";
      throw new Error(`Payment Blocked by Fraud Detection System\n\nRisk score: ${data.risk_score ?? "N/A"}\nReasons:\n${reasons}`);
    }

    setTimeout(() => {
      document.getElementById("processingModal").classList.add("hidden");
      document.getElementById("successTxnId").innerText = data.transaction_id || "Approved by SecureFlow";
      document.getElementById("successModal").classList.remove("hidden");
    }, 600);
  } catch (err) {
    document.getElementById("processingModal").classList.add("hidden");
    alert(`Payment Error: ${err.message}`);
  }
}

function resetForm() {
  document.getElementById("successModal").classList.add("hidden");
  populateForm({
    ...defaultState,
    sessionId: "SESS-" + Math.floor(1000 + Math.random() * 9000)
  });
}

async function generateBatch(count) {
  for (let i = 0; i < count; i++) {
    const payload = buildSecureFlowPayload(
      Math.floor(1000 + Math.random() * 4000),
      `987654321${i}`,
      "INR",
      "IN",
      "IN"
    );

    console.log("Sending txn to SecureFlow:", payload);
    const data = await sendTransactionToSecureFlow(payload);
    console.log("SecureFlow response:", data);
    showResult(data, data.is_fraud === true || data.action === "BLOCK" || data.verdict === "DECLINED");
  }
}