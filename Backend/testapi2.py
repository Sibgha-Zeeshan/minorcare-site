# type: ignore
import os
import json
import asyncio
import requests
from dotenv import load_dotenv
import edge_tts
import ssl
import aiohttp

# Load your Groq API key
load_dotenv(".env.local")  # or change to ".env" if needed
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("Missing GROQ_API_KEY. Add it to your .env file.")

# Groq API endpoint
WHISPER_TRANSLATE_URL = "https://api.groq.com/openai/v1/audio/translations"

# --------------------------------------------------
# STEP 1: Urdu → English translation (Groq Whisper)
# --------------------------------------------------
def translate_audio_to_english(audio_path, model="whisper-large-v3"):
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
    with open(audio_path, "rb") as audio_file:
        files = {"file": audio_file}
        data = {"model": model, "response_format": "json"}

        print(f"🎙 Translating '{audio_path}' to English...")
        response = requests.post(WHISPER_TRANSLATE_URL, headers=headers, files=files, data=data)

    if response.status_code != 200:
        raise RuntimeError(f"Translation failed: {response.status_code}, {response.text}")

    result = response.json()
    english_text = result.get("text", "").strip()
    print("✅ Translation complete.")
    return result, english_text


# --------------------------------------------------
# STEP 2: English text → English speech (Edge TTS)
# --------------------------------------------------
async def text_to_speech_edge(text, output_path="english_output.mp3", voice="en-US-AriaNeural"):
    if not text:
        raise ValueError("No text provided for TTS.")
    
    print(f"🔊 Generating English speech using Edge TTS ({voice})...")
    communicate = edge_tts.Communicate(text, voice)
    ssl_context = ssl._create_unverified_context()

    async with aiohttp.ClientSession(connector=aiohttp.TCPConnector(ssl=ssl_context)) as session:
     communicate = edge_tts.Communicate(text, voice, session=session)
    await communicate.save(output_path)
    await communicate.save(output_path)
    print(f"✅ TTS done. Audio saved at '{output_path}'")


# --------------------------------------------------
# STEP 3: Combine both steps in a pipeline
# --------------------------------------------------
def main():
    audio_input = "../Bulbul ka Bacha.mp3"  # Replace with your Urdu file path

    # Step 1: Translate to English
    json_result, english_text = translate_audio_to_english(audio_input)

    # Save the JSON result for reference
    with open("translation_output.json", "w", encoding="utf-8") as f:
        json.dump(json_result, f, ensure_ascii=False, indent=2)
    print("📄 Saved translation_output.json")

    # Step 2: Convert translated text to speech
    if english_text:
        asyncio.run(text_to_speech_edge(english_text, "english_output.mp3"))
        print("🎧 Full pipeline complete. Output file: english_output.mp3")
    else:
        print("⚠️ No text returned from translation.")


if __name__ == "__main__":
    main()
