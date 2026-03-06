import json
import logging
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime
from django.db.models import Count

from decorators import agent_user_auth_required
from .models import BackendEvent
from .utils import validate_agent_session_token, verify_sdk_key, build_event_and_save, validate_agent_key, build_agent_event_and_save

logger = logging.getLogger(__name__)

REQUIRED_FIELDS = ['project_id', 'path', 'method', 'status_code', 'latency_ms']

OPTIONAL_FIELDS = [
    'request_size_bytes', 'response_size_bytes',
    'request_headers', 'request_body', 'query_params', 'post_data',
    'response_headers', 'response_body',
    'request_content_type', 'response_content_type',
    'custom_properties', 'error', 'metadata',
]


@method_decorator(csrf_exempt, name='dispatch')
class BackendEventCaptureView(View):

    def post(self, request, *args, **kwargs):

        sdk_key = request.headers.get('X-OTAS-SDK-KEY')
        if not sdk_key:
            return JsonResponse({
                'status': 0,
                'status_description': 'missing_sdk_key',
            }, status=401)

        project_info = verify_sdk_key(sdk_key)
        if not project_info:
            return JsonResponse({
                'status': 0,
                'status_description': 'invalid_sdk_key',
            }, status=401)

        token = request.headers.get('X-OTAS-AGENT-SESSION-TOKEN')
        if not token:
            return JsonResponse({
                'status': 0,
                'status_description': 'missing_agent_session_token',
            }, status=401)

        token_data = validate_agent_session_token(token)
        if not token_data:
            return JsonResponse({
                'status': 0,
                'status_description': 'invalid_or_expired_token',
            }, status=401)

        try:
            body = json.loads(request.body or '{}')
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 0,
                'status_description': 'invalid_json',
            }, status=400)

        missing = [f for f in REQUIRED_FIELDS if f not in body]
        if missing:
            return JsonResponse({
                'status': 0,
                'status_description': 'missing_required_fields',
                'missing_fields': missing,
            }, status=400)

        try:
            build_event_and_save(token_data, project_info, body, OPTIONAL_FIELDS)
            return JsonResponse({
                'status': 1,
                'status_description': 'event_captured',
                'response': {
                },
            }, status=201)
        except Exception as e:
            logger.exception('Event capture failed')
            return JsonResponse({
                'status': 0,
                'status_description': 'event_capture_failed',
            }, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class AgentEventCaptureView(View):
    """
    OTAS-37: Agent Log API endpoint.
    Agents use this endpoint to send logs/events directly with agent key authentication.
    
    POST /api/v1/backend/log/agent/
    Headers: X-OTAS-AGENT-KEY, X-OTAS-AGENT-SESSION-TOKEN
    """

    def post(self, request, *args, **kwargs):
        agent_key = request.headers.get('X-OTAS-AGENT-KEY')
        if not agent_key:
            return JsonResponse({
                'status': 0,
                'status_description': 'missing_agent_key',
            }, status=401)

        auth_data = validate_agent_key(agent_key)
        if not auth_data:
            return JsonResponse({
                'status': 0,
                'status_description': 'invalid_or_expired_agent_key',
            }, status=401)

        token = request.headers.get('X-OTAS-AGENT-SESSION-TOKEN')
        if not token:
            return JsonResponse({
                'status': 0,
                'status_description': 'missing_agent_session_token',
            }, status=401)

        token_data = validate_agent_session_token(token)
        if not token_data:
            return JsonResponse({
                'status': 0,
                'status_description': 'invalid_or_expired_token',
            }, status=401)

        try:
            body = json.loads(request.body or '{}')
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 0,
                'status_description': 'invalid_json',
            }, status=400)

        missing = [f for f in REQUIRED_FIELDS if f not in body]
        if missing:
            return JsonResponse({
                'status': 0,
                'status_description': 'missing_required_fields',
                'missing_fields': missing,
            }, status=400)

        try:
            event = build_agent_event_and_save(auth_data, body, OPTIONAL_FIELDS)
            return JsonResponse({
                'status': 1,
                'status_description': 'event_captured',
                'response': {
                    'event_id': str(event.event_id),
                },
            }, status=201)
        except Exception as e:
            logger.exception('Agent log capture failed')
            return JsonResponse({
                'status': 0,
                'status_description': 'event_capture_failed',
            }, status=500)


@method_decorator(agent_user_auth_required, name="dispatch")
class AgentPathTimeseriesView(View):
    """
    GET /api/v1/agent/path-timeseries/

    Returns a time-series breakdown of event counts grouped by path for a
    specific agent over a given date range. Intended for rendering line graphs
    showing traffic per endpoint over time.

    Authentication:
        Requires the following headers, validated via agent_user_auth_required:
            X-OTAS-USER-TOKEN  : JWT token identifying the user
            X-OTAS-AGENT-ID    : UUID of the agent
            X-OTAS-PROJECT-ID  : UUID of the project the agent belongs to

    Query Parameters:
        start_date (str): Start of the date range in YYYY-MM-DD format (inclusive).
        end_date   (str): End of the date range in YYYY-MM-DD format (inclusive).

    Success Response (200):
        {
            "status": 1,
            "agent_id": "<agent_uuid>",
            "project_id": "<project_uuid>",
            "paths": [
                {
                    "path": "/example/api/",
                    "data": [
                        { "date": "2026-03-01", "count": 10 },
                        { "date": "2026-03-02", "count": 7 }
                    ]
                }
            ]
        }

        Notes:
            - Only dates that have at least one event are included (no zero-fill).
            - Paths are ordered alphabetically.
            - Dates within each path are ordered ascending.

    Error Responses:
        400 - missing_dates        : start_date or end_date not provided.
        400 - invalid_date_format  : Dates are not in YYYY-MM-DD format.
        400 - invalid_date_range   : start_date is after end_date.
        401 - missing_user_token   : X-OTAS-USER-TOKEN header is absent.
        400 - missing_agent_id     : X-OTAS-AGENT-ID header is absent.
        400 - missing_project_id   : X-OTAS-PROJECT-ID header is absent.
        403 - forbidden            : User does not have access to the project.
        404 - agent_not_found      : Agent does not exist or is inactive.
        503 - auth_service_timeout : UASAM auth service did not respond in time.
        503 - auth_service_error   : UASAM auth service is unreachable.
        500 - server_error         : Unexpected internal error.
    """

    def get(self, request):
        try:
            agent_id = request.auth_agent_id
            start_date = request.GET.get("start_date")
            end_date = request.GET.get("end_date")

            if not start_date or not end_date:
                return JsonResponse(
                    {"status": 0, "status_description": "start_date and end_date are required"},
                    status=400,
                )

            try:
                start = datetime.strptime(start_date, "%Y-%m-%d").date()
                end = datetime.strptime(end_date, "%Y-%m-%d").date()
            except ValueError:
                return JsonResponse(
                    {"status": 0, "status_description": "dates must be in YYYY-MM-DD format"},
                    status=400,
                )

            if start > end:
                return JsonResponse(
                    {"status": 0, "status_description": "start_date must be before or equal to end_date"},
                    status=400,
                )

            qs = (
                BackendEvent.objects.filter(
                    agent_id=agent_id,
                    event_date__gte=start,
                    event_date__lte=end,
                )
                .values("path", "event_date")
                .annotate(count=Count("event_id"))
                .order_by("path", "event_date")
            )

            path_map = {}
            for row in qs:
                path = row["path"]
                if path not in path_map:
                    path_map[path] = []
                path_map[path].append({
                    "date": row["event_date"].isoformat(),
                    "count": row["count"],
                })

            result = [
                {"path": path, "data": data}
                for path, data in path_map.items()
            ]

            return JsonResponse(
                {
                    "status": 1,
                    "agent_id": agent_id,
                    "project_id": request.auth_project_id,
                    "paths": result,
                },
                status=200,
            )

        except Exception:
            logger.exception("AgentPathTimeseriesView failed")
            return JsonResponse({"status": 0, "status_description": "server_error"}, status=500)