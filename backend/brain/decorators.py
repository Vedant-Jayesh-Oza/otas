# decorators.py
import requests
import logging
from functools import wraps
from django.http import JsonResponse
from constants import USER_AGENT_AUTHENTICATE_API

logger = logging.getLogger(__name__)


def agent_user_auth_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user_token = request.headers.get("X-OTAS-USER-TOKEN")
        agent_id = request.headers.get("X-OTAS-AGENT-ID")
        project_id = request.headers.get("X-OTAS-PROJECT-ID")

        if not user_token:
            return JsonResponse({"status": 0, "status_description": "missing_user_token"}, status=401)
        if not agent_id:
            return JsonResponse({"status": 0, "status_description": "missing_agent_id"}, status=400)
        if not project_id:
            return JsonResponse({"status": 0, "status_description": "missing_project_id"}, status=400)

        # Call the authenticate API
        try:
            response = requests.post(
                USER_AGENT_AUTHENTICATE_API,
                headers={
                    "X-OTAS-USER-TOKEN": user_token,
                    "X-OTAS-AGENT-ID": agent_id,
                    "X-OTAS-PROJECT-ID": project_id,
                },
                timeout=5,
            )
        except requests.exceptions.Timeout:
            logger.exception("Auth service timeout")
            return JsonResponse({"status": 0, "status_description": "auth_service_timeout"}, status=503)
        except requests.exceptions.RequestException:
            logger.exception("Auth service unreachable")
            return JsonResponse({"status": 0, "status_description": "auth_service_error"}, status=503)

        # Non-200 from auth service → pass it straight back to caller
        if response.status_code != 200:
            print(f"response: {response}")
            return JsonResponse(response.json(), status=response.status_code)

        # Attach auth context to request
        data = response.json()
        request.auth_agent_id = data["agent"]["id"]
        request.auth_agent_name = data["agent"]["name"]
        request.auth_project_id = data["agent"]["project_id"]

        return view_func(request, *args, **kwargs)

    return wrapper