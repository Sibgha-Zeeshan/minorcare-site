# type: ignore
model_name = "tts_models/multilingual/multi-dataset/xtts_v2"

from TTS.api import TTS

tts = TTS(model_name)
tts.tts_to_file(
    text="آپ بہت اچھا کام کر رہے ہیں",
    file_path="urdu_testing.wav",
    language="ur"  # important for multilingual models
)
print("saved:", file_path)
