# minorcare-site
STM.py contains pipeline of student to mentor ( Urdu to English ) communication.  
MTS.py handles the mentor to student (English to Urdu) direction.  

Run the new FastAPI service (`Backend/app.py`) to expose both pipelines over HTTP so the Next.js app can proxy requests through `/api/pipeline/stm` and `/api/pipeline/mts`. Configure the following environment variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET` (defaults to `messages`)


Backend Run Command:
uvicorn app:app --host 0.0.0.0 --port 8000 --reload