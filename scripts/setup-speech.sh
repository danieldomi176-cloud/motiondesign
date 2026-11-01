#!/usr/bin/env bash
set -euo pipefail
# Models and dependencies are local runtime tools, not committed to Git.
VOICE_VENV="${FOOTBALL_SPEECH_VENV:-/tmp/football-speech-venv}"
VOICE_DIR="${FOOTBALL_MODEL_DIR:-/tmp/football-model}"
python3 -m venv "$VOICE_VENV"
"$VOICE_VENV/bin/pip" install --no-cache-dir --retries 1 --timeout 20 --index-url https://pypi.org/simple 'piper-tts==1.8.0' 'onnx==1.23.2' 'onnxruntime==1.31.1' 'numpy==2.5.4'
mkdir -p "$VOICE_DIR"
curl -fL --retry 1 --connect-timeout 10 --max-time 120 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-pt_BR-faber-medium.tar.bz2 -o "$VOICE_DIR/pt_BR.tar.bz2"
tar -xjf "$VOICE_DIR/pt_BR.tar.bz2" -C "$VOICE_DIR"
printf '%s\n' "Ready. Run $VOICE_VENV/bin/python scripts/generate-speech.py --project content/demo.json --model $VOICE_DIR/vits-piper-pt_BR-faber-medium/pt_BR-faber-medium.onnx"
