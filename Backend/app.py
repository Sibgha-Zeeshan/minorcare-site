# type: ignore
import os
import tempfile
from pathlib import Path
from typing import List, Union
from urllib.parse import urlparse
from uuid import uuid4

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl

# Importing the pipelines
from MTS import english_audio_to_text, text_to_speech_urdu, translate_en_to_ur
from STM import text_to_speech, translate_audio_to_english

load_dotenv(".env.local")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "messages")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
  raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.")

# Incoming request payload:
class PipelineBase(BaseModel):
  messageId: str
  audioUrl: HttpUrl
  sourceLang: str
  targetLang: str

# Outgoing response payload:
class PipelineResponse(BaseModel):
  messageId: str
  text_translated: str
  translated_audio_url: str

app = FastAPI(title="MinorCare Translation Pipelines", version="1.0.0")

def _extract_storage_location(parsed_url: str) -> tuple[Union[str, None], Union[str, None]]:
  marker = "/storage/v1/object/"

  if marker not in parsed_url:
    return None, None

  _, remainder = parsed_url.split(marker, 1)
  segments = remainder.split("/")

  if not segments:
    return None, None

  if segments[0] in {"public", "authenticated"}:
    segments = segments[1:]

  if not segments:
    return None, None

  bucket = segments[0]
  object_path = "/".join(segments[1:]) if len(segments) > 1 else ""
  return bucket, object_path


# Downloads the original audio file from Supabase to a temporary file on disk.
def _download_remote_audio(url: Union[str, HttpUrl]) -> str:
  url_str = str(url)
  parsed = urlparse(url_str)
  suffix = Path(parsed.path).suffix or ".webm"
  fd, path = tempfile.mkstemp(suffix=suffix)

  try:
    bucket, object_path = _extract_storage_location(parsed.path)

    if bucket and object_path:
      download_url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"
      headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
      }
      response = requests.get(download_url, headers=headers, stream=True, timeout=120)
    else:
      response = requests.get(url_str, stream=True, timeout=120)

    with os.fdopen(fd, "wb") as tmp_file:
      response.raise_for_status()
      for chunk in response.iter_content(chunk_size=1024 * 256):
        if chunk:
          tmp_file.write(chunk)
  except Exception:
    if os.path.exists(path):
      os.remove(path)
    raise

  return path


def _upload_audio_to_storage(file_path: str, message_id: str, target_lang: str) -> str:
  storage_key = f"translations/{message_id}/{target_lang}_{uuid4().hex}.wav"
  upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{storage_key}"
  headers = {
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Content-Type": "audio/wav",
    "x-upsert": "true",
  }

  with open(file_path, "rb") as audio_file:
    response = requests.post(upload_url, headers=headers, data=audio_file.read(), timeout=120)

  if response.status_code not in (200, 201):
    raise HTTPException(status_code=500, detail=f"Failed to upload translated audio: {response.text}")

  return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{storage_key}"


def _update_message_record(message_id: str, translated_text: str, translated_audio_url: str, status: str):
  rest_url = f"{SUPABASE_URL}/rest/v1/messages?id=eq.{message_id}"
  headers = {
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
  }
  payload = {
    "text_translated": translated_text,
    "translated_audio_url": translated_audio_url,
    "translation_status": status,
  }

  response = requests.patch(rest_url, headers=headers, json=payload, timeout=30)

  if response.status_code not in (200, 204):
    raise HTTPException(status_code=500, detail=f"Failed to update message record: {response.text}")


def _set_status(message_id: str, status: str):
  rest_url = f"{SUPABASE_URL}/rest/v1/messages?id=eq.{message_id}"
  headers = {
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
  }

  requests.patch(rest_url, headers=headers, json={"translation_status": status}, timeout=15)


def _cleanup(paths: List[str]):
  for path in paths:
    if path and os.path.exists(path):
      try:
        os.remove(path)
      except OSError:
        pass

# Student To Mentor (URDU TO ENGLISH) Pipeline
@app.post("/pipeline/stm", response_model=PipelineResponse)
def run_stm_pipeline(payload: PipelineBase):
  _set_status(payload.messageId, "processing")

  source_path = _download_remote_audio(payload.audioUrl)
  fd, tts_path = tempfile.mkstemp(suffix=".wav")
  os.close(fd)

  try:
    _, translated_text = translate_audio_to_english(source_path)

    if not translated_text.strip():
      raise HTTPException(status_code=422, detail="No speech detected in provided audio.")

    text_to_speech(translated_text, output_path=tts_path)
    translated_audio_url = _upload_audio_to_storage(tts_path, payload.messageId, payload.targetLang)
    _update_message_record(payload.messageId, translated_text, translated_audio_url, "completed")

    return PipelineResponse(
      messageId=payload.messageId,
      text_translated=translated_text,
      translated_audio_url=translated_audio_url,
    )
  except HTTPException:
    _set_status(payload.messageId, "failed")
    raise
  except Exception as exc:
    _set_status(payload.messageId, "failed")
    raise HTTPException(status_code=500, detail=str(exc)) from exc
  finally:
    _cleanup([source_path, tts_path])

# Mentor To Student (ENGLISH TO URDU) Pipeline
@app.post("/pipeline/mts", response_model=PipelineResponse)
def run_mts_pipeline(payload: PipelineBase):
  _set_status(payload.messageId, "processing")

  source_path = _download_remote_audio(payload.audioUrl)
  fd, tts_path = tempfile.mkstemp(suffix=".wav")
  os.close(fd)

  try:
    _, english_text = english_audio_to_text(source_path)

    if not english_text.strip():
      raise HTTPException(status_code=422, detail="No speech detected in English audio.")

    translated_text = translate_en_to_ur(english_text)
    text_to_speech_urdu(translated_text, output_path=tts_path)
    translated_audio_url = _upload_audio_to_storage(tts_path, payload.messageId, payload.targetLang)
    _update_message_record(payload.messageId, translated_text, translated_audio_url, "completed")

    return PipelineResponse(
      messageId=payload.messageId,
      text_translated=translated_text,
      translated_audio_url=translated_audio_url,
    )
  except HTTPException:
    _set_status(payload.messageId, "failed")
    raise
  except Exception as exc:
    _set_status(payload.messageId, "failed")
    raise HTTPException(status_code=500, detail=str(exc)) from exc
  finally:
    _cleanup([source_path, tts_path])

