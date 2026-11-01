#!/usr/bin/env python3
"""Local natural sentence TTS with sample-accurate native Piper phoneme durations."""
import argparse, hashlib, json, math, pathlib, re, shutil, wave
import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig

ROOT=pathlib.Path(__file__).resolve().parents[1]

def patch_model(model):
    import onnx
    from onnx import helper, TensorProto
    aligned=model.with_name(model.stem+'-aligned.onnx')
    if not aligned.exists():
        graph=onnx.load(str(model))
        node='/Ceil_output_0'
        if not any(node in op.output for op in graph.graph.node):
            raise ValueError('This model does not expose Piper VITS /Ceil_output_0 durations; use a model with native alignments.')
        graph.graph.output.append(helper.make_tensor_value_info(node,TensorProto.FLOAT,[1,1,None]))
        onnx.save(graph,str(aligned))
        cfg=json.loads(pathlib.Path(str(model)+'.json').read_text());cfg['audio']['hop_length']=256
        pathlib.Path(str(aligned)+'.json').write_text(json.dumps(cfg))
    return aligned

def sha(file): return hashlib.sha256(file.read_bytes()).hexdigest()

def generate(project_file,model):
    project=json.loads(project_file.read_text())
    aligned=patch_model(model)
    voice=PiperVoice.load(aligned)
    sr=voice.config.sample_rate
    target_seconds=float(project['durationSeconds'])
    if not 30 <= target_seconds <= 40: raise ValueError('Short duration must be between 30 and 40 seconds')
    speech=project.get('speech',{})
    scene_audio=[]; scene_captions=[]; proofs=[]
    for scene in project['scenes']:
        pieces=[]; captions=[]; cursor=0
        for sentence in re.split(r'(?<=[.!?])\s+',scene['narration'].strip()):
            for chunk in voice.synthesize(sentence,SynthesisConfig(length_scale=speech.get('lengthScale',1.4),noise_scale=speech.get('noiseScale',.5),noise_w_scale=speech.get('noiseWScale',.65)),include_alignments=True):
                data=chunk.audio_float_array
                native=sum(int(a.num_samples) for a in chunk.phoneme_alignments)
                if native!=len(data): raise ValueError(f'Native durations {native} != samples {len(data)}')
                # Spaces in the phoneme stream delimit spoken words. Preserve all phonetic samples.
                groups=[]; start=None; pos=0
                for a in chunk.phoneme_alignments:
                    n=int(a.num_samples)
                    if a.phoneme in (' ','$'):
                        if start is not None: groups.append((start,pos));start=None
                    elif a.phoneme!='^' and start is None:
                        start=pos
                    pos+=n
                if start is not None:groups.append((start,pos))
                words=sentence.split()
                # eSpeak separates hyphenated clitics; account using their actual phonemization.
                if len(groups)!=len(words):
                    counts=[]
                    for w in words:
                        phones=voice.phonemize(w)[0]
                        counts.append(1+sum(p==' ' for p in phones))
                    if sum(counts)!=len(groups):
                        raise ValueError(f'Word/phoneme boundary mismatch: {sentence!r}: {len(words)} words vs {len(groups)} groups, counts={counts}')
                    merged=[];g=0
                    for n in counts:merged.append((groups[g][0],groups[g+n-1][1]));g+=n
                    groups=merged
                for word,(begin,end) in zip(words,groups):
                    captions.append({'text':' '+word,'startSample':cursor+begin,'endSample':cursor+end})
                proofs.append({'sceneId':scene['id'],'text':sentence,'sampleCount':len(data),'nativeDurationSamples':native,'phonemeCount':len(chunk.phoneme_alignments),'wordCount':len(groups)})
                pieces.append(data);cursor+=len(data)
                gap=np.zeros(int(.12*sr),dtype=np.float32);pieces.append(gap);cursor+=len(gap)
        data=np.concatenate(pieces)
        scene_audio.append(data);scene_captions.append(captions)
        print(f"Synthesized {scene['id']}: {len(data)/sr:.3f}s / {len(captions)} words",flush=True)
    # Fit the natural sentence delivery to the configured edit duration. One uniform sample transform
    # applies to audio, captions and scenes; no per-word guessed or uniform timestamps.
    raw_total=sum(map(len,scene_audio)); target_samples=round(target_seconds*sr)
    factor=target_samples/raw_total
    all_audio=[];captions=[];scenes=[];offset=0
    for scene,data,words in zip(project['scenes'],scene_audio,scene_captions):
        length=round(len(data)*factor)
        output=np.interp(np.linspace(0,len(data)-1,length),np.arange(len(data)),data).astype(np.float32)
        # Frame-round visual scene offsets; native audio and captions retain sample precision.
        start_frame=round(offset/sr*30)
        for w in words:
            a=(offset+round(w['startSample']*factor))/sr*1000
            b=(offset+round(w['endSample']*factor))/sr*1000
            captions.append({'text':w['text'],'startMs':round(a,3),'endMs':round(b,3),'timestampMs':round((a+b)/2,3),'confidence':None})
        scene['start']=start_frame/30
        all_audio.append(output);offset+=length
        scenes.append({'id':scene['id'],'startMs':round((offset-length)/sr*1000,3),'endMs':round(offset/sr*1000,3),'wordCount':len(words)})
    for i,scene in enumerate(project['scenes']):
        end=project['scenes'][i+1]['start'] if i+1<len(project['scenes']) else target_seconds
        scene['duration']=round(end-scene['start'],6)
    audio=np.concatenate(all_audio)
    if len(audio)<target_samples:audio=np.pad(audio,(0,target_samples-len(audio)))
    audio=audio[:target_samples]
    destination=ROOT/'public'/project['audio']['narration'];destination.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(destination),'wb') as out:
        out.setparams((1,2,sr,len(audio),'NONE','not compressed'));out.writeframes((np.clip(audio,-.98,.98)*32767).astype('<i2').tobytes())
    captions_file=ROOT/'public'/project['captionsFile'];captions_file.write_text(json.dumps(captions,ensure_ascii=False,indent=2)+'\n')
    manifest={'engine':'Piper 1.8.0 / ONNX Runtime','voice':'pt_BR-faber-medium','language':'pt-BR','method':'Native Piper VITS phoneme durations exposed as second ONNX output; words delimited by phoneme spaces; identical resampling factor applied to audio and timestamps.','timingMethod':'native-phoneme-duration','sampleRate':sr,'durationSeconds':len(audio)/sr,'rawDurationSeconds':raw_total/sr,'resamplingFactor':factor,'narrationSha256':sha(destination),'captionsSha256':sha(captions_file),'alignmentVerified':True,'maxNativeDurationMismatchSamples':0,'scenes':scenes,'nativeSegments':proofs,'words':captions,'limitations':['The voice is Brazilian Portuguese; script uses European Portuguese vocabulary.','Native generated timing is sample-accurate; human review is still needed for pronunciation.',f'The demo resamples the complete delivery uniformly to {target_seconds:g} seconds.']}
    (ROOT/'public'/project['speechManifestFile']).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    card=model.parent/'MODEL_CARD';shutil.copyfile(card,destination.parent/'VOICE_MODEL_CARD.txt')
    credits={'assets':[{'file':project['audio']['narration'],'creator':'Piper voice pt_BR-faber-medium / Faber voice dataset','source':'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-pt_BR-faber-medium.tar.bz2','license':'CC0 (voice dataset, as documented in the distributed MODEL_CARD)','rightsBasis':'Synthetic narration generated locally from the Faber Portuguese voice; dataset declared CC0 by the distributed model card. Piper engine GPL-3.0; engine not redistributed in this project.','modelCardFile':str((destination.parent/'VOICE_MODEL_CARD.txt').relative_to(ROOT/'public')),'modelSha256':sha(model),'sha256':sha(destination),'attributionRequired':False,'credit':'Voz sintética: Piper / Faber (pt-BR), dataset CC0.'}]}
    (destination.parent/'speech-credits.json').write_text(json.dumps(credits,ensure_ascii=False,indent=2)+'\n')
    project['durationSeconds']=target_seconds;project['language']='pt-BR';project_file.write_text(json.dumps(project,ensure_ascii=False,indent=2)+'\n')
    print(f'Generated {destination}: {len(audio)/sr:.3f}s, {len(captions)} native-aligned words; factor={factor:.3f}',flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--project',default='content/demo.json');parser.add_argument('--model',default='/tmp/football-model/vits-piper-pt_BR-faber-medium/pt_BR-faber-medium.onnx');args=parser.parse_args()
    generate(ROOT/args.project,pathlib.Path(args.model))
