# LangGraph Authentication and Authorization

## Overview

LangGraph Platform provides a flexible authentication and authorization system that can integrate with most authentication schemes. This document serves as a comprehensive guide to implementing security in your LangGraph applications.

## Core Concepts

### Authentication vs Authorization

While often used interchangeably, these terms represent distinct security concepts:

* **Authentication ("AuthN")** verifies _who_ you are. This runs as middleware for every request.
* **Authorization ("AuthZ")** determines _what you can do_. This validates the user's privileges and roles on a per-resource basis.

In LangGraph Platform, authentication is handled by your `@auth.authenticate` handler, and authorization is handled by your `@auth.on` handlers.

## Default Security Models

LangGraph Platform provides different security defaults based on your deployment model:

### LangGraph Cloud

* Uses LangSmith API keys by default
* Requires valid API key in `x-api-key` header
* Can be customized with your auth handler

### Self-Hosted

* No default authentication
* Complete flexibility to implement your security model
* You control all aspects of authentication and authorization

## System Architecture

A typical authentication setup involves three main components:

1. **Authentication Provider** (Identity Provider/IdP)  
   * A dedicated service that manages user identities and credentials
   * Handles user registration, login, password resets, etc.
   * Issues tokens (JWT, session tokens, etc.) after successful authentication
   * Examples: Auth0, Supabase Auth, Okta, or your own auth server

2. **LangGraph Backend** (Resource Server)
   * Your LangGraph application that contains business logic and protected resources
   * Validates tokens with the auth provider
   * Enforces access control based on user identity and permissions
   * Doesn't store user credentials directly

3. **Client Application** (Frontend)
   * Web app, mobile app, or API client
   * Collects time-sensitive user credentials and sends to auth provider
   * Receives tokens from auth provider
   * Includes these tokens in requests to LangGraph backend

Typical authentication flow:
1. Client logs in with the Auth Provider
2. Auth Provider returns a token to the client
3. Client includes this token in requests to LangGraph
4. LangGraph validates the token using the `@auth.authenticate` handler
5. If valid, LangGraph applies access control rules and returns the requested resources

## Implementing Authentication

Authentication in LangGraph runs as middleware on every request. Your `@auth.authenticate` handler receives request information and should:

1. Validate the credentials
2. Return user info containing the user's identity and user information if valid
3. Raise an HTTP exception or AssertionError if invalid

Here's a basic example of an authentication handler:

```python
from langgraph_sdk import Auth

auth = Auth()

@auth.authenticate
async def authenticate(headers: dict) -> Auth.types.MinimalUserDict:
    # Validate credentials (e.g., API key, JWT token)
    api_key = headers.get("x-api-key")
    if not api_key or not is_valid_key(api_key):
        raise Auth.exceptions.HTTPException(
            status_code=401,
            detail="Invalid API key"
        )

    # Return user info - only identity is required
    # Add any additional fields you need for authorization
    return {
        "identity": "user-123",        # Required: unique user identifier
        "is_authenticated": True,      # Optional: assumed True by default
        "permissions": ["read", "write"], # Optional: for permission-based auth
        "role": "admin",               # Optional: for role-based auth
        "org_id": "org-456"            # Optional: for organization-based auth
    }
```

### Supported Parameters

The `@auth.authenticate` handler can accept any of the following parameters by name:

* `request` (Request): The raw ASGI request object
* `body` (dict): The parsed request body
* `path` (str): The request path, e.g., "/threads/abcd-1234-abcd-1234/runs/abcd-1234-abcd-1234/stream"
* `method` (str): The HTTP method, e.g., "GET"
* `path_params` (dict[str, str]): URL path parameters
* `query_params` (dict[str, str]): URL query parameters
* `headers` (dict[bytes, bytes]): Request headers
* `authorization` (str | None): The Authorization header value (e.g., "Bearer token")

## Implementing Authorization

Authorization handlers determine what resources a user can access. You can add resource-specific handlers using the `@auth.on` decorator:

```python
@auth.on
async def add_owner(ctx: Auth.types.AuthContext, value: dict):
    """Add owner to resource metadata and filter by owner."""
    filters = {"owner": ctx.user.identity}
    metadata = value.setdefault("metadata", {})
    metadata.update(filters)
    return filters

# Store-specific authorization
@auth.on.store()
async def authorize_store(ctx: Auth.types.AuthContext, value: dict):
    namespace: tuple = value["namespace"]
    # Ensure user can only access their own resources
    assert namespace[0] == ctx.user.identity, "Not authorized"
```

## Common Access Patterns

### Token-Based Authentication

A simple implementation using token-based authentication:

```python
from langgraph_sdk import Auth

# This is our toy user database. Do not do this in production
VALID_TOKENS = {
    "user1-token": {"id": "user1", "name": "Alice"},
    "user2-token": {"id": "user2", "name": "Bob"},
}

auth = Auth()

@auth.authenticate
async def get_current_user(authorization: str | None) -> Auth.types.MinimalUserDict:
    """Check if the user's token is valid."""
    assert authorization
    scheme, token = authorization.split()
    assert scheme.lower() == "bearer"
    
    # Check if token is valid
    if token not in VALID_TOKENS:
        raise Auth.exceptions.HTTPException(status_code=401, detail="Invalid token")

    # Return user info if valid
    user_data = VALID_TOKENS[token]
    return {
        "identity": user_data["id"],
    }
```

### Single-Owner Resources

Ensure users can only access their own resources:

```python
@auth.on
async def add_owner_filter(ctx: Auth.types.AuthContext, value: dict):
    """Add owner filtering to ensure users can only access their own resources."""
    return {"owner": ctx.user.identity}
```

### Permission-Based Access

Control access based on user permissions:

```python
@auth.on.threads()
async def authorize_threads(ctx: Auth.types.AuthContext, value: dict):
    """Check if user has permission to access threads."""
    if "admin" not in ctx.user.permissions and value["action"] == "delete":
        raise Auth.exceptions.HTTPException(
            status_code=403,
            detail="Requires admin permission"
        )
```

## Configuration

Update your `langgraph.json` file to include the authentication handler:

```json
{
  "dependencies": ["."],
  "graphs": {
    "agent": "./src/agent/graph.py:graph"
  },
  "env": ".env",
  "auth": {
    "path": "src/security/auth.py:auth"
  }
}
```

## Client Connection

From the client side, you need to include the appropriate authentication credentials with your requests:

```python
from langgraph_sdk import Client

# Connect with token-based authentication
client = Client(
    api_url="http://localhost:8000",
    headers={"Authorization": "Bearer user1-token"}
)
```

## Troubleshooting

Common authentication issues:

1. **401 Unauthorized**: The authentication token is missing, expired, or invalid
2. **403 Forbidden**: The user is authenticated but doesn't have permission for the requested resource
3. **Custom Errors**: Check the error details in the response for specific issues

## Best Practices

1. **Never store plain-text credentials** in your LangGraph application
2. Use a dedicated authentication provider for production applications
3. Implement the principle of least privilege - grant only necessary permissions
4. Use HTTPS for all authentication traffic
5. Consider using time-limited tokens with refresh mechanisms
6. Implement proper logging for security events

## Supported Resources

The following LangGraph resources support authorization handlers:

- Threads
- Runs
- Message history
- Store operations
- Custom resources

## Next Steps

For production implementations, consider:

1. Integrating with a third-party identity provider
2. Implementing JWT validation
3. Adding role-based access control
4. Setting up audit logging for security events
5. Regular security testing of your authentication implementation 