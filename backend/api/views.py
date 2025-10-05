"""HTTP views for the devdebate API.

These view functions implement the core backend behaviour of the hackathon
project. They are intentionally written as plain functions rather than
class‑based views to keep things approachable for beginners. All endpoints
accept and return JSON; the only exception is the transcript download,
which returns a plain text file for the user to save.

Features:
    * Generate a devil's advocate rebuttal from a user‑provided stance using
      a selected persona.
    * Convert generated text to speech via the ElevenLabs API.
    * Transcribe uploaded audio to text via OpenAI's Whisper API.
    * Maintain simple in‑memory session transcripts for a single running
      server process.
    * Provide a way to reset session memory and download the transcript.

Note: This implementation includes calls to external APIs but does not
perform any local audio processing. To run it successfully you must
configure ``OPENAI_API_KEY`` and ``ELEVENLABS_API_KEY`` environment variables
and ensure network connectivity. For hackathon purposes the code serves as
an instructive template and may require adaptation in your environment.
"""
from __future__ import annotations

import io
import json
import os
import re
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
from django.conf import settings
from django.http import FileResponse, HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from dotenv import load_dotenv

from . import BANNED_TOPICS, Persona

# Load env variables if not already loaded (important in case runserver loads settings before views)
load_dotenv()

# In‑memory session storage
# Maps session identifiers (strings) to a list of tuples (role, text)
sessions: Dict[str, List[Tuple[str, str]]] = {}

RESPONSE_WORD_LIMIT = 65


def ensure_session(session_id: Optional[str]) -> str:
    """Ensure there is a session ID and associated transcript list.

    If the provided ``session_id`` is None or not present in the session
    dictionary then a new unique ID is generated. The sessions dict is
    updated accordingly.

    Args:
        session_id: Optional externally supplied session identifier.

    Returns:
        A valid session identifier.
    """
    if session_id and session_id in sessions:
        return session_id
    # Use the provided session_id if given, otherwise generate a new one
    new_id = session_id if session_id else str(uuid.uuid4())
    sessions[new_id] = []
    return new_id


def is_banned(content: str) -> bool:
    """Check if the given content contains banned topics.

    This uses a case‑insensitive substring match on the list of banned
    keywords defined in ``api.__init__.BANNED_TOPICS``.
    """
    lowered = content.lower()
    return any(keyword.lower() in lowered for keyword in BANNED_TOPICS)


def build_persona_prompt(persona: Persona) -> str:
    """Compose the system prompt for the selected persona.

    The system prompt instructs the language model on how to behave. It
    includes a description of the persona plus general guidelines about
    arguing the opposite stance, limiting length and maintaining civility.

    Args:
        persona: One of the defined personas from ``api.Persona``.

    Returns:
        A complete system prompt for the language model.
    """
    return (
        f"You are {persona.name.replace('_', ' ').title()}. "
        f"{persona.system_description} "
        "Your job is to play devil's advocate: always argue the opposite of the user's stance. "
        "Be concise (40-65 words) and return JSON with keys 'rebuttal_text' and 'bullets'."
    )


def call_openai_chat(messages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Call the OpenAI chat completions API to generate a rebuttal.

    You must set the ``OPENAI_API_KEY`` environment variable. If the key is
    not set or the request fails, this function raises an exception.

    Args:
        messages: A list of message dicts following the format required by
            OpenAI's chat completions API.

    Returns:
        The parsed JSON response from the model. Assumes the model responds
        with a JSON object containing 'rebuttal_text' and 'bullets'.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not configured")
    model = os.getenv("OPENAI_MODEL", "gpt-4o")
    with httpx.Client(timeout=60) as client:
        resp = client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.6,
                "response_format": {"type": "json_object"},
                "max_tokens": 300,
            },
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        # remove possible code fences or formatting
        cleaned = content.strip().strip("`")
        # find JSON inside string
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("Model did not return JSON")
        data = json.loads(cleaned[start : end + 1])
        return data


    def call_openai_moderation(text: str) -> Dict[str, Any]:
        """Call OpenAI Moderation endpoint to check user input.

        Returns a dict with keys:
            - flagged: bool
            - categories: optional category details returned by the API

        If OPENAI_API_KEY is not configured, the function returns {'flagged': False}.
        """
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"flagged": False}
        try:
            with httpx.Client(timeout=20) as client:
                resp = client.post(
                    "https://api.openai.com/v1/moderations",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={"model": "omni-moderation-latest", "input": text},
                )
                resp.raise_for_status()
                body = resp.json()
                # Older/newer moderation responses vary; try to read results[0].flagged
                results = body.get("results") or body.get("data")
                if isinstance(results, list) and len(results) > 0:
                    r = results[0]
                    return {"flagged": bool(r.get("flagged")), "categories": r.get("categories", {})}
                return {"flagged": False}
        except Exception:
            # If moderation fails, be conservative and do not block; log via exception in caller.
            return {"flagged": False}


def call_elevenlabs_tts(text: str, voice_id: str = "ZthjuvLPty3kTMaNKVKb") -> str:
    """Call the ElevenLabs API to convert text to speech.

    Returns the URL to the saved audio file relative to MEDIA_URL. The
    resulting MP3 is stored in ``MEDIA_ROOT/tts``. To access the file from
    the front‑end, prefix the returned path with the origin of your Django
    server.

    Args:
        text: The text to convert to speech.
        voice_id: The ID of the ElevenLabs voice to use. See the ElevenLabs
            documentation for available voices. Defaults to ``Rachel``.

    Returns:
        The relative URL of the generated audio file.
    """
    print(f"🎵 Starting TTS generation for text: '{text[:50]}...'")
    api_key = os.getenv("ELEVENLABS_API_KEY")
    print(f"🔑 API Key present: {bool(api_key)}")
    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY not configured")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload = {
        "text": text,
        "model_id": os.getenv("ELEVENLABS_MODEL", "eleven_multilingual_v2"),
        "voice_settings": {
            "stability": 0.5, 
            "similarity_boost": 0.5,
            "speed": 1.2  # Max allowed is 1.2 for this voice
        },
    }
    print(f"📦 Payload being sent:", payload)
    headers = {
        "xi-api-key": api_key,
        "accept": "audio/mpeg",
        "content-type": "application/json",
    }
    with httpx.Client(timeout=60) as client:
        print(f"📡 Calling ElevenLabs API: {url}")
        r = client.post(url, headers=headers, json=payload)
        print(f"📥 Response status: {r.status_code}")
        if r.status_code != 200:
            print(f"❌ Error response body: {r.text}")
        r.raise_for_status()
        # Save mp3
        tts_dir = Path(settings.MEDIA_ROOT) / "tts"
        tts_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid.uuid4().hex}.mp3"
        file_path = tts_dir / filename
        print(f"💾 Saving audio to: {file_path}")
        file_path.write_bytes(r.content)
        print(f"✅ Audio saved successfully ({len(r.content)} bytes)")
        # Return relative URL (MEDIA_URL ensures correct prefix)
        return f"{settings.MEDIA_URL}tts/{filename}"


def call_openai_whisper(audio_bytes: bytes, mime_type: str) -> str:
    """Call the OpenAI Whisper API to transcribe audio.

    Args:
        audio_bytes: Binary audio data.
        mime_type: The MIME type of the audio (e.g. 'audio/webm').

    Returns:
        The transcript as a string.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not configured for STT")
    with httpx.Client(timeout=60) as client:
        files = {
            "file": ("audio", audio_bytes, mime_type),
            "model": (None, "whisper-1"),
        }
        resp = client.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files=files,
        )
        resp.raise_for_status()
        return resp.json().get("text", "")


@csrf_exempt
def rebuttal(request: HttpRequest) -> JsonResponse:
    """Generate a rebuttal for the provided stance and persona.

    Expects a JSON payload with keys ``stance``, ``persona`` and
    optional ``sessionId``. If no session ID is provided, a new one is
    created automatically. The view checks for banned topics in the user
    stance and returns an error if found. Otherwise it calls the language
    model to obtain a rebuttal and stores both the user's stance and the
    rebuttal in the session transcript.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    stance = (body.get("stance") or "").strip()
    persona_str = (body.get("persona") or "socrates").lower()
    session_id = body.get("sessionId")
    if not stance:
        return JsonResponse({"error": "Stance is required"}, status=400)
    # Check for banned topics
    if is_banned(stance):
        return JsonResponse({"error": "The provided stance contains disallowed content."}, status=400)

    # Run moderation check (call OpenAI moderation endpoint if available)
    try:
        mod = call_openai_moderation(stance)
        if mod.get("flagged"):
            return JsonResponse({"blocked": True, "reason": "Content violates safety policy."}, status=200)
    except Exception:
        # If moderation call fails for some reason, continue (we don't want to block due to infra issues)
        pass
    # Validate persona
    try:
        persona = Persona(persona_str)
    except ValueError:
        persona = Persona.SOCRATES
    # Ensure session exists
    sid = ensure_session(session_id)
    # Append user's message to transcript
    sessions[sid].append(("user", stance))
    # Build prompt for OpenAI
    system_prompt = build_persona_prompt(persona)
    # Construct conversation messages: include previous messages for continuity
    messages: List[Dict[str, Any]] = [
        {"role": "system", "content": system_prompt},
    ]
    # Append the transcript as alternating user/assistant messages
    for role, text in sessions[sid]:
        messages.append({"role": role, "content": text})
    # Append a new assistant instruction to ensure correct format
    messages.append(
        {
            "role": "assistant",
            "content": (
                "As a reminder, respond in JSON with keys 'rebuttal_text' and 'bullets'. "
                f"Limit your response to {RESPONSE_WORD_LIMIT} words."
            ),
        }
    )
    # Call language model
    try:
        model_response = call_openai_chat(messages)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    rebuttal_text = model_response.get("rebuttal_text", "")
    bullets = model_response.get("bullets", [])
    # Append assistant's reply to transcript
    sessions[sid].append(("assistant", rebuttal_text))
    
    # Generate TTS audio for the rebuttal
    audio_url = None
    try:
        audio_url = call_elevenlabs_tts(rebuttal_text, voice_id="ZthjuvLPty3kTMaNKVKb")
        print(f"✅ TTS audio generated successfully: {audio_url}")
    except Exception as e:
        # Log error but don't fail the request if TTS fails
        import traceback
        print(f"❌ TTS generation failed: {e}")
        print(f"Full traceback:\n{traceback.format_exc()}")
    
    return JsonResponse({
        "rebuttal_text": rebuttal_text,
        "bullets": bullets,
        "audio_url": audio_url,
        "sessionId": sid,
    })


@csrf_exempt
def tts(request: HttpRequest) -> JsonResponse:
    """Convert text to speech via ElevenLabs.

    Expects JSON payload with a ``text`` key. Optionally accepts a
    ``voiceId`` key to select a specific ElevenLabs voice. Returns a
    JSON object with the relative audio URL. The front‑end should prefix
    this with the server origin when loading the audio.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    text = (body.get("text") or "").strip()
    voice_id = body.get("voiceId", "Rachel")
    if not text:
        return JsonResponse({"error": "Text is required"}, status=400)
    try:
        audio_url = call_elevenlabs_tts(text, voice_id)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"audio_url": audio_url})


@csrf_exempt
def stt(request: HttpRequest) -> JsonResponse:
    """Transcribe uploaded audio via OpenAI Whisper.

    Accepts multipart/form-data where the audio is sent under the field
    ``file``. Returns JSON with a ``transcript`` key. This endpoint is
    optional for hackathon purposes and can be removed if you only support
    text input.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    # Expect a file named 'file'
    audio_file = request.FILES.get("file")
    if not audio_file:
        return JsonResponse({"error": "No audio file provided"}, status=400)
    mime_type = audio_file.content_type or "audio/webm"
    try:
        audio_bytes = audio_file.read()
        transcript = call_openai_whisper(audio_bytes, mime_type)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"transcript": transcript})


@csrf_exempt
def reset_memory(request: HttpRequest) -> JsonResponse:
    """Reset the session transcript.

    Accepts a JSON payload with ``sessionId``. If the session exists, its
    transcript is cleared. Returns a confirmation message.
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST required"}, status=405)
    try:
        body = json.loads(request.body.decode("utf-8"))
    except Exception:
        return JsonResponse({"error": "Invalid JSON"}, status=400)
    session_id = body.get("sessionId")
    if not session_id or session_id not in sessions:
        return JsonResponse({"error": "Invalid session ID"}, status=400)
    sessions[session_id] = []
    return JsonResponse({"message": "Session reset", "sessionId": session_id})


def download_transcript(request: HttpRequest) -> FileResponse:
    """Download the transcript for a session.

    Accepts a query parameter ``sessionId`` and returns a plain text file
    containing the conversation so far. If no session ID is provided or
    the session does not exist, a 404 response is returned.
    """
    session_id = request.GET.get("sessionId")
    if not session_id or session_id not in sessions:
        return FileResponse(io.BytesIO(b"Session not found"), content_type="text/plain", status=404)
    transcript = sessions[session_id]
    lines: List[str] = []
    for role, text in transcript:
        prefix = "User:" if role == "user" else "Opponent:"
        lines.append(f"{prefix} {text}\n")
    content = "".join(lines)
    # Return as a text file
    filename = f"transcript_{session_id}.txt"
    response = FileResponse(io.BytesIO(content.encode("utf-8")), as_attachment=True, filename=filename)
    response["Content-Type"] = "text/plain"
    return response