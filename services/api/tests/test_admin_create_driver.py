"""POST /api/admin/drivers — admin onboards a driver directly, no OTP needed."""

CREATE_URL = "/api/admin/drivers"


def _payload(**overrides):
    body = {
        "phone": "9812345678",
        "name": "Ravi Kumar",
        "license_no": "TN01 20230012345",
        "license_doc_url": None,
        "pre_verified": True,
    }
    body.update(overrides)
    return {k: v for k, v in body.items() if v is not ...}


def test_create_driver_pre_verified(client, admin_headers):
    res = client.post(CREATE_URL, json=_payload(), headers=admin_headers)
    assert res.status_code == 201, res.text
    driver = res.json()
    # pre_verified → skips the review queue entirely
    assert driver["is_verified"] is True
    assert driver["verification_status"] == "approved"
    assert driver["created_by"] == "admin"
    # Same shape as the GET /api/admin/drivers items
    for key in ("driver_id", "user_id", "name", "phone", "license_no",
                "license_doc_url", "is_online", "rating_avg", "total_trips"):
        assert key in driver
    assert driver["name"] == "Ravi Kumar"
    assert driver["license_no"] == "TN01 20230012345"


def test_create_driver_not_pre_verified_starts_pending(client, admin_headers):
    res = client.post(CREATE_URL, json=_payload(pre_verified=False),
                      headers=admin_headers)
    assert res.status_code == 201, res.text
    driver = res.json()
    assert driver["is_verified"] is False
    assert driver["verification_status"] == "pending"
    assert driver["created_by"] == "admin"


def test_create_driver_normalizes_phone(client, admin_headers):
    res = client.post(CREATE_URL, json=_payload(phone="098765 43210"),
                      headers=admin_headers)
    assert res.status_code == 201, res.text
    assert res.json()["phone"] == "+919876543210"


def test_create_driver_duplicate_phone_conflicts(client, admin_headers):
    assert client.post(CREATE_URL, json=_payload(), headers=admin_headers).status_code == 201
    res = client.post(CREATE_URL, json=_payload(name="Another Ravi"),
                      headers=admin_headers)
    assert res.status_code == 409
    assert "already exists" in res.json()["error"]["message"]


def test_create_driver_duplicate_phone_across_roles(client, admin_headers):
    """Phone is unique per user, not per role — a driver's phone can't become a customer."""
    assert client.post(CREATE_URL, json=_payload(), headers=admin_headers).status_code == 201
    res = client.post("/api/admin/customers",
                      json={"phone": "9812345678", "name": "Imposter"},
                      headers=admin_headers)
    assert res.status_code == 409


def test_create_driver_validation_errors(client, admin_headers):
    # Missing license_no
    res = client.post(CREATE_URL, json=_payload(license_no=...), headers=admin_headers)
    assert res.status_code == 422
    # Missing pre_verified
    res = client.post(CREATE_URL, json=_payload(pre_verified=...), headers=admin_headers)
    assert res.status_code == 422
    # Garbage phone
    res = client.post(CREATE_URL, json=_payload(phone="123abc"), headers=admin_headers)
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "validation_error"


def test_create_driver_requires_admin(client, admin_headers, driver_headers):
    # Driver token → 403
    res = client.post(CREATE_URL, json=_payload(), headers=driver_headers)
    assert res.status_code == 403
    # No token → 401
    assert client.post(CREATE_URL, json=_payload()).status_code == 401


def test_admin_created_driver_can_login_via_otp(client, admin_headers):
    """No OTP at creation, but the normal login flow works afterwards — and it
    must recognize the existing account, not create a second one."""
    assert client.post(CREATE_URL, json=_payload(), headers=admin_headers).status_code == 201

    res = client.post("/api/auth/send-otp", json={"phone": "+919812345678", "email": "919812345678@example.com"})
    assert res.status_code == 200
    otp = res.json()["otp"]
    res = client.post("/api/auth/verify-otp",
                      json={"phone": "+919812345678", "otp": otp, "role": "driver"})
    assert res.status_code == 200, res.text
    assert res.json()["user"]["role"] == "driver"

    listed = client.get("/api/admin/drivers", headers=admin_headers).json()
    assert listed["count"] == 1  # no duplicate account was spawned
