const API_BASE = "http://127.0.0.1:8000";
const WS_URL = "ws://127.0.0.1:8000/ws/transactions";

const tbody = document.getElementById("transactionBody");
const wsStatus = document.getElementById("wsStatus");

async function fetchHistory() {
  try {
    const res = await fetch(`${API_BASE}/api/transactions`);
    const data = await res.json();
    data.forEach(txn => appendRow(txn, false));
  } catch (err) {
    console.error("Failed to load historical transactions", err);
  }
}

function appendRow(txn, isLive = true) {
  const tr = document.createElement("tr");
  if (isLive) {
    tr.style.backgroundColor = "rgba(37, 99, 235, 0.15)";
    setTimeout(() => {
      tr.style.backgroundColor = "transparent";
      tr.style.transition = "background-color 1s ease";
    }, 800);
  }

  const timeFormatted = new Date(txn.timestamp).toISOString().replace("T", " ").substring(0, 19);

  tr.innerHTML = `
    <td style="font-family: monospace; font-weight: bold; color: #60a5fa;">${txn.transaction_id}</td>
    <td style="color: var(--text-muted); font-size: 0.8rem;">${timeFormatted}</td>
    <td>${txn.sender_name} <br><span style="font-size:0.75rem; color:var(--text-muted);">${txn.sender_account}</span></td>
    <td>${txn.receiver_name} <br><span style="font-size:0.75rem; color:var(--text-muted);">${txn.receiver_account}</span></td>
    <td style="font-weight: 700;">${txn.currency} ${txn.amount.toLocaleString()}</td>
    <td>${txn.sender_country} ➔ ${txn.receiver_country}</td>
    <td style="font-family: monospace; font-size: 0.8rem;">${txn.device_id}</td>
    <td><span class="badge badge-success">${txn.status}</span></td>
  `;

  if (tbody.firstChild && isLive) {
    tbody.insertBefore(tr, tbody.firstChild);
  } else {
    tbody.appendChild(tr);
  }
}

function connectWebSocket() {
  const socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    wsStatus.innerText = "● WebSocket Connected";
    wsStatus.style.background = "rgba(16, 185, 129, 0.2)";
    wsStatus.style.color = "#10b981";
  };

  socket.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    if (payload.event === "transaction_created") {
      appendRow(payload.transaction, true);
    }
  };

  socket.onclose = () => {
    wsStatus.innerText = "● Reconnecting...";
    wsStatus.style.background = "rgba(239, 68, 68, 0.2)";
    wsStatus.style.color = "#ef4444";
    setTimeout(connectWebSocket, 2000);
  };
}

fetchHistory();
connectWebSocket();