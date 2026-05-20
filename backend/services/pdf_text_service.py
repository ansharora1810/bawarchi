import base64

import httpx

_CONVERT_API_URL = "https://v2.convertapi.com/convert/pdf/to/txt"
_CONVERT_API_SECRET = "YQfSkrZvTKtaUGKevMZrTkPMHXu17SS3"


async def extract_text_from_pdf(pdf_bytes: bytes, file_name: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            _CONVERT_API_URL,
            headers={"Authorization": f"Bearer {_CONVERT_API_SECRET}"},
            files={"File": (file_name, pdf_bytes, "application/pdf")},
        )
        response.raise_for_status()
        data = response.json()

    files = data.get("Files") or []
    if not files or "FileData" not in files[0]:
        raise ValueError("ConvertAPI response missing FileData")

    return base64.b64decode(files[0]["FileData"]).decode("utf-8")
