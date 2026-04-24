import pytest
from httpx import AsyncClient

REGISTER_PAYLOAD = {
    "email": "test@example.com",
    "username": "testuser",
    "full_name": "Test User",
    "password": "password123",
    "role": "student",
}


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    resp = await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == REGISTER_PAYLOAD["email"]


@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    await client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    resp = await client.post("/api/auth/login", json={
        "email": REGISTER_PAYLOAD["email"],
        "password": REGISTER_PAYLOAD["password"],
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


@pytest.mark.asyncio
async def test_me(client: AsyncClient):
    reg = await client.post("/api/auth/register", json={**REGISTER_PAYLOAD, "email": "me@test.com", "username": "meuser"})
    token = reg.json()["access_token"]
    resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "me@test.com"
