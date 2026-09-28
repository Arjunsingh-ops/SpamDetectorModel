"""Unit Tests for Settings and Configuration."""

from app.core.config import Settings


def test_default_settings():
    """Verify default typed settings are loaded cleanly."""
    cfg = Settings(
        ALLOWED_ORIGINS="http://localhost:3000, https://myapp.com",
        ENVIRONMENT="test",
    )
    assert cfg.APP_NAME == "ai-call-agent-backend"
    assert cfg.PORT == 8000
    assert cfg.TELEPHONY_PROVIDER == "mock"
    assert "http://localhost:3000" in cfg.ALLOWED_ORIGINS
    assert "https://myapp.com" in cfg.ALLOWED_ORIGINS


def test_cors_origins_list_parsing():
    """Verify ALLOWED_ORIGINS parses list properly."""
    cfg = Settings(ALLOWED_ORIGINS=["http://localhost:3000"])
    assert cfg.ALLOWED_ORIGINS == ["http://localhost:3000"]
