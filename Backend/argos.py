# type: ignore
import argostranslate.package
import argostranslate.translate

MODEL_PATH = r"D:\argos-models\translate-en_ur.argosmodel"

# run once (usually during app init)
argostranslate.package.install_from_path(MODEL_PATH)

# now just translate
out = argostranslate.translate.translate("You are doing good work", "en", "ur")
print(out)
