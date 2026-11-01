#!/usr/bin/env python3
"""Original deterministic music/SFX plus real speech-driven FFmpeg ducking."""
import argparse
import array
import hashlib
import json
import math
import pathlib
import random
import subprocess
import wave

ROOT = pathlib.Path(__file__).resolve().parents[1]
SR = 48000

def write_wav(file, values):
    file.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(file), 'wb') as target:
        target.setparams((1, 2, SR, len(values), 'NONE', 'not compressed'))
        target.writeframes(array.array('h', (int(max(-.98, min(.98, v)) * 32767) for v in values)).tobytes())

def synthesize(project):
    def media_path(file):
        base = (ROOT / 'public').resolve()
        candidate = (base / file).resolve()
        if not candidate.is_relative_to(base) or candidate == base:
            raise ValueError(f'Recurso fora de public/: {file}')
        return candidate
    # Generation is opt-in. Imported recordings are never replaced by synthesis.
    generated = project['audio'].get('musicMode', 'import') == 'generated'
    for field in ['narration', 'music', 'impact', 'whoosh', 'mix']:
        if field in project['audio']:
            media_path(project['audio'][field])
    def decode_clip(file):
        result = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(media_path(file)), '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'], check=True, capture_output=True)
        values = array.array('f')
        values.frombytes(result.stdout)
        return values
    imported_impact = None if generated else decode_clip(project['audio']['impact'])
    imported_whoosh = None if generated else decode_clip(project['audio']['whoosh'])
    seconds = project['durationSeconds']
    count = int(seconds * SR)
    randomizer = random.Random(27)
    music = array.array('f', [0.0]) * count
    fx = array.array('f', [0.0]) * count
    beat = 60 / 108
    # Four original minor chords; no sampled or third-party recordings.
    chords = [(110, 130.8128, 164.8138), (87.3071, 110, 130.8128), (130.8128, 164.8138, 195.9977), (97.9989, 123.4708, 146.8324)]
    for i in range(count if generated else 0):
        t = i / SR
        phase = t % beat
        chord = chords[int(t / (beat * 4)) % 4]
        pad = sum(math.sin(2 * math.pi * f * t) + .3 * math.sin(2 * math.pi * f * 2.003 * t) for f in chord) / 3
        kick = math.sin(2 * math.pi * (46 * phase + 7 * (1 - math.exp(-phase * 42)))) * math.exp(-phase * 20)
        hatphase = t % (beat / 2)
        noise = randomizer.uniform(-1, 1)
        hat = noise * math.exp(-hatphase * 95)
        snarephase = (t + beat) % (beat * 2)
        snare = noise * math.exp(-snarephase * 28)
        envelope = min(1, t / .6, (seconds - t) / 1.3)
        music[i] = (.07 * pad + .16 * kick + .025 * hat + .045 * snare) * max(0, envelope)
    def impact(target, start):
        if imported_impact is not None:
            for i, value in enumerate(imported_impact):
                pos = int(start * SR) + i
                if 0 <= pos < len(target):
                    target[pos] += value
            return
        for i in range(int(SR * .7)):
            pos = int(start * SR) + i
            if 0 <= pos < len(target):
                t = i / SR
                target[pos] += .38 * math.sin(2 * math.pi * (45 * t + 5 * (1 - math.exp(-20 * t)))) * math.exp(-8 * t) + .12 * randomizer.uniform(-1, 1) * math.exp(-20 * t)
    def whoosh(target, start):
        if imported_whoosh is not None:
            for i, value in enumerate(imported_whoosh):
                pos = int(start * SR) + i
                if 0 <= pos < len(target):
                    target[pos] += value
            return
        for i in range(int(SR * .5)):
            pos = int(start * SR) + i
            if 0 <= pos < len(target):
                t = i / SR
                envelope = math.sin(math.pi * t / .5) ** 2
                target[pos] += .12 * randomizer.uniform(-1, 1) * envelope
    impact(fx, 0)
    for scene in project['scenes'][1:]:
        whoosh(fx, max(0, scene['start'] - .18))
        if scene.get('kind') in ('stat', 'reveal'):
            impact(fx, scene['start'])
    directory = media_path(project['audio']['narration']).parent
    musicfile = media_path(project['audio']['music'])
    original_files = []
    if generated:
        write_wav(musicfile, music)
        original_files.append(musicfile)
    elif not musicfile.is_file():
        raise FileNotFoundError(f'Música importada em falta: {musicfile}')
    effectsfile = directory / 'timeline-effects.generated.wav'
    write_wav(effectsfile, fx)
    impactsolo = array.array('f', [0]) * int(SR * .7)
    whooshsolo = array.array('f', [0]) * int(SR * .5)
    impact(impactsolo, 0)
    whoosh(whooshsolo, 0)
    if generated:
        for key, values in [('impact', impactsolo), ('whoosh', whooshsolo)]:
            target = media_path(project['audio'][key])
            write_wav(target, values)
            original_files.append(target)
    narrationfile = media_path(project['audio']['narration'])
    if not narrationfile.is_file():
        raise FileNotFoundError(f'Narração real necessária para misturar: {narrationfile}')
    mixfile = media_path(project['audio'].get('mix', str(pathlib.Path(project['audio']['narration']).with_name('mix.wav'))))
    if mixfile in [narrationfile, musicfile, media_path(project['audio']['impact']), media_path(project['audio']['whoosh'])]:
        raise ValueError('O ficheiro da mistura deve ser diferente de todos os recursos de entrada')
    filters = '[1:a]aresample=48000,loudnorm=I=-16:TP=-2:LRA=7,asplit=2[voice][key];[0:a][key]sidechaincompress=threshold=0.025:ratio=8:attack=15:release=250:makeup=1[duck];[voice][duck][2:a]amix=inputs=3:duration=longest:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[out]'
    command = ['ffmpeg', '-hide_banner', '-y', '-stream_loop', '-1', '-i', str(musicfile), '-i', str(narrationfile), '-i', str(effectsfile), '-filter_complex', filters, '-map', '[out]', '-t', str(seconds), '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_s16le', str(mixfile)]
    result = subprocess.run(command, check=True, capture_output=True, text=True)
    assets = []
    for file in original_files:
        assets.append({'file': str(file.relative_to(ROOT / 'public')), 'creator': 'Football Shorts Studio procedural synthesizer', 'sourceType': 'procedural-original', 'rightsBasis': 'Composição e síntese originais geradas pelo código deste projeto. Sem samples externos.', 'credit': 'Música e efeitos sonoros originais — Football Shorts Studio.', 'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), 'attributionRequired': False})
    for file in [effectsfile, mixfile]:
        assets.append({'file': str(file.relative_to(ROOT / 'public')), 'creator': 'Football Shorts Studio FFmpeg mixer', 'sourceType': 'derived-audio-mix', 'rightsBasis': 'Mistura derivada dos recursos identificados; mantém as licenças, atribuições e restrições das fontes.', 'sources': [project['audio'][key] for key in ['narration', 'music', 'impact', 'whoosh']], 'credit': 'Mistura Football Shorts Studio. Consultar os créditos da voz, música e efeitos de entrada.', 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
    (directory / 'generated-credits.json').write_text(json.dumps({'assets': assets}, indent=2, ensure_ascii=False) + '\n')
    (directory / 'mix-report.json').write_text(json.dumps({'method': 'FFmpeg sidechaincompress driven by normalized actual narration', 'filter': filters, 'durationSeconds': seconds, 'sampleRate': SR, 'channels': 2, 'mixFile': str(mixfile.relative_to(ROOT / 'public')), 'ffmpegLog': result.stderr}, indent=2) + '\n')
    print(f'Mistura real gerada: {mixfile}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--project', default='content/demo.json')
    options = parser.parse_args()
    synthesize(json.loads((ROOT / options.project).read_text()))
