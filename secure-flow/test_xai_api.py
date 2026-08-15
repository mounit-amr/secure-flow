from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi.testclient import TestClient

from main import app


def main() -> None:
    client = TestClient(app)

    payload = {
        "transaction_id": "tx_smoke_001",
        "velocity_1h": 3.2,
        "new_beneficiary": 1,
        "location_distance_km": 180.0,
        "typing_cadence_variance": 0.9,
        "active_screenshare": 0,
    }

    response = client.post("/api/v1/analyze-transaction", json=payload)
    print("status_code:", response.status_code)
    print("body:", response.json())


if __name__ == "__main__":
    main()
