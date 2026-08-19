import customtkinter as ctk

ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

_active_gui_app = None

def notify_ui(event_data: dict):
    """Dispatches backend evaluation results directly to the UI."""
    global _active_gui_app
    if _active_gui_app is not None:
        try:
            _active_gui_app.after(0, lambda: _active_gui_app.update_dashboard(event_data))
        except Exception as e:
            print(f"[UI Error]: {e}")

class FraudDetectionApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        global _active_gui_app
        _active_gui_app = self

        self.title("SecureFlow - Fraud Assessment Results")
        self.geometry("820x620")
        self.minsize(760, 540)

        # Header Title
        self.header_label = ctk.CTkLabel(
            self,
            text="SecureFlow Live Assessment Monitor",
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color="#38bdf8"
        )
        self.header_label.pack(pady=(18, 12))

        # ---------------- 1. Status & Verdict Banner ----------------
        self.verdict_badge = ctk.CTkLabel(
            self,
            text="WAITING FOR TRANSACTIONS...",
            font=ctk.CTkFont(size=18, weight="bold"),
            text_color="#94a3b8",
            fg_color="#1e293b",
            corner_radius=8,
            height=50
        )
        self.verdict_badge.pack(fill="x", padx=25, pady=(0, 12))

        # ---------------- 2. Clean Transaction Summary Card ----------------
        self.summary_card = ctk.CTkFrame(self, fg_color="#18181b", corner_radius=8)
        self.summary_card.pack(fill="x", padx=25, pady=(0, 12), ipady=8)

        self.summary_title = ctk.CTkLabel(self.summary_card, text="Transaction Summary", font=ctk.CTkFont(size=14, weight="bold"), text_color="#cbd5e1")
        self.summary_title.pack(anchor="w", padx=15, pady=(4, 6))

        self.info_row = ctk.CTkFrame(self.summary_card, fg_color="transparent")
        self.info_row.pack(fill="x", padx=15, pady=2)

        self.amount_lbl = ctk.CTkLabel(self.info_row, text="Amount: --", font=ctk.CTkFont(size=13))
        self.amount_lbl.pack(side="left", expand=True, anchor="w")

        self.type_lbl = ctk.CTkLabel(self.info_row, text="Type: --", font=ctk.CTkFont(size=13))
        self.type_lbl.pack(side="left", expand=True, anchor="w")

        self.risk_lbl = ctk.CTkLabel(self.info_row, text="Risk Score: --", font=ctk.CTkFont(size=13, weight="bold"))
        self.risk_lbl.pack(side="left", expand=True, anchor="w")

        self.route_row = ctk.CTkFrame(self.summary_card, fg_color="transparent")
        self.route_row.pack(fill="x", padx=15, pady=(4, 4))

        self.orig_lbl = ctk.CTkLabel(self.route_row, text="Origin: --", font=ctk.CTkFont(size=12), text_color="#94a3b8")
        self.orig_lbl.pack(side="left", expand=True, anchor="w")

        self.dest_lbl = ctk.CTkLabel(self.route_row, text="Destination: --", font=ctk.CTkFont(size=12), text_color="#94a3b8")
        self.dest_lbl.pack(side="left", expand=True, anchor="w")

        # ---------------- 3. Script & XAI Insights Card ----------------
        self.details_card = ctk.CTkFrame(self, fg_color="#18181b", corner_radius=8)
        self.details_card.pack(fill="both", expand=True, padx=25, pady=(0, 20))

        self.details_title = ctk.CTkLabel(self.details_card, text="Decision Logic & Model Insights", font=ctk.CTkFont(size=14, weight="bold"), text_color="#cbd5e1")
        self.details_title.pack(anchor="w", padx=15, pady=(10, 4))

        self.results_box = ctk.CTkTextbox(self.details_card, font=ctk.CTkFont(family="Consolas", size=13), activate_scrollbars=True)
        self.results_box.pack(fill="both", expand=True, padx=15, pady=(0, 12))
        self.results_box.insert("0.0", "Awaiting execution...\nResults from your backend scripts and models will display here.")

    def update_dashboard(self, data: dict):
        status = str(data.get("status", "")).upper()
        is_fraud = status in ["FLAGGED", "DECLINED", "BLOCKED", "REJECTED"] or data.get("prediction") == 1 or float(data.get("fraud_probability", 0.0)) > 0.5
        risk = float(data.get("fraud_probability", data.get("risk_score", 0.0)))
        amount = data.get("amount", 0.0)
        tx_type = data.get("type", "PAYMENT")
        reason = data.get("reason", "Evaluation complete.")

        # Update Verdict
        if is_fraud:
            self.verdict_badge.configure(text="⚠️ TRANSACTION FLAGGED / BLOCKED", text_color="#ffffff", fg_color="#dc2626")
        else:
            self.verdict_badge.configure(text="✅ TRANSACTION APPROVED", text_color="#ffffff", fg_color="#16a34a")

        # Update Summary Labels
        self.amount_lbl.configure(text=f"Amount: ${amount:,.2f}" if isinstance(amount, (int, float)) else f"Amount: {amount}")
        self.type_lbl.configure(text=f"Type: {tx_type}")
        self.risk_lbl.configure(text=f"Risk Score: {risk * 100:.1f}%" if risk <= 1.0 else f"Risk Score: {risk:.1f}%")
        self.orig_lbl.configure(text=f"Origin: {data.get('nameOrig', 'N/A')}")
        self.dest_lbl.configure(text=f"Destination: {data.get('nameDest', 'N/A')}")

        # Update Insights Content
        self.results_box.delete("0.0", "end")
        self.results_box.insert("end", f"Policy / Reason: {reason}\n\n")

        xai = data.get("xai_details") or data.get("xai") or data.get("shap_values")
        if xai:
            self.results_box.insert("end", "Top Risk Contributing Factors:\n")
            if isinstance(xai, dict):
                for k, v in xai.items():
                    self.results_box.insert("end", f" • {k}: {v}\n")
            elif isinstance(xai, list):
                for item in xai:
                    self.results_box.insert("end", f" • {item}\n")
            self.results_box.insert("end", "\n")

        if "telemetry" in data:
            self.results_box.insert("end", f"Script Telemetry:\n{data.get('telemetry')}\n")