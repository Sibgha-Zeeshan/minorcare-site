# type: ignore
from libretranslatepy import LibreTranslateAPI

# Try the German mirror
lt = LibreTranslateAPI("https://translate.argosopentech.com/")
result = lt.translate(q="Hello, how are you?", source="en", target="ur")
print(result)
