import os
import requests
import time
import sys

def transcribe_mp3(file_path):
    API_KEY = os.getenv('SONIOX_API_KEY')
    if not API_KEY:
        print("Error: SONIOX_API_KEY environment variable not set.")
        sys.exit(1)

    # Verify file exists
    if not os.path.isfile(file_path):
        print(f"Error: The file '{file_path}' does not exist.")
        sys.exit(1)

    # Soniox API endpoints
    FILES_URL = "https://api.soniox.com/v1/files"
    TRANSCRIPTIONS_URL = "https://api.soniox.com/v1/transcriptions"

    headers = {
        "Authorization": f"Bearer {API_KEY}",
    }

    # 1. Upload MP3 file
    try:
        with open(file_path, "rb") as f:
            files = {"file": f}
            print(f"Uploading '{file_path}' to Soniox Files API...")
            upload_resp = requests.post(FILES_URL, headers=headers, files=files)
            upload_resp.raise_for_status()
            file_id = upload_resp.json()["id"]
            print(f"Uploaded successfully. File ID: {file_id}")
    except Exception as e:
        print(f"Failed to upload file: {e}")
        sys.exit(1)

    # 2. Create transcription job
    transcription_request = {
        "model": "stt-async-preview",
        "file_id": file_id,
        "language_hints": ["en"],  # Change language hints if needed
        # You can add more parameters like context, diarization here if desired
    }

    try:
        print("Creating transcription job...")
        transcribe_resp = requests.post(
            TRANSCRIPTIONS_URL,
            headers={**headers, "Content-Type": "application/json"},
            json=transcription_request
        )
        transcribe_resp.raise_for_status()
        transcription_id = transcribe_resp.json()["id"]
        print(f"Transcription job created with ID: {transcription_id}")
    except Exception as e:
        print(f"Failed to create transcription job: {e}")
        sys.exit(1)

    # 3. Poll transcription status until 'completed' or 'error'
    print("Waiting for transcription to complete...")
    try:
        while True:
            status_resp = requests.get(f"{TRANSCRIPTIONS_URL}/{transcription_id}", headers=headers)
            status_resp.raise_for_status()
            status_data = status_resp.json()
            status = status_data["status"]
            print(f"Current status: {status}")
            if status in ["completed", "error"]:
                break
            time.sleep(5)  # Wait before polling again
    except Exception as e:
        print(f"Failed to get transcription status: {e}")
        sys.exit(1)

    if status == "completed":
        # 4. Fetch and print the transcript
        try:
            transcript_resp = requests.get(f"{TRANSCRIPTIONS_URL}/{transcription_id}/transcript", headers=headers)
            transcript_resp.raise_for_status()
            transcript_data = transcript_resp.json()

            text = transcript_data.get("text")
            if text:
                print("\nTranscription Result:\n")
                print(text)
            else:
                # Fallback to concatenating tokens if no full text
                tokens = transcript_data.get("tokens", [])
                transcript_text = " ".join(token["text"] for token in tokens)
                print("\nTranscription Result (from tokens):\n")
                print(transcript_text)
        except Exception as e:
            print(f"Failed to fetch transcript: {e}")
    else:
        print(f"Transcription failed or status: {status}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe_soniox.py <path_to_mp3_file>")
        sys.exit(1)

    mp3_file_path = sys.argv[1]
    transcribe_mp3(mp3_file_path)