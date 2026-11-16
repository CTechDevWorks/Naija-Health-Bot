"""Push token validation + notify no-op paths."""

from services.push_notify import notify_new_health_updates
from services.push_store import is_valid_expo_token


def test_expo_token_shape():
    assert is_valid_expo_token("ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]")
    assert is_valid_expo_token("ExpoPushToken[abc]")
    assert not is_valid_expo_token("not-a-token")
    assert not is_valid_expo_token("")


def test_notify_skips_when_no_new_reports():
    result = notify_new_health_updates(count=0)
    assert result["sent"] == 0
    assert result["skipped"] == "no_new_reports"
