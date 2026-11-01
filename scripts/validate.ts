import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {collectCredits, loadProject, publicPath, referencedFiles, type Project, type WordCaption} from './project';

export function validateCaptions(captions: WordCaption[], durationSeconds: number): string[] {
  const errors: string[] = [];
  if (!captions.length) errors.push('Legendas por palavra em falta');
  captions.forEach((caption, index) => {
    if (!caption.text?.trim()) errors.push(`Legenda ${index}: texto vazio`);
    if (!Number.isFinite(caption.startMs) || !Number.isFinite(caption.endMs) || caption.endMs <= caption.startMs) errors.push(`Legenda ${index}: intervalo inválido`);
    if (caption.startMs < 0 || caption.endMs > durationSeconds * 1000 + 1) errors.push(`Legenda ${index}: fora da duração`);
    if (index > 0 && caption.startMs < captions[index - 1].endMs - 1) errors.push(`Legenda ${index}: sobreposição de palavras`);
    if (caption.timestampMs !== null && (!Number.isFinite(caption.timestampMs) || caption.timestampMs < caption.startMs || caption.timestampMs > caption.endMs)) errors.push(`Legenda ${index}: timestamp fora do intervalo`);
  });
  return errors;
}

export type SpeechManifest = {
  sampleRate: number; durationSeconds: number; timingMethod?: string;
  narrationSha256: string; captionsSha256: string; alignmentVerified: boolean;
  maxNativeDurationMismatchSamples?: number;
  nativeSegments?: Array<{sampleCount: number; nativeDurationSamples: number; sceneId?: string; text?: string}>;
  words: WordCaption[]; scenes?: Array<{id: string; startMs: number; endMs: number}>;
};
export function validateSpeechManifest(project: Project, manifest: SpeechManifest, narrationHash: string, captionHash?: string): string[] {
  const errors: string[] = [];
  if (!manifest.alignmentVerified) errors.push('Manifesto de voz não confirma alinhamento');
  if (manifest.narrationSha256 !== narrationHash) errors.push('A narração foi alterada depois de sincronizar as legendas (SHA-256)');
  if (captionHash && manifest.captionsSha256 !== captionHash) errors.push('As legendas foram alteradas depois de gerar o manifesto (SHA-256)');
  if (JSON.stringify(manifest.words) !== JSON.stringify(project.captions)) errors.push('Palavras/tempos do manifesto divergem das legendas usadas no render');
  if (!(manifest.sampleRate > 0) || !(manifest.durationSeconds > 0) || manifest.durationSeconds > project.durationSeconds + 1 / project.fps) errors.push('Duração/amostragem do manifesto de voz inválida');
  if (manifest.timingMethod === 'native-phoneme-duration') {
    if (manifest.maxNativeDurationMismatchSamples !== 0) errors.push('A soma de durações dos fonemas nativos diverge do áudio sintetizado');
    if (!manifest.nativeSegments?.length) errors.push('Evidência de durações nativas em falta');
    for (const [index, segment] of (manifest.nativeSegments ?? []).entries()) {
      if (!(segment.sampleCount > 0) || segment.sampleCount !== segment.nativeDurationSamples) errors.push(`Segmento de voz ${index}: contagem de amostras nativas divergente`);
    }
  }
  for (const scene of manifest.scenes ?? []) {
    const planned = project.scenes.find((item) => item.id === scene.id);
    if (!planned || Math.abs(planned.start * 1000 - scene.startMs) > 1000 / project.fps + 1 || Math.abs((planned.start + planned.duration) * 1000 - scene.endMs) > 1000 / project.fps + 1) errors.push(`Cena ${scene.id}: imagem e narração divergem mais de um frame`);
  }
  return errors;
}

export function validateProject(project: Project, checkFiles = true): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9][a-z0-9-]*$/.test(project.id || '')) errors.push('id inválido (use letras minúsculas, números e hífens)');
  if (project.width !== 1080 || project.height !== 1920 || project.fps !== 30) errors.push('Formato deve ser 1080×1920 a 30 FPS');
  if (!(project.durationSeconds >= 30 && project.durationSeconds <= 40)) errors.push('Duração deve estar entre 30 e 40 segundos');
  if (!project.editorial?.status || !project.editorial?.notice) errors.push('Revisão editorial/aviso em falta');
  if (!project.publication?.title || !project.publication?.description || !Array.isArray(project.publication?.hashtags)) errors.push('Metadados de publicação em falta');
  if (!project.scenes?.length) errors.push('Cenas em falta');
  let end = 0;
  project.scenes?.forEach((scene, index) => {
    if (!(scene.duration > 0) || scene.start < 0) errors.push(`Cena ${index}: duração/início inválidos`);
    if (Math.abs(scene.start - end) > 1 / 30) errors.push(`Cena ${index}: lacuna ou sobreposição no plano`);
    end = scene.start + scene.duration;
    if (end > project.durationSeconds + 1 / 30) errors.push(`Cena ${index}: excede a duração`);
  });
  if (Math.abs(end - project.durationSeconds) > 1 / 30) errors.push('As cenas devem cobrir toda a duração');
  errors.push(...validateCaptions(project.captions ?? [], project.durationSeconds));
  if (checkFiles) {
    const {assets} = collectCredits();
    for (const file of referencedFiles(project)) {
      try {
        if (!existsSync(publicPath(file))) errors.push(`Recurso em falta: ${file}`);
      } catch (error) { errors.push(String(error)); }
      const credit = assets.find((asset) => asset.file === file);
      if (!credit || !(credit.rightsBasis || credit.license || credit.licenseUrl)) errors.push(`Proveniência/licença em falta: ${file}`);
    }
    if (project.speechManifestFile) {
      try {
        const manifest = JSON.parse(readFileSync(publicPath(project.speechManifestFile), 'utf8')) as SpeechManifest;
        const narrationHash = createHash('sha256').update(readFileSync(publicPath(project.audio.narration))).digest('hex');
        const captionHash = project.captionsFile ? createHash('sha256').update(readFileSync(publicPath(project.captionsFile))).digest('hex') : undefined;
        errors.push(...validateSpeechManifest(project, manifest, narrationHash, captionHash));
      } catch (error) { errors.push(`Não foi possível verificar manifesto de sincronização: ${String(error)}`); }
    }
  }
  return errors;
}
export function probe(file: string) {
  const result = spawnSync('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file], {encoding: 'utf8', timeout: 30000});
  if (result.status !== 0) throw new Error(`ffprobe falhou: ${result.stderr || result.error?.message}`);
  return JSON.parse(result.stdout) as {format: {duration: string; size: string}; streams: Array<{codec_type: string; codec_name: string; width?: number; height?: number; avg_frame_rate?: string; duration?: string; sample_rate?: string; channels?: number}>};
}
export function validateOutput(file: string, project: Project) {
  const inspection = probe(file);
  const errors = validateProject(project);
  const video = inspection.streams.find((stream) => stream.codec_type === 'video');
  const audio = inspection.streams.find((stream) => stream.codec_type === 'audio');
  if (!video || video.width !== 1080 || video.height !== 1920 || video.avg_frame_rate !== '30/1') errors.push('Vídeo final não é 1080×1920/30 FPS');
  if (video?.codec_name !== 'h264' || audio?.codec_name !== 'aac') errors.push('MP4 deve conter vídeo H.264 e áudio AAC');
  const duration = Number(inspection.format.duration);
  if (Math.abs(duration - project.durationSeconds) > .12) errors.push('Duração final diverge do plano');
  const scan = spawnSync('ffmpeg', ['-hide_banner', '-i', file, '-af', 'silencedetect=noise=-45dB:d=1.5', '-vf', 'blackdetect=d=0.5:pix_th=0.04', '-f', 'null', '-'], {encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024});
  if (scan.status !== 0) errors.push(`Análise de áudio/imagem falhou: ${scan.error?.message || scan.stderr.slice(-600)}`);
  const black = [...scan.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)].map((match) => ({start: +match[1], end: +match[2], duration: +match[3]}));
  if (black.some((interval) => interval.duration > .5)) errors.push('Detetados mais de 0,5 s de imagem preta');
  const silence = [...scan.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((match) => +match[1]);
  if (silence.length) errors.push('Detetado silêncio superior a 1,5 s no áudio final');
  const narration = probe(publicPath(project.audio.narration));
  const narrationDuration = Number(narration.format.duration);
  if (narrationDuration > project.durationSeconds + .04) errors.push('Narração excede a duração do vídeo');
  if (project.captions.some((caption) => caption.endMs > narrationDuration * 1000 + 100)) errors.push('Legendas continuam depois do fim da narração');
  const report = {
    verifiedAt: new Date().toISOString(), file, passed: errors.length === 0, errors,
    technical: inspection, narrationDurationSeconds: narrationDuration, captionsCount: project.captions.length,
    timeline: {sceneCoverageSeconds: project.scenes.at(-1)!.start + project.scenes.at(-1)!.duration, finalCaptionMs: project.captions.at(-1)?.endMs},
    automatedChecks: ['FFprobe formato/codecs/duração', 'cobertura contínua de cenas', 'limites e sobreposições das legendas', 'SHA-256 narração/legendas e manifesto de durações nativas quando disponível', 'cenas e voz com tolerância de um frame', 'narração dentro da duração', 'blackdetect', 'silencedetect', 'proveniência dos recursos'],
    limitations: ['A validação automática de limites não substitui a revisão humana da pronúncia e do alinhamento fonético de todas as palavras.', 'A verificação editorial de estatísticas é independente da renderização.'],
    blackIntervals: black, silenceStartSeconds: silence,
    editorialStatus: project.editorial.status, readyToPublish: project.editorial.status === 'verified',
  };
  writeFileSync(file.replace(/\.mp4$/, '.validation.json'), JSON.stringify(report, null, 2) + '\n');
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const project = loadProject();
  const fileArg = process.argv.indexOf('--video');
  if (fileArg >= 0) {
    const report = validateOutput(path.resolve(process.argv[fileArg + 1]), project);
    console.log(JSON.stringify(report, null, 2));
    if (!report.passed) process.exitCode = 1;
  } else {
    const errors = validateProject(project);
    console.log(errors.length ? errors.join('\n') : 'Projeto e recursos válidos.');
    if (errors.length) process.exitCode = 1;
  }
}
