import pytest
from httpx import AsyncClient

TEACHER_PAYLOAD = {
    "email": "teacher@example.com",
    "username": "teacheruser",
    "full_name": "Teacher User",
    "password": "password123",
    "role": "teacher",
}

COURSE_PAYLOAD = {
    "title": "Python for Beginners",
    "description": "Learn Python from scratch with hands-on projects.",
    "price": 0.0,
    "level": "beginner",
    "category": "programming",
    "is_free": True,
}


@pytest.mark.asyncio
async def test_create_and_list_course(client: AsyncClient):
    reg = await client.post("/api/auth/register", json=TEACHER_PAYLOAD)
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    resp = await client.post("/api/courses", json=COURSE_PAYLOAD, headers=headers)
    assert resp.status_code == 201
    course_id = resp.json()["id"]

    # Publish
    await client.patch(f"/api/courses/{course_id}", json={"is_published": True}, headers=headers)

    # List
    resp = await client.get("/api/courses")
    assert resp.status_code == 200
    titles = [c["title"] for c in resp.json()]
    assert "Python for Beginners" in titles


@pytest.mark.asyncio
async def test_add_lesson_and_roadmap(client: AsyncClient):
    reg = await client.post("/api/auth/register", json={**TEACHER_PAYLOAD, "email": "t2@test.com", "username": "teacher2"})
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    course = await client.post("/api/courses", json=COURSE_PAYLOAD, headers=headers)
    course_id = course.json()["id"]

    # Add lessons
    for i in range(1, 4):
        r = await client.post(f"/api/courses/{course_id}/lessons", json={
            "title": f"Lesson {i}", "order": i, "is_free_preview": i == 1,
        }, headers=headers)
        assert r.status_code == 201

    # Roadmap
    roadmap = await client.get(f"/api/courses/{course_id}/roadmap", headers=headers)
    assert roadmap.status_code == 200
    data = roadmap.json()
    assert data["total_lessons"] == 3
    assert data["lessons"][0]["is_unlocked"] is True


@pytest.mark.asyncio
async def test_lesson_material_upload_and_roadmap_includes_materials(client: AsyncClient):
    reg = await client.post(
        "/api/auth/register",
        json={**TEACHER_PAYLOAD, "email": "materials@test.com", "username": "materials_teacher"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    course = await client.post("/api/courses", json=COURSE_PAYLOAD, headers=headers)
    course_id = course.json()["id"]

    lesson = await client.post(
        f"/api/courses/{course_id}/lessons",
        json={"title": "Lesson 1", "order": 1, "is_free_preview": True},
        headers=headers,
    )
    lesson_id = lesson.json()["id"]

    upload = await client.post(
        f"/api/courses/lessons/{lesson_id}/materials",
        headers=headers,
        files={"file": ("notes.txt", b"hello world", "text/plain")},
        data={"title": "Lesson notes"},
    )
    assert upload.status_code == 201
    material = upload.json()
    assert material["title"] == "Lesson notes"
    assert material["file_url"].startswith("/static/lesson_materials/")

    list_resp = await client.get(f"/api/courses/lessons/{lesson_id}/materials", headers=headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    roadmap = await client.get(f"/api/courses/{course_id}/roadmap", headers=headers)
    assert roadmap.status_code == 200
    lesson_data = roadmap.json()["lessons"][0]
    assert lesson_data["materials"][0]["title"] == "Lesson notes"
