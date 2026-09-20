"""POST /api/admin/customers + GET /api/admin/customers — admin onboards
customers directly and can list/filter them."""

CREATE_URL = "/api/admin/customers"


def test_create_customer(client, admin_headers):
    res = client.post(CREATE_URL, json={"phone": "9870000011", "name": "Priya S"},
                      headers=admin_headers)
    assert res.status_code == 201, res.text
    customer = res.json()
    assert customer["name"] == "Priya S"
    assert customer["phone"] == "+919870000011"  # normalized
    assert customer["pending_dues"] == 0.0
    assert customer["created_by"] == "admin"
    assert customer["created_at"] is not None


def test_create_customer_duplicate_phone_conflicts(client, admin_headers):
    assert client.post(CREATE_URL, json={"phone": "9870000011", "name": "Priya S"},
                       headers=admin_headers).status_code == 201
    # Same number in a different spelling must still be caught
    res = client.post(CREATE_URL, json={"phone": "+91 98700 00011", "name": "Priya Again"},
                      headers=admin_headers)
    assert res.status_code == 409
    assert "already exists" in res.json()["error"]["message"]
    # ...and across roles
    res = client.post("/api/admin/drivers",
                      json={"phone": "9870000011", "name": "Imposter",
                            "license_no": "XX", "pre_verified": True},
                      headers=admin_headers)
    assert res.status_code == 409


def test_create_customer_validation_errors(client, admin_headers):
    assert client.post(CREATE_URL, json={"phone": "9870000012"},
                       headers=admin_headers).status_code == 422  # missing name
    assert client.post(CREATE_URL, json={"name": "No Phone"},
                       headers=admin_headers).status_code == 422  # missing phone
    res = client.post(CREATE_URL, json={"phone": "123abc", "name": "Bad"},
                      headers=admin_headers)
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "validation_error"


def test_create_customer_requires_admin(client, customer_headers):
    res = client.post(CREATE_URL, json={"phone": "9870000013", "name": "Sneak"},
                      headers=customer_headers)
    assert res.status_code == 403
    assert client.post(CREATE_URL, json={"phone": "9870000013", "name": "Sneak"}).status_code == 401


def test_list_customers_search_filter_pagination(client, admin_headers):
    admin_created = [("9870000021", "Arun Kumar"), ("9870000022", "Bala Singh")]
    for phone, name in admin_created:
        assert client.post(CREATE_URL, json={"phone": phone, "name": name},
                           headers=admin_headers).status_code == 201

    # One self-signup customer alongside them
    res = client.post("/api/auth/send-otp", json={"phone": "+918000000002", "email": "918000000002@example.com"})
    otp = res.json()["otp"]
    assert client.post("/api/auth/verify-otp",
                       json={"phone": "+918000000002", "otp": otp, "role": "customer"}
                       ).status_code == 200

    # Unfiltered: both onboarding paths visible, total is accurate
    listed = client.get(CREATE_URL, headers=admin_headers).json()
    assert listed["count"] == 3
    assert listed["total"] == 3

    by_source = {c["phone"]: c["created_by"] for c in listed["customers"]}
    assert by_source["+918000000002"] == "self_signup"
    assert by_source["+919870000021"] == "admin"

    # created_by filter
    only_admin = client.get(f"{CREATE_URL}?created_by=admin", headers=admin_headers).json()
    assert only_admin["total"] == 2
    assert all(c["created_by"] == "admin" for c in only_admin["customers"])

    # Search by phone fragment and by name
    assert client.get(f"{CREATE_URL}?search=9870000021", headers=admin_headers).json()["total"] == 1
    assert client.get(f"{CREATE_URL}?search=arun", headers=admin_headers).json()["total"] == 1

    # Pagination: limit/offset slice without losing the total
    page = client.get(f"{CREATE_URL}?limit=2&offset=0", headers=admin_headers).json()
    assert page["count"] == 2 and page["total"] == 3
    page2 = client.get(f"{CREATE_URL}?limit=2&offset=2", headers=admin_headers).json()
    assert page2["count"] == 1 and page2["total"] == 3
