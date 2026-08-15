const API_BASE = "http://127.0.0.1:8000";

const defaultState = {
  senderAccount: "1234567890",
  senderName: "Alice Johnson",
  receiverAccount: "9876543210",
  receiverName: "Bob Smith",
  amount: "5000",
  currency: "INR",
  senderCountry: "India",
  receiverCountry: "India",
  deviceId: "DEVICE-102",
  sessionId: "SESS-" + Math.floor(1000 + Math.random() * 9000)
};

function populateForm(data) {
  document.getElementById("senderAccount").value = data.senderAccount;
  document.getElementById("senderName").value = data.senderName;
  document.getElementById("receiverAccount").value = data.receiverAccount;
  document.getElementById("receiverName").value = data.receiverName;
  document.getElementById("amount").value = data.amount;
  document.getElementById("currency").value = data.currency;
  document.getElementById("senderCountry").value = data.senderCountry;
  document.getElementById("receiverCountry").value = data.receiverCountry;
  document.getElementById("deviceId").value = data.deviceId;
  document.getElementById("sessionId").value = data.sessionId;
}

function setPreset(type) {
  if (type === "normal") {
    populateForm({ ...defaultState, amount: "2000", senderCountry: "India", receiverCountry: "India" });
  } else if (type === "large") {
    populateForm({ ...defaultState, amount: "750000", senderCountry: "India", receiverCountry: "India" });
  } else if (type === "international") {
    populateForm({ ...defaultState, amount: "45000", currency: "USD", senderCountry: "India", receiverCountry: "USA" });
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

async function submitPayment() {
  closeModal();
  document.getElementById("processingModal").classList.remove("hidden");

  const payload = {
    sender_account: document.getElementById("senderAccount").value,
    sender_name: document.getElementById("senderName").value,
    receiver_account: document.getElementById("receiverAccount").value,
    receiver_name: document.getElementById("receiverName").value,
    amount: parseFloat(document.getElementById("amount").value),
    currency: document.getElementById("currency").value,
    sender_country: document.getElementById("senderCountry").value,
    receiver_country: document.getElementById("receiverCountry").value,
    device_id: document.getElementById("deviceId").value,
    session_id: document.getElementById("sessionId").value,
    otp: document.getElementById("otpInput").value
  };

  try {
    const res = await fetch(`${API_BASE}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Payment processing failed");
    }

    const data = await res.json();
    setTimeout(() => {
      document.getElementById("processingModal").classList.add("hidden");
      document.getElementById("successTxnId").innerText = data.transaction_id;
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
    const payload = {
      sender_account: "1234567890",
      sender_name: "Alice Johnson",
      receiver_account: `987654321${i}`,
      receiver_name: `Vendor Merchant ${i + 1}`,
      amount: Math.floor(1000 + Math.random() * 4000),
      currency: "INR",
      sender_country: "India",
      receiver_country: "India",
      device_id: "DEVICE-102",
      session_id: "SESS-RAPID-FIRE",
      otp: "123456"
    };

    await fetch(`${API_BASE}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }
}