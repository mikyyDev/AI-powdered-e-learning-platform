import pytest
from httpx import AsyncClient


TEACHER_PAYLOAD = {
    "email": "unenroll-teacher@example.com",
    "username": "unenrollteacher",
    "full_name": "Unenroll Teacher",
    "password": "password123",
    "role": "teacher",
}

STUDENT_PAYLOAD = {
    "email": "unenroll-student@example.com",
    "username": "unenrollstudent",
    "full_name": "Unenroll Student",
    "password": "password123",
    "role": "student",
}


@pytest.mark.asyncio
async def test_unenroll_free_course_removes_access_and_progress(client: AsyncClient):
    teacher_reg = await client.post("/api/auth/register", json=TEACHER_PAYLOAD)
    teacher_token = teacher_reg.json()["access_token"]
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

    course_resp = await client.post(
        "/api/courses",
        json={
            "title": "Free Python Course",
            "description": "A free course for unenroll testing.",
            "price": 0.0,
            "level": "beginner",
            "category": "programming",
            "is_free": True,
        },
        headers=teacher_headers,
    )
    assert course_resp.status_code == 201
    course_id = course_resp.json()["id"]

    lesson_resp = await client.post(
        f"/api/courses/{course_id}/lessons",
        json={"title": "Lesson 1", "order": 1, "is_free_preview": True},
        headers=teacher_headers,
    )
    assert lesson_resp.status_code == 201
    lesson_id = lesson_resp.json()["id"]

    student_reg = await client.post("/api/auth/register", json=STUDENT_PAYLOAD)
    student_token = student_reg.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    enroll_resp = await client.post(
        "/api/payments/initiate",
        json={"course_id": course_id, "currency": "ETB"},
        headers=student_headers,
    )
    assert enroll_resp.status_code == 200
    assert enroll_resp.json()["enrolled"] is True

    progress_resp = await client.post(
        "/api/enrollments/progress",
        json={"lesson_id": lesson_id, "is_completed": True},
        headers=student_headers,
    )
    assert progress_resp.status_code == 200

    unenroll_resp = await client.delete(
        f"/api/enrollments/{course_id}",
        headers=student_headers,
    )
    assert unenroll_resp.status_code == 204

    enrollments_resp = await client.get("/api/enrollments", headers=student_headers)
    assert enrollments_resp.status_code == 200
    assert all(item["course_id"] != course_id for item in enrollments_resp.json())

    progress_after = await client.post(
        "/api/enrollments/progress",
        json={"lesson_id": lesson_id, "is_completed": True},
        headers=student_headers,
    )
    assert progress_after.status_code == 403