"""Signup/lookup over the API: email is required on every send-otp, unique
across accounts, and flows through to profiles and admin listings.

Runs on the mock provider (conftest pins it) so the OTP is echoed back; the
email-mode delivery hop is covered in test_email_otp_provider.py / the
parametrized lifecycle tests in test_infra_services.py."""

from driver_api.core.config import settings


def _signup(client, phone: str, email: str, role: str = "customer") -> dict:
    """send-otp → verify-otp; returns the verify response body."""
    res = client.post("/api/auth/send-otp", json={"phone": phone, "email": email})
    assert res.status_code == 200, res.text
    otp = res.json()["otp"]  # mock provider echoes
    res = client.post("/api/auth/verify-otp",
                      json={"phone": phone, "otp": otp, "role": role})
    assert res.status_code == 200, res.text
    return res.json()


class TestSendOTPValidation:
    def test_missing_email_is_422(self, client):
        res = client.post("/api/auth/send-otp", json={"phone": "+919876500011"})
        assert res.status_code == 422
        assert res.json()["error"]["code"] == "validation_error"

    def test_malformed_email_is_422(self, client):
        res = client.post("/api/auth/send-otp",
                          json={"phone": "+919876500011", "email": "not-an-email"})
        assert res.status_code == 422

    def test_verify_shape_unchanged(self, client):
        # verify-otp still takes phone+otp+role only — no email field.
        res = client.post("/api/auth/send-otp",
                          json={"phone": "+919876500011", "email": "v@example.com"})
        assert res.status_code == 200
        otp = res.json()["otp"]
        res = client.post("/api/auth/verify-otp",
                          json={"phone": "+919876500011", "otp": otp,
                                "role": "customer", "email": "other@example.com"})
        assert res.status_code == 200, res.text  # extra field ignored (or fail below)


class TestSignup:
    def test_signup_stores_normalized_email(self, client):
        body = _signup(client, "+919876500021", "Driver@Example.com")
        user = body["user"]
        assert user["is_new_user"] is True
        assert user["email"] == "driver@example.com"  # lowercased at app layer

        # Second login on the same phone is no longer a signup
        body = _signup(client, "+919876500021", "driver@example.com")
        assert body["user"]["is_new_user"] is False

    def test_email_taken_by_other_phone_is_409(self, client):
        _signup(client, "+919876500031", "taken@example.com")
        res = client.post("/api/auth/send-otp",
                          json={"phone": "+919876500032", "email": "taken@example.com"})
        assert res.status_code == 409
        assert res.json()["error"]["message"] == \
            "This email is already associated with another account."

    def test_existing_phone_with_mismatched_email_is_409(self, client):
        _signup(client, "+919876500041", "registered@example.com")
        res = client.post("/api/auth/send-otp",
                          json={"phone": "+919876500041", "email": "typo@example.com"})
        assert res.status_code == 409
        assert "different email" in res.json()["error"]["message"]

    def test_existing_phone_with_matching_email_is_ok(self, client):
        _signup(client, "+919876500051", "same@example.com")
        res = client.post("/api/auth/send-otp",
                          json={"phone": "+919876500051", "email": "same@example.com"})
        assert res.status_code == 200

    def test_signup_role_is_kept(self, client):
        body = _signup(client, "+919876500061", "driver1@example.com", role="driver")
        assert body["user"]["role"] == "driver"
        # The driver listing carries the email too
        admin = client.post("/api/admin/login", json={
            "phone": settings.admin_phone, "password": settings.admin_password,
        }).json()["access_token"]
        drivers = client.get("/api/admin/drivers",
                             headers={"Authorization": f"Bearer {admin}"}).json()["drivers"]
        row = next(d for d in drivers if d["phone"] == "+919876500061")
        assert row["email"] == "driver1@example.com"


class TestPlaceholderAdoption:
    """Admin-created rows start with a *@phone.placeholder address; their
    first OTP request adopts the real one."""

    def _admin_headers(self, client) -> dict:
        res = client.post("/api/admin/login", json={
            "phone": settings.admin_phone, "password": settings.admin_password,
        })
        return {"Authorization": f"Bearer {res.json()['access_token']}"}

    def test_admin_created_customer_adopts_email_on_first_otp(self, client):
        admin = self._admin_headers(client)
        res = client.post("/api/admin/customers", headers=admin,
                          json={"phone": "+919876500071", "name": "Legacy"})
        assert res.status_code == 201, res.text
        assert res.json()["email"].endswith("@phone.placeholder")

        # Signup with a real address → adopted, not rejected
        body = _signup(client, "+919876500071", "legacy@example.com")
        assert body["user"]["email"] == "legacy@example.com"

        rows = client.get("/api/admin/customers", headers=admin).json()["customers"]
        row = next(c for c in rows if c["phone"] == "+919876500071")
        assert row["email"] == "legacy@example.com"

    def test_placeholder_adoption_still_respects_taken_emails(self, client):
        admin = self._admin_headers(client)
        client.post("/api/admin/customers", headers=admin,
                    json={"phone": "+919876500081", "name": "Legacy"})
        _signup(client, "+919876500082", "held@example.com")

        res = client.post("/api/auth/send-otp",
                          json={"phone": "+919876500081", "email": "held@example.com"})
        assert res.status_code == 409


class TestProfileEmail:
    def test_customer_can_update_email(self, client, customer_headers):
        res = client.put("/api/customer/profile", headers=customer_headers,
                         json={"name": "Cust", "email": "new@example.com"})
        assert res.status_code == 200, res.text
        assert res.json()["email"] == "new@example.com"

        res = client.get("/api/customer/profile", headers=customer_headers)
        assert res.json()["email"] == "new@example.com"

    def test_customer_email_conflict_with_other_account(self, client, customer_headers):
        _signup(client, "+919876500091", "other@example.com")
        res = client.put("/api/customer/profile", headers=customer_headers,
                         json={"name": "Cust", "email": "other@example.com"})
        assert res.status_code == 409
        assert res.json()["error"]["message"] == \
            "This email is already associated with another account."

    def test_customer_resaving_own_email_is_ok(self, client, customer_headers):
        res = client.put("/api/customer/profile", headers=customer_headers,
                         json={"name": "Cust", "email": "918000000002@example.com"})
        assert res.status_code == 200, res.text

    def test_driver_can_update_email(self, client, driver_headers):
        res = client.put("/api/driver/profile", headers=driver_headers,
                         json={"email": "wheelman@example.com"})
        assert res.status_code == 200, res.text
        assert res.json()["email"] == "wheelman@example.com"


class TestAdminCreateWithEmail:
    def _admin_headers(self, client) -> dict:
        res = client.post("/api/admin/login", json={
            "phone": settings.admin_phone, "password": settings.admin_password,
        })
        return {"Authorization": f"Bearer {res.json()['access_token']}"}

    def test_create_driver_with_email(self, client):
        admin = self._admin_headers(client)
        res = client.post("/api/admin/drivers", headers=admin, json={
            "phone": "+919876500101", "name": "Direct", "license_no": "TN01X0001",
            "pre_verified": True, "email": "direct@example.com",
        })
        assert res.status_code == 201, res.text
        assert res.json()["email"] == "direct@example.com"

    def test_create_customer_with_taken_email_is_409(self, client):
        admin = self._admin_headers(client)
        _signup(client, "+919876500111", "busy@example.com")
        res = client.post("/api/admin/customers", headers=admin, json={
            "phone": "+919876500112", "name": "Clash", "email": "busy@example.com",
        })
        assert res.status_code == 409
        assert res.json()["error"]["message"] == \
            "This email is already associated with another account."
