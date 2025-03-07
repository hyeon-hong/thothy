"""Agent authentication & authorization"""

import os
import httpx
import jwt
from jwt.exceptions import InvalidTokenError
from langgraph_sdk import Auth
from datetime import timedelta

"""
Threads
@auth.on.threads.create     Thread creation             ThreadsCreate
@auth.on.threads.read       Thread retrieval            ThreadsRead
@auth.on.threads.update     Thread updates              ThreadsUpdate
@auth.on.threads.delete     Thread deletion             ThreadsDelete
@auth.on.threads.search     Listing threads             ThreadsSearch
@auth.on.threads.create_run Creating or updating a run  RunsCreate

Assistants
@auth.on.assistants.create	Assistant creation  AssistantsCreate
@auth.on.assistants.read	Assistant retrieval AssistantsRead
@auth.on.assistants.update	Assistant updates   AssistantsUpdate
@auth.on.assistants.delete	Assistant deletion  AssistantsDelete
@auth.on.assistants.search	Listing assistants  AssistantsSearch

Crons
@auth.on.crons.create	Cron job creation   CronsCreate
@auth.on.crons.read     Cron job retrieval  CronsRead
@auth.on.crons.update	Cron job updates    CronsUpdate
@auth.on.crons.delete	Cron job deletion   CronsDelete
@auth.on.crons.search	Listing cron jobs   CronsSearch

Use permission-based access
- Normal users can only access their own resources
  - Threads: all
  - Assistants: read, search
  - Crons: all
- Admin users can access all resources
  - Threads: all
  - Assistants: all
  - Crons: all
"""

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
async def auth_authenticate(
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
        print(f"========== payload: {payload}")

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apiKey": SUPABASE_SERVICE_ROLE_KEY,
                },
            )
    except (IndexError, InvalidTokenError, ConnectionError) as e:
        raise AUTH_EXCEPTION from e
    if response.status_code != 200:
        raise AUTH_EXCEPTION

    user_data = response.json()
    scopes = [payload["role"]]
    print(f"========== user_data: {user_data}")
    print(f"========== scopes: {scopes}")

    # TODO: Add permissions to the user
    # "permissions": user_data.get("permissions", []),
    return scopes, {
        "identity": user_data["id"],
        "email": user_data["email"],
        "display_name": user_data.get("user_metadata", {}).get("full_name"),
        "is_authenticated": True,
    }


def _default(ctx: Auth.types.AuthContext, value: dict):
    """Add the owner to the resource metadata and return filters."""

    filters = {"owner": ctx.user.identity}

    metadata = value.setdefault("metadata", {})
    metadata.update(filters)

    return filters


@auth.on
async def auth_on(
        ctx: Auth.types.AuthContext,
        value: Auth.types.Any) -> False:
    """Reject requests that aren't handled by more specific handlers."""
    print(f"========== ctx.resource: {ctx.resource}")
    print(f"========== ctx.action: {ctx.action}")
    print(f"========== ctx.permissions: {ctx.permissions}")
    print(f"========== ctx.user.permissions: {ctx.user.permissions}")

    # Uncomment this only for testing LangGraph Studio
    # if isinstance(ctx.user, Auth.types.StudioUser):
    #     return True

    # Reject all requests by default
    print(f"========== Request to {ctx.path} by {ctx.user.identity}")
    return False


@auth.on.threads.create
async def auth_on_threads_create(
    ctx: Auth.types.AuthContext,
    value: Auth.types.threads.create.value
):
    """Thread creation. This will match only on thread create actions"""
    print(f"========== ctx.resource: {ctx.resource}")
    print(f"========== ctx.action: {ctx.action}")
    print(f"========== ctx.permissions: {ctx.permissions}")
    print(f"========== ctx.user.permissions: {ctx.user.permissions}")

    # Check permission
    # if "threads:create" not in ctx.user.permissions:
    #     raise Auth.exceptions.HTTPException(
    #         status_code=403,
    #         detail="User lacks the required permissions: threads:write."
    #     )

    return _default(ctx, value)


@auth.on.threads.read
async def auth_on_threads_read(
    ctx: Auth.types.AuthContext,
    value: Auth.types.threads.read.value
):
    """Read a thread. This will match only on thread read actions"""
    print(f"========== ctx.resource: {ctx.resource}")
    print(f"========== ctx.action: {ctx.action}")
    print(f"========== ctx.permissions: {ctx.permissions}")
    print(f"========== ctx.user.permissions: {ctx.user.permissions}")

    # if "threads:read" not in ctx.permissions:
    #     raise Auth.exceptions.HTTPException(
    #         status_code=403,
    #         detail="User lacks the required permissions: threads:read."
    #     )

    # Check if the user is the owner of the thread
    return value.get("metadata", {}).get("owner") == ctx.user.identity


@auth.on.threads.update
async def auth_on_threads_update(
    ctx: Auth.types.AuthContext,
    value: Auth.types.threads.update.value
):
    """Update a thread. This will match only on thread update actions"""
    print(f"========== ctx.resource: {ctx.resource}")
    print(f"========== ctx.action: {ctx.action}")
    print(f"========== ctx.permissions: {ctx.permissions}")
    print(f"========== ctx.user.permissions: {ctx.user.permissions}")

    # Check permission
    # if "threads:update" not in ctx.permissions:
    #     raise Auth.exceptions.HTTPException(
    #         status_code=403,
    #         detail="User lacks the required permissions: threads:update."
    #     )

    # Check if the user is the owner of the thread
    return value.get("metadata", {}).get("owner") == ctx.user.identity


@auth.on.threads.delete
async def auth_on_threads_delete(
    ctx: Auth.types.AuthContext,
    value: Auth.types.threads.delete.value
):
    """Delete a thread. This will match only on thread delete actions"""
    print(f"========== ctx.resource: {ctx.resource}")
    print(f"========== ctx.action: {ctx.action}")
    print(f"========== ctx.permissions: {ctx.permissions}")
    print(f"========== ctx.user.permissions: {ctx.user.permissions}")

    # Check permission
    # if "threads:delete" not in ctx.permissions:
    #     raise Auth.exceptions.HTTPException(
    #         status_code=403,
    #         detail="User lacks the required permissions: threads:delete."
    #     )

    # Check if the user is the owner of the thread
    return value.get("metadata", {}).get("owner") == ctx.user.identity


@auth.on.threads.search
async def auth_on_threads_search(
    ctx: Auth.types.AuthContext,
    value: Auth.types.threads.search.value
):
    """Search for threads. This will match only on thread search actions"""
    print(f"========== ctx.resource: {ctx.resource}")
    print(f"========== ctx.action: {ctx.action}")
    print(f"========== ctx.permissions: {ctx.permissions}")
    print(f"========== ctx.user.permissions: {ctx.user.permissions}")

    # if "threads:search" not in ctx.permissions:
    #     raise Auth.exceptions.HTTPException(
    #         status_code=403,
    #         detail="User lacks the required permissions: threads:search."
    #     )

    return value.get("metadata", {}).get("owner") == ctx.user.identity


@auth.on.threads.create_run
async def auth_on_threads_create_run(
    ctx: Auth.types.AuthContext,
    value: Auth.types.threads.create_run.value
):
    """Create a run. This will match only on run create actions"""
    print(f"========== ctx.resource: {ctx.resource}")
    print(f"========== ctx.action: {ctx.action}")
    print(f"========== ctx.permissions: {ctx.permissions}")
    print(f"========== ctx.user.permissions: {ctx.user.permissions}")

    # if "threads:create_run" not in ctx.permissions:
    #     raise Auth.exceptions.HTTPException(
    #         status_code=403,
    #         detail="User lacks the required permissions: threads:create_run."
    #     )

    return value.get("metadata", {}).get("owner") == ctx.user.identity


@auth.on.assistants.create
async def auth_on_assistants_create(
    ctx: Auth.types.AuthContext,
    value: dict,
):
    """Add the owner to the assistant metadata and return filters."""
    print(f"========== ctx.resource: {ctx.resource}")
    print(f"========== ctx.action: {ctx.action}")
    print(f"========== ctx.permissions: {ctx.permissions}")
    print(f"========== ctx.user.permissions: {ctx.user.permissions}")

    # if "assistants:create" not in ctx.permissions:
    #     raise Auth.exceptions.HTTPException(
    #         status_code=403,
    #         detail="User lacks the required permissions: assistants:create."
    #     )

    # TODD: Check admin permissions
    return _default(ctx, value)


@auth.on.assistants.read
async def auth_on_assistants_read(
    ctx: Auth.types.AuthContext,
    value: dict,
):
    """Add the owner to the assistant metadata and return filters."""

    # if "assistants:read" not in ctx.permissions:
    #     raise Auth.exceptions.HTTPException(
    #         status_code=403,
    #         detail="User lacks the required permissions: assistants:read."
    #     )

    return True


@auth.on.assistants.update
async def auth_on_assistants_update(
    ctx: Auth.types.AuthContext,
    value: dict,
):
    """Add the owner to the assistant metadata and return filters."""

    # if "assistants:update" not in ctx.permissions:
    #     raise Auth.exceptions.HTTPException(
    #         status_code=403,
    #         detail="User lacks the required permissions: assistants:update."
    #     )

    return value.get("metadata", {}).get("owner") == ctx.user.identity


@auth.on.assistants.delete
async def auth_on_assistants_delete(
    ctx: Auth.types.AuthContext,
    value: dict,
):
    """Add the owner to the assistant metadata and return filters."""

    # if "assistants:delete" not in ctx.permissions:
    #     raise Auth.exceptions.HTTPException(
    #         status_code=403,
    #         detail="User lacks the required permissions: assistants:delete."
    #     )

    return value.get("metadata", {}).get("owner") == ctx.user.identity


@auth.on.assistants.search
async def auth_on_assistants_search(
    ctx: Auth.types.AuthContext,
    value: dict,
):
    """Add the owner to the assistant metadata and return filters."""

    # if "assistants:search" not in ctx.permissions:
    #     raise Auth.exceptions.HTTPException(
    #         status_code=403,
    #         detail="User lacks the required permissions: assistants:search."
    #     )

    return True

# TODO: Add crons handlers of authentication
