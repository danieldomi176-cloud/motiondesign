#!/usr/bin/env bash
set -euo pipefail
VOICE_PYTHON="${FOOTBALL_SPEECH_VENV:-/tmp/football-speech-venv}/bin/python"
if [ ! -x "$VOICE_PYTHON" ]; then
  echo 'Motor de voz em falta. Execute npm run speech:setup ou importe narração e legendas reais.' >&2
  exit 1
fi
exec "$VOICE_PYTHON" scripts/generate-speech.py "$@"
