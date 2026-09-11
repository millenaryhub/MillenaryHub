from __future__ import annotations

import asyncio
import os
import subprocess
import sys
from pathlib import Path


class SeparationError(RuntimeError):
    """Raised when Demucs cannot produce both requested stems."""


class DemucsSeparationService:
    def __init__(self, model_name: str = "htdemucs") -> None:
        self.model_name = model_name

    async def separate(self, input_path: Path, output_dir: Path) -> tuple[Path, Path]:
        output_dir.mkdir(parents=True, exist_ok=True)
        command = [
            sys.executable,
            "-m",
            "demucs.separate",
            "--two-stems=vocals",
            "-n",
            self.model_name,
            "-o",
            str(output_dir),
            str(input_path),
        ]
        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(output_dir),
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            detail = stderr.decode(errors="replace")[-1200:]
            raise SeparationError(f"Demucs processing failed: {detail}")

        stem_dir = output_dir / self.model_name / input_path.stem
        vocals = stem_dir / "vocals.wav"
        instrumental = stem_dir / "no_vocals.wav"
        if not vocals.is_file() or not instrumental.is_file():
            raise SeparationError("Demucs completed without producing both audio stems.")
        return vocals, instrumental


separation_service = DemucsSeparationService(
    model_name=os.getenv("DEMUCS_MODEL", "htdemucs")
)
