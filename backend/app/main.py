from __future__ import annotations

import asyncio
import os
import shutil
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from tempfile import gettempdir

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .services.separation import SeparationError, separation_service

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "100")) * 1024 * 1024
JOB_TTL_SECONDS = 30 * 60
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".ogg", ".opus", ".aiff", ".aac"}
JOB_ROOT = Path(gettempdir()) / "millenaryhub-vocal-remover"
JOB_ROOT.mkdir(parents=True, exist_ok=True)


@dataclass
class SeparationJob:
    directory: Path
    vocals: Path
    instrumental: Path
    created_at: float


jobs: dict[str, SeparationJob] = {}
processing_lock = asyncio.Lock()

app = FastAPI(title="MillenaryHub Vocal Remover", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def cleanup_expired_jobs() -> None:
    cutoff = time.time() - JOB_TTL_SECONDS
    for job_id, job in list(jobs.items()):
        if job.created_at < cutoff:
            shutil.rmtree(job.directory, ignore_errors=True)
            jobs.pop(job_id, None)


def safe_suffix(filename: str | None) -> str:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported audio format. Use MP3, WAV, FLAC or another supported format.")
    return suffix


async def save_upload(upload: UploadFile, destination: Path) -> None:
    total = 0
    with destination.open("wb") as output:
        while chunk := await upload.read(1024 * 1024):
            total += len(chunk)
            if total > MAX_UPLOAD_BYTES:
                raise HTTPException(status_code=413, detail="Audio file is too large. Maximum size is 100 MB.")
            output.write(chunk)
    if total == 0:
        raise HTTPException(status_code=400, detail="The uploaded audio file is empty.")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/vocal-remover/separate")
async def separate_audio(file: UploadFile = File(...)) -> dict[str, str]:
    cleanup_expired_jobs()
    if processing_lock.locked():
        raise HTTPException(status_code=409, detail="Another audio separation is already processing. Please wait and try again.")
    suffix = safe_suffix(file.filename)
    job_id = uuid.uuid4().hex
    directory = JOB_ROOT / job_id
    input_path = directory / f"input{suffix}"
    directory.mkdir(parents=True, exist_ok=False)
    try:
        async with processing_lock:
            await save_upload(file, input_path)
            vocals, instrumental = await separation_service.separate(input_path, directory / "output")
        jobs[job_id] = SeparationJob(directory, vocals, instrumental, time.time())
        return {"jobId": job_id, "vocalsUrl": f"/api/vocal-remover/{job_id}/vocals", "instrumentalUrl": f"/api/vocal-remover/{job_id}/instrumental"}
    except HTTPException:
        shutil.rmtree(directory, ignore_errors=True)
        raise
    except SeparationError as error:
        shutil.rmtree(directory, ignore_errors=True)
        raise HTTPException(status_code=422, detail="We could not separate this audio. Check the file and try again.") from error
    except Exception as error:
        shutil.rmtree(directory, ignore_errors=True)
        raise HTTPException(status_code=500, detail="Audio processing failed unexpectedly. Please try again.") from error
    finally:
        await file.close()


def get_job_file(job_id: str, stem: str) -> tuple[Path, str]:
    cleanup_expired_jobs()
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="This separation result has expired. Please process the audio again.")
    if stem == "vocals":
        return job.vocals, "vocals.wav"
    if stem == "instrumental":
        return job.instrumental, "instrumental.wav"
    raise HTTPException(status_code=404, detail="That audio stem does not exist.")


@app.get("/api/vocal-remover/{job_id}/{stem}")
async def download_stem(job_id: str, stem: str) -> FileResponse:
    path, filename = get_job_file(job_id, stem)
    return FileResponse(path, media_type="audio/wav", filename=filename)
