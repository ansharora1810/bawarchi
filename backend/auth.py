import os

import httpx
from fastapi import Header, HTTPException
from jose import jwt
from jose.exceptions import JWTError

_jwks: dict | None = None


async def _get_jwks() -> dict:
    global _jwks
    if _jwks is None:
        async with httpx.AsyncClient() as client:
            response = await client.get(os.environ["SUPABASE_JWKS_URL"])
            response.raise_for_status()
            _jwks = response.json()
    return _jwks


async def get_current_user_id(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.removeprefix("Bearer ")
    try:
        jwks = await _get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
