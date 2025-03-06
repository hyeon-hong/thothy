"""Agent authentication & authorization"""

import os
import httpx
import jwt
from jwt.exceptions import InvalidTokenError
from langgraph_sdk import Auth
from datetime import timedelta

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SUPABASE_JWT_SECRET = os.environ["SUPABASE_JWT_SECRET"]
ALGORITHM = "HS256"

AUTH_EXCEPTION = Auth.exceptions.HTTPException(
    status_code=401,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

auth = Auth()


@auth.authenticate
async def get_current_user(
    authorization: str | None,
) -> tuple[list[str], Auth.types.MinimalUserDict]:
    """Validate JWT tokens and extract user information."""

    assert authorization

    try:
        scheme, token = authorization.split()
        assert scheme.lower() == "bearer"

        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM],
            audience="authenticated",
            leeway=timedelta(seconds=60),
        )

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apiKey": SUPABASE_SERVICE_ROLE_KEY,
                },
            )
            assert response.status_code == 200
    except (IndexError, InvalidTokenError, ConnectionError) as e:
        raise AUTH_EXCEPTION from e
    if response.status_code != 200:
        raise AUTH_EXCEPTION

    user_data = response.json()
    scopes = [payload["role"]]

    return scopes, {
        "identity": user_data["id"],
        "email": user_data["email"],
        "display_name": user_data.get("user_metadata", {}).get("full_name"),
        "is_authenticated": True,
    }


@auth.on
async def check_owner(
    ctx: Auth.types.AuthContext,
    value: dict,
):
    """Add the owner to the resource metadata and return filters."""

    if isinstance(ctx.user, Auth.types.StudioUser):
        return None

    filters = {"owner": ctx.user.identity}
    metadata = value.setdefault("metadata", {})
    metadata.update(filters)
    return filters
