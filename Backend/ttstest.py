# type: ignore
from TTS.api import TTS

model_name = "tts_models/multilingual/multi-dataset/xtts_v2"

tts = TTS(model_name, gpu=False)

outfile = "urdu_testing.wav"

tts.tts_to_file(
    text="This is a quick test of the TTS system.",
    file_path="test_en.wav",
    language="en",
    speaker_wav="../English audio.wav",
)

print("saved:", outfile)
