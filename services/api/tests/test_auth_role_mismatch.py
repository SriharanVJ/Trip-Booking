"""OTP login must not hand out a token for a different role than the account's.

One phone = one account with one role: verifying an OTP for the driver app with
a phone registered as a customer has to fail with a clear message, not return a
customer-role token that would 403 on every driver call.
"""


def test_role_mismatch_is_rejected(client):
    # Sign up as a customer first
    res = client.post("/api/auth/send-otp", json={"phone": "+918000000003", "email": "918000000003@example.com"})
    otp = res.json()["otp"]
    assert client.post("/api/auth/verify-otp",
                       json={"phone": "+918000000003", "otp": otp, "role": "customer"}
                       ).status_code == 200

    # Now the driver app with the same number
    res = client.post("/api/auth/send-otp", json={"phone": "+918000000003", "email": "918000000003@example.com"})
    otp = res.json()["otp"]
    res = client.post("/api/auth/verify-otp",
                      json={"phone": "+918000000003", "otp": otp, "role": "driver"})
    assert res.status_code == 403
    body = res.json()["error"]
    assert body["code"] == "FORBIDDEN"
    assert "customer" in body["message"]


def test_same_role_still_logs_in(client):
    res = client.post("/api/auth/send-otp", json={"phone": "+918000000004", "email": "918000000004@example.com"})
    otp = res.json()["otp"]
    res = client.post("/api/auth/verify-otp",
                      json={"phone": "+918000000004", "otp": otp, "role": "customer"})
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "customer"
