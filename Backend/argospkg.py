# type: ignore
import shutil
import os
import argostranslate.package

argostranslate.package.update_package_index()
pkgs = argostranslate.package.get_available_packages()

for p in pkgs:
    if p.from_code == "en" and p.to_code == "ur":
        temp_path = p.download()

        # your custom location
        target_dir = r"D:\argos-models"
        os.makedirs(target_dir, exist_ok=True)

        target_path = os.path.join(target_dir, os.path.basename(temp_path))
        shutil.move(temp_path, target_path)

        argostranslate.package.install_from_path(target_path)
        print("Installed from", target_path)
