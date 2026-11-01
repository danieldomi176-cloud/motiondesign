#!/usr/bin/env python3
"""Original AGEXA score and restrained sound design. No external samples.

python3 scripts/agexa-audio.py
python3 scripts/agexa-audio.py --narration recording.wav --short-narration short.wav

Optional narration is imported unchanged in time and pitch. The operator must
supply a licensed recording and keep it aligned with the production cue sheet.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import pathlib
import re
import subprocess
import wave
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / 'public' / 'agexa' / 'audio'
SR = 48000
TAU = 2 * np.pi


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def stereo(x, pan=0.0):
    # Equal-power panning; width is authored per part instead of artificial Haas delay.
    angle = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    return np.column_stack((x * np.cos(angle), x * np.sin(angle)))


def add(track, clip, time):
    start = round(time * SR)
    if start >= len(track):
        return
    end = min(len(track), start + len(clip))
    if end > start:
        track[start:end] += clip[:end-start]


def fade(x, attack=.015, release=.05):
    a = min(len(x), round(attack * SR)); r = min(len(x), round(release * SR))
    env = np.ones(len(x), dtype=np.float32)
    if a:
        env[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    if r:
        env[-r:] *= np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return x * env


def bell(note, length=1.2, amp=.15, pan=0.0, soft=False):
    t = np.arange(round(length * SR), dtype=np.float64) / SR
    f = midi(note)
    x = np.zeros(len(t), dtype=np.float64)
    for ratio, level, decay in [(1,1,3.2),(2.002,.21,5.5),(3.97,.055,9.5),(6.11,.012,18)]:
        x += level * np.sin(TAU * f * ratio * t) * np.exp(-t * decay)
    x = fade(x, .012 if soft else .004, .11)
    return stereo((amp * x).astype(np.float32), pan)


def tick(length=.08, amp=.035, pan=0.0):
    t = np.arange(round(length * SR), dtype=np.float64) / SR
    x = np.sin(TAU * (1250 * t + 28 * (1 - np.exp(-t * 75)))) * np.exp(-t * 80)
    x += .15 * np.sin(TAU * 2700 * t) * np.exp(-t * 110)
    return stereo(fade((x * amp).astype(np.float32), .002, .02), pan)


def low_pulse(length=.55, amp=.14, pan=0.0):
    t = np.arange(round(length * SR), dtype=np.float64) / SR
    x = np.sin(TAU * (42 * t + 2.8 * (1 - np.exp(-t * 20)))) * np.exp(-t * 9)
    x += .16 * np.sin(TAU * 86 * t) * np.exp(-t * 18)
    return stereo(fade((x * amp).astype(np.float32), .004, .1), pan)


def air(length=.65, amp=.035, pan=0.0, seed=42, reverse=False):
    # A short band-limited breath; no sharp wide-band white-noise explosions.
    rng = np.random.default_rng(seed)
    x = rng.normal(size=round(length * SR))
    spectrum = np.fft.rfft(x)
    bins = np.fft.rfftfreq(len(x), 1/SR)
    spectrum *= np.exp(-((bins - 1350) / 850)**2)
    x = np.fft.irfft(spectrum, n=len(x))
    x /= max(1e-8, np.max(np.abs(x)))
    phase = np.linspace(0, np.pi, len(x))
    x *= np.sin(phase)**2
    if reverse:
        x = x[::-1]
    return stereo((x * amp).astype(np.float32), pan)


def pad(notes, length, amp=.048, bright=False):
    t = np.arange(round(length * SR), dtype=np.float64) / SR
    result = np.zeros((len(t),2), dtype=np.float32)
    for i,note in enumerate(notes):
        f = midi(note)
        # Slight detuning per channel gives a restrained stereo studio-pad texture.
        left = np.sin(TAU * f * t + .07*i) + .12*np.sin(TAU*2.001*f*t)
        right = np.sin(TAU * f * 1.0007 * t + .1*i) + .12*np.sin(TAU*1.999*f*t)
        if bright:
            left += .035*np.sin(TAU*4*f*t); right += .035*np.sin(TAU*4.001*f*t)
        env = np.minimum(1,t/.48) * np.minimum(1,np.maximum(0,length-t)/.85)
        env *= .94 + .06*np.sin(TAU*.16*t+i)
        result[:,0] += (left*env*amp/len(notes)).astype(np.float32)
        result[:,1] += (right*env*amp/len(notes)).astype(np.float32)
    return result


def signature(length=2.4, amp=.2):
    clip = np.zeros((round(length * SR),2), dtype=np.float32)
    for note,time,gain,pan in [(78,0,1,-.22),(81,.15,.8,.1),(85,.32,.75,.22),(88,.56,.45,0)]:
        add(clip,bell(note,1.7,amp*gain,pan,soft=True),time)
    add(clip,low_pulse(.7,amp*.24),0)
    return clip


def notification(amp=.13, pan=-.2):
    clip = np.zeros((round(.95*SR),2),dtype=np.float32)
    add(clip,bell(83,.85,amp,pan),0)
    add(clip,bell(88,.75,amp*.58,-pan),.12)
    return clip


def confirmation(amp=.14):
    clip=np.zeros((round(1.3*SR),2),dtype=np.float32)
    for n,at,a,p in [(81,0,1,-.12),(85,.09,.75,0),(90,.22,.55,.16)]:
        add(clip,bell(n,1.05,amp*a,p,soft=True),at)
    return clip


def score(duration, short=False):
    music=np.zeros((round(duration*SR),2),dtype=np.float32)
    fx=np.zeros_like(music)
    beat=.6  # Original 100 BPM score.
    reveal=3 if short else 10
    # F-sharp tension opens into Dmaj9, F#m7, Aadd9, Eadd9, then an A6 resolve.
    if short:
        blocks=[(0,3,[42,49,61],False),(3,6,[50,57,61,64,69],True),
                (6,9.3,[42,57,61,64],True),(9.3,12,[45,52,59,61,64],True),
                (12,15,[45,52,57,61,66],True)]
    else:
        blocks=[(0,4,[42,49,61],False),(4,7.2,[42,55,61],False),
                (7.2,10,[43,54,61],False),(10,15,[50,57,61,64,69],True),
                (15,19.8,[42,57,61,64],True),(19.8,24.6,[50,57,61,64,69],True),
                (24.6,29.4,[45,52,59,61,64],True),(29.4,33,[52,59,64,66,68],True),
                (33,37,[45,52,57,61,66],True),(37,40,[45,52,57,61,66],True)]
    for i,(start,end,notes,bright) in enumerate(blocks):
        add(music,pad(notes,end-start+.6,.105 if bright else .09,bright),start)
        # Low sine bass carries an audible pitch even on small speakers through its overtone.
        t=np.arange(round((end-start)*SR),dtype=np.float64)/SR
        bass=(np.sin(TAU*midi(notes[0])*t)+.22*np.sin(TAU*midi(notes[0])*2*t))
        bass=fade((bass*.035).astype(np.float32),.1,.28)
        add(music,stereo(bass,0),start)
    # Metered low pulse, delayed onset and lower density after the closing CTA.
    for j in range(math.ceil(duration/beat)):
        at=j*beat
        if abs(at-reveal)<.5: continue
        if at>duration-1.5: continue
        amp=.052 if at<reveal else .036
        if at>duration-7: amp*=.8
        add(music,low_pulse(.45,amp),at)
        if at>reveal+.7 and at<duration-3:
            add(music,tick(.065,.012,(-1 if j%2 else 1)*.18),at+beat/2)
    # A signature motif is restated as a quiet glass arpeggio in the positive product section.
    arpstart=5.8 if short else 15.4
    arpend=10 if short else 32
    arpnotes=[78,81,85,88,85,81,76,80]
    for j,at in enumerate(np.arange(arpstart,arpend,beat/2)):
        add(music,bell(arpnotes[j%len(arpnotes)],.95,.015,math.sin(j*.8)*.45,soft=True),float(at))
    # Deliberate brief breath immediately before the brand reveal.
    t=np.arange(len(music))/SR
    pause_start=reveal-.35
    envelope=np.ones(len(music))
    envelope[(t>=pause_start)&(t<reveal-.05)]=.035
    ramp=(t>=reveal-.05)&(t<reveal+.12)
    envelope[ramp]=np.linspace(.035,1,ramp.sum())
    music*=envelope[:,None]
    music*=np.minimum(1,t/.24)[:,None]
    music*=np.minimum(1,np.maximum(0,duration-t)/1.05)[:,None]
    # Notification accumulation, clock, then an ordered confirmation language.
    n_times=[.3,1.13,1.95] if short else [.34,1.2,2.05,3.1,4.25,5.15]
    for j,at in enumerate(n_times):
        add(fx,notification(.085+j*.005,(-1 if j%2 else 1)*.27),at)
    clock_start,clock_end=(1.8,2.7) if short else (6,9.55)
    clock=clock_start; i=0
    while clock<clock_end:
        fraction=(clock-clock_start)/(clock_end-clock_start)
        add(fx,tick(.055,.023+fraction*.007,(-1 if i%2 else 1)*.16),clock)
        clock+=.28-.19*fraction;i+=1
    add(fx,air(.72,.038,seed=9),reveal-.25)
    add(fx,signature(2.4,.125),reveal+.15)
    click_times=[5.35,6.65,8,9.25] if short else [15.8,18.6,21,23,25.2,27.2,29.2,31.4]
    for j,at in enumerate(click_times):
        add(fx,tick(.09,.025,math.sin(j)*.2),at)
        if j in (0,3):add(fx,bell(85+j,1.0,.03,.15,soft=True),at)
    add(fx,confirmation(.095),9.3 if short else 24)
    cta=10.5 if short else 33
    add(fx,air(.55,.028,seed=99),cta-.15)
    add(fx,low_pulse(.7,.085),cta)
    add(fx,signature(2.3,.12),11 if short else 34)
    add(fx,signature(1.8,.09),13.15 if short else 38)
    fx*=np.minimum(1,np.maximum(0,duration-t)/.6)[:,None]
    return music,fx


def write(file, signal):
    file.parent.mkdir(parents=True,exist_ok=True)
    if np.max(np.abs(signal))>=.98:
        raise ValueError(f'Clipping in authored source {file}: {np.max(np.abs(signal))}')
    with wave.open(str(file),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(SR)
        f.writeframes((np.clip(signal,-1,1)*32767).astype('<i2').tobytes())


def run(args):
    result=subprocess.run(args,encoding='utf8',capture_output=True,check=True)
    return result.stderr


def master(inputs,destination,duration,narration=None):
    command=['ffmpeg','-hide_banner','-y']
    for file in inputs: command+=['-i',str(file)]
    if narration:
        narration=pathlib.Path(narration).resolve()
        meta=subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(narration)],text=True)
        if float(json.loads(meta)['format']['duration'])>duration+.02:
            raise ValueError('Narration exceeds target duration. Record to the supplied cue sheet; audio will not be sped up or cut.')
        command+=['-i',str(narration)]
        graph=f'[0:a]volume=.85[bed];[2:a]aresample=48000,loudnorm=I=-16:TP=-2:LRA=8,apad=whole_dur={duration},asplit=2[voice][key];[bed][key]sidechaincompress=threshold=.025:ratio=7:attack=15:release=280[duck];[duck][1:a][voice]amix=inputs=3:duration=longest:normalize=0'
    else:
        graph='[0:a][1:a]amix=inputs=2:duration=longest:normalize=0'
    first=run(command+['-filter_complex',graph+',loudnorm=I=-16:TP=-1.5:LRA=8:print_format=json','-t',str(duration),'-f','null','-'])
    data=json.loads(re.findall(r'\{\s*"input_i".*?\}',first,re.S)[-1])
    norm=f"loudnorm=I=-16:TP=-1.5:LRA=8:measured_I={data['input_i']}:measured_LRA={data['input_lra']}:measured_TP={data['input_tp']}:measured_thresh={data['input_thresh']}:offset={data['target_offset']}:linear=true:print_format=json"
    final=run(command+['-filter_complex',graph+','+norm,'-t',str(duration),'-ar',str(SR),'-ac','2','-c:a','pcm_s16le',str(destination)])
    return {'inputLoudness':data,'masteringLog':final,'narrationProvided':bool(narration)}


def inspect(file):
    with wave.open(str(file)) as f:
        sr=f.getframerate();channels=f.getnchannels();samples=f.getnframes()
        data=np.frombuffer(f.readframes(samples),dtype='<i2').reshape(-1,channels).astype(np.float32)/32768
    # There must be audible audio in the output; music deliberately breathes for <0.4 s.
    windows=[float(np.sqrt(np.mean(chunk*chunk))) for chunk in np.array_split(data,math.ceil(samples/(sr*.5)))]
    analysis=run(['ffmpeg','-hide_banner','-i',str(file),'-af','loudnorm=I=-16:TP=-1.5:LRA=8:print_format=json','-f','null','-'])
    loudness=json.loads(re.findall(r'\{\s*"input_i".*?\}',analysis,re.S)[-1])
    return {'durationSeconds':samples/sr,'sampleRate':sr,'channels':channels,'peakDbFS':float(20*np.log10(max(1e-9,np.max(np.abs(data))))),'rmsDbFS':float(20*np.log10(max(1e-9,np.sqrt(np.mean(data*data))))),'minimumHalfSecondRmsDbFS':float(20*np.log10(max(1e-9,min(windows)))),'measuredIntegratedLUFS':float(loudness['input_i']),'measuredTruePeakDbTP':float(loudness['input_tp']),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()}


def make_docs():
    doc=ROOT/'docs'/'agexa';doc.mkdir(parents=True,exist_ok=True)
    main=[(0,4,'O teu negócio pode estar a perder clientes sem perceber.'),
          (4,10,'Mensagens acumuladas. Horários confundidos. Marcações esquecidas.'),
          (10,15,'Está na hora de organizar tudo de outra forma.'),
          (15,25,'Com o Agexa, os teus clientes podem escolher um serviço, encontrar um horário disponível e fazer a marcação online.'),
          (25,33,'E tu acompanhas as marcações e organizas os teus serviços num só lugar.'),
          (33,40,'Tens um negócio? Experimenta o Agexa. Solicita uma demonstração.')]
    short=[(0,3,'Marcações a acumular?'),(3,5.5,'Há uma forma mais simples.'),
           (5.5,10,'Agexa. Os clientes escolhem e agendam online.'),(10,15,'Tens um negócio? Solicita uma demonstração.')]
    manifest={'status':'recording-required','language':'pt-MZ','narrationProduced':False,'reason':'Não foi identificado um motor de voz com português natural de Moçambique. Nenhuma voz brasileira ou robótica foi apresentada como moçambicana.','direction':'Voz humana moçambicana adulta, natural, segura e calorosa. Pronunciar Agexa com aprovação da marca. Gravar WAV 48 kHz/24 bit, sem música e sem efeitos, nos tempos indicados. A versão visual é completa e funciona sem narração.','main':[{'start':a,'end':b,'text':t} for a,b,t in main],'short':[{'start':a,'end':b,'text':t} for a,b,t in short],'ctaAdaptation':'O fecho foi condensado para a CTA principal e secundária aprovadas no briefing, dando tempo de leitura ao website e WhatsApp.'}
    (doc/'voiceover-cues.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    def srt_time(s):
        ms=round(s*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
    for name,items in [('main',main),('short',short)]:
        # A recording guide, not claims of speech-aligned subtitles for nonexistent audio.
        (doc/f'voiceover-{name}-recording-guide.srt').write_text('\n\n'.join(f'{i+1}\n{srt_time(a)} --> {srt_time(b)}\n{t}' for i,(a,b,t) in enumerate(items))+'\n')
    (doc/'voiceover-README.md').write_text('''# Narração AGEXA — guião para gravação humana

**Não foi produzida uma narração.** Os filmes usam música original, efeitos e textos no ecrã. Não foi identificada uma voz sintética adequada ao português natural de Moçambique.

`voiceover-cues.json` e os ficheiros `recording-guide.srt` são guias de gravação por cena, não legendas por palavra medidas de uma voz existente. Grave uma voz humana moçambicana com os tempos do guião, como WAV estéreo ou mono, 48 kHz. Não ler o contacto completo em voz alta: o telefone e o website permanecem no ecrã.

Para misturar uma gravação aprovada sem alterar o tom nem o tempo:

```bash
python3 scripts/agexa-audio.py --narration /caminho/narracao-40s.wav --short-narration /caminho/narracao-15s.wav
```

A mistura usa redução automática da música a partir do sinal real da voz. O operador mantém os direitos e a autorização da pessoa gravada. Áudios mais longos do que a duração do filme são rejeitados; o programa não os acelera nem corta a frase final.
''')


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--narration');parser.add_argument('--short-narration');args=parser.parse_args()
    DEST.mkdir(parents=True,exist_ok=True)
    reports={}
    for short,duration,prefix,voice in [(False,40,'',args.narration),(True,15,'short-',args.short_narration)]:
        music,fx=score(duration,short)
        musicfile=DEST/f'{prefix}music.wav';fxfile=DEST/f'{prefix}sfx.wav';mixfile=DEST/f'{prefix}mix.wav'
        write(musicfile,music);write(fxfile,fx)
        production=master([musicfile,fxfile],mixfile,duration,voice)
        reports[prefix+'mix']={**inspect(mixfile),'production':production}
        print(f'{mixfile.name}: {reports[prefix+"mix"]["durationSeconds"]} s, {reports[prefix+"mix"]["measuredIntegratedLUFS"]} LUFS',flush=True)
    for name,signal in [('notification',notification()),('confirmation',confirmation()),('sonic-logo',signature()),('transition',air()),('clock-tick',tick())]:
        write(DEST/f'{name}.wav',signal)
    make_docs()
    assets=[]
    for f in sorted(DEST.glob('*.wav')):
        assets.append({'file':str(f.relative_to(ROOT/'public')),'creator':'AGEXA campaign original procedural composer / sound designer','sourceType':'original-procedural-composition-and-synthesis','rightsBasis':'Composição e síntese sonoras originais produzidas pelo código deste projeto. Sem samples, gravações ou música comercial de terceiros. Se for importada uma narração, aplicam-se adicionalmente os direitos dessa gravação.','credit':'Música e sound design originais para a campanha AGEXA.','sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'attributionRequired':False})
    (DEST/'credits.json').write_text(json.dumps({'assets':assets},ensure_ascii=False,indent=2)+'\n')
    (DEST/'audio-report.json').write_text(json.dumps({'narrationProduced':bool(args.narration or args.short_narration),'audioSampleRate':SR,'originalTempoBPM':100,'score':'Tensão em Fá sustenido com resolução em Lá; assinatura de quatro notas de vidro.','mainCues':{'notifications':[.34,1.2,2.05,3.1,4.25,5.15],'acceleratingClock':[6,9.55],'preRevealBreath':[9.65,9.95],'brandSignature':10.15,'productClicks':[15.8,18.6,21,23],'confirmation':24,'businessClicks':[25.2,27.2,29.2,31.4],'cta':33,'sonicSignatures':[34,38]},'shortCues':{'brandSignature':3.15,'productClicks':[5.35,6.65,8,9.25],'confirmation':9.3,'cta':10.5,'sonicSignatures':[11,13.15]},'renders':reports},ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':main()
