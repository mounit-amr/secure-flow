import uuid

from fastapi.testclient import TestClient

from Backend.app import app

client = TestClient(app)


def test_register_login_and_app_state_round_trip():
    email = f"newuser_{uuid.uuid4().hex[:8]}@example.com"
    payload = {
        "name": "New User",
        "email": email,
        "phone": "+91 99999 00000",
        "password": "securepass123",
        "securityPin": "5678",
    }

    register_response = client.post("/api/v1/auth/register", json=payload)
    assert register_response.status_code == 200, register_response.text
    created = register_response.json()["user"]
    assert created["email"] == email
    assert created["phone"] == "+91 99999 00000"
    assert register_response.json()["account"]["securityPin"] == "5678"

    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "securepass123"},
    )
    assert login_response.status_code == 200, login_response.text
    assert login_response.json()["user"]["id"] == created["id"]

    state_response = client.get("/api/v1/app-state")
    assert state_response.status_code == 200, state_response.text
    state = state_response.json()
    assert any(user["email"] == email for user in state["users"])
    account = state["accountsByUser"][created["id"]][0]
    assert account["securityPin"] == "5678"

    put_payload = {
        "users": state["users"],
        "accountsByUser": state.get("accountsByUser", {}),
        "allTransactions": state.get("allTransactions", []),
        "settings": {"theme": "dark", "notifications": True},
        "sessionUserId": created["id"],
        "isGlobalFrozen": False,
    }
    put_response = client.put("/api/v1/app-state", json=put_payload)
    assert put_response.status_code == 200, put_response.text

    persisted = client.get("/api/v1/app-state").json()
    assert persisted["settings"]["theme"] == "dark"
    assert persisted["sessionUserId"] == created["id"]
    persisted_user = next(user for user in persisted["users"] if user["id"] == created["id"])
    assert persisted_user["phone"] == "+91 99999 00000"

    same_name_response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "New User",
            "email": f"another_{uuid.uuid4().hex[:8]}@example.com",
            "phone": "+91 88888 00000",
            "password": "securepass123",
            "securityPin": "1234",
        },
    )
    assert same_name_response.status_code == 200, same_name_response.text

    duplicate_email_response = client.post(
        "/api/v1/auth/register",
        json={**payload, "name": "A Different Name"},
    )
    assert duplicate_email_response.status_code == 400
    assert duplicate_email_response.json()["detail"] == "Email already registered"
