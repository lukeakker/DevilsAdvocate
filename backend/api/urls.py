"""URL configuration for the API component of devdebate.

This module defines the HTTP endpoints that the front‑end will call. Endpoints
return JSON responses for the debate rebuttal, text‑to‑speech (TTS), speech‑
to‑text (STT) and memory reset. All endpoints are prefixed with ``/api/`` as
defined in ``devdebate/urls.py``.

Each view is defined in ``api.views``. If you add new functionality you
should register the corresponding path here.
"""

from django.urls import path

from . import views

urlpatterns = [
    path("rebuttal", views.rebuttal, name="rebuttal"),
    path("tts", views.tts, name="tts"),
    path("stt", views.stt, name="stt"),
    path("reset", views.reset_memory, name="reset"),
    path("download", views.download_transcript, name="download_transcript"),
]