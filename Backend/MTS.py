# type: ignore
import os
import json
import requests
import argostranslate.package
import argostranslate.translate
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("Missing GROQ_API_KEY. Add it to your .env file.")


# API endpoints
WHISPER_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
TTS_URL = "https://api.groq.com/openai/v1/audio/speech"


# Argos local model
MODEL_PATH = r"D:\argos-models\translate-en_ur.argosmodel"
argos_loaded = False


def load_argos():
    global argos_loaded
    if argos_loaded:
        return
    argostranslate.package.install_from_path(MODEL_PATH)
    argos_loaded = True


def english_audio_to_text(audio_path, model="whisper-large-v3"):
    """
    Step 1: English audio → English text
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    with open(audio_path, "rb") as audio_file:
        files = {
            "file": audio_file
        }
        data = {
            "model": model,
            "response_format": "json"
        }

        print(f"Transcribing {audio_path}...")
        response = requests.post(WHISPER_STT_URL, headers=headers, files=files, data=data)

    if response.status_code != 200:
        raise RuntimeError(f"Transcription failed: {response.status_code}, {response.text}")

    result = response.json()
    english_text = result.get("text", "")
    print("Transcription done.")
    return result, english_text


def translate_en_to_ur(text):
    """
    Step 2: English text → Urdu text (local Argos)
    """
    load_argos()
    return argostranslate.translate.translate(text, "en", "ur")


def text_to_speech_urdu(text, output_path="output_urdu.wav", model="playai-tts", voice="Fritz-PlayAI"):
    """
    Step 3: Urdu text → Urdu speech (TTS)
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }

    payload = {
        "model": model,
        "voice": voice,
        "input": text,
        "response_format": "wav"
    }

    print("Generating Urdu TTS audio...")
    response = requests.post(TTS_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise RuntimeError(f"TTS failed: {response.status_code}, {response.text}")

    with open(output_path, "wb") as f:
        f.write(response.content)

    print(f"Urdu audio saved at {output_path}")


def main():
    audio_input = "../English audio.wav"

    # Step 1: English audio → English text
    json_result, english_text = english_audio_to_text(audio_input)

    with open("en_to_ur_stt_output.json", "w", encoding="utf-8") as f:
        json.dump(json_result, f, ensure_ascii=False, indent=2)
    print("STT JSON saved.")

    if not english_text.strip():
        print("No transcription text found.")
        return

    # Step 2: English text → Urdu text
    urdu_text = translate_en_to_ur(english_text)
    print("Translated:", urdu_text)

    # Save text
    with open("en_to_ur_output.txt", "w", encoding="utf-8") as f:
        f.write(urdu_text)

    # Step 3: Urdu text → Urdu TTS
    text_to_speech_urdu(urdu_text, "urdu_output.wav")
    print("Pipeline complete. Audio ready.")


if __name__ == "__main__":
    main()
