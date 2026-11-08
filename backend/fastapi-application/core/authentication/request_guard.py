from starlette.responses import JSONResponse


class AuthRequestGuard:
    def __init__(self, app, prefixes):
        self.app = app
        self.prefixes = tuple(
            prefix.rstrip("/")
            for prefix in prefixes
        )

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        path = scope["path"]

        protected = any(
            path == prefix or path.startswith(prefix + "/")
            for prefix in self.prefixes
        )

        if not protected:
            return await self.app(scope, receive, send)

        body = bytearray()

        while True:
            message = await receive()

            if message["type"] == "http.disconnect":
                return

            body.extend(message.get("body", b""))

            if len(body) > 8192:
                response = JSONResponse(
                    {"detail": "REQUEST_TOO_LARGE"},
                    status_code=413,
                    headers={"Cache-Control": "no-store"},
                )
                return await response(scope, receive, send)

            if not message.get("more_body", False):
                break

        delivered = False

        async def replay():
            nonlocal delivered

            if not delivered:
                delivered = True
                return {
                    "type": "http.request",
                    "body": bytes(body),
                    "more_body": False,
                }

            return await receive()

        async def private_send(message):
            if message["type"] == "http.response.start":
                headers = [
                    (key, value)
                    for key, value in message.get("headers", [])
                    if key.lower() != b"cache-control"
                ]
                message["headers"] = headers + [
                    (b"cache-control", b"no-store")
                ]

            await send(message)

        await self.app(scope, replay, private_send)