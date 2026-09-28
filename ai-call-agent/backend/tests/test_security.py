"""Unit Tests for Enterprise JWT and Security Utilities."""

from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token


def test_password_hashing_and_verification():
    raw_pw = "EnterpriseSecret123!"
    hashed = get_password_hash(raw_pw)

    assert hashed != raw_pw
    assert verify_password(raw_pw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_generation_and_decoding():
    user_id = "00000000-0000-0000-0000-000000000005"
    token = create_access_token(subject=user_id, role="admin")

    decoded = decode_access_token(token)
    assert decoded["sub"] == user_id
    assert decoded["role"] == "admin"
    assert "exp" in decoded
