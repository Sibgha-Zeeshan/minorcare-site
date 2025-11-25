# STM Pipeline -> Student To Mentor (URDU TO ENGLISH)
# type: ignore
import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("Missing GROQ_API_KEY. Add it to your .env file.")

# API endpoints
WHISPER_TRANSLATE_URL = "https://api.groq.com/openai/v1/audio/translations"
TTS_URL = "https://api.groq.com/openai/v1/audio/speech"

def translate_audio_to_english(audio_path, model="whisper-large-v3"):
    """
    Step 1: Urdu audio → English text translation (using Whisper)
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

        print(f"Translating {audio_path} to English...")
        response = requests.post(WHISPER_TRANSLATE_URL, headers=headers, files=files, data=data)

    if response.status_code != 200:
        raise RuntimeError(f"Translation failed: {response.status_code}, {response.text}")

    result = response.json()
    translated_text = result.get("text", "")
    print("Translation completed.")
    return result, translated_text


def text_to_speech(text, output_path="output_english.wav", model="playai-tts", voice="Fritz-PlayAI"):
    """
    Step 2: English text → English speech (using Groq TTS)
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

    print(f"Generating English TTS audio...")
    response = requests.post(TTS_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise RuntimeError(f"TTS failed: {response.status_code}, {response.text}")

    with open(output_path, "wb") as f:
        f.write(response.content)

    print(f"TTS completed. Audio saved at {output_path}")


def main():
    # Input audio file (Urdu speech)
    audio_input = "../Bulbul ka Bacha.mp3"

    # Step 1: Translate audio to English
    json_result, english_text = translate_audio_to_english(audio_input)

    # Save JSON output
    with open("translation_output.json", "w", encoding="utf-8") as f:
        json.dump(json_result, f, ensure_ascii=False, indent=2)
    print("Translation JSON saved as translation_output.json")

    # Step 2: Convert translated text to English audio
    if english_text.strip():
        text_to_speech(english_text, "english_output.wav")
        print("Pipeline complete! Audio ready: english_output.wav")
    else:
        print("No translated text found in response.")


if __name__ == "__main__":
    main()
