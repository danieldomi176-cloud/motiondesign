import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateCaptions, validateProject, validateSpeechManifest, type SpeechManifest} from '../scripts/validate';
import {publicPath, type Project} from '../scripts/project';

const caption = {text: ' golo', startMs: 100, endMs: 400, timestampMs: 250, confidence: null};
const project: Project = {
  id: 'valid-demo', title: 'Demo', language: 'pt-PT', durationSeconds: 36,
  fps: 30, width: 1080, height: 1920,
  editorial: {status: 'unverified', notice: 'Roteiro fornecido; confirmar temporada e estatísticas.', sources: []},
  publication: {title: 'Demo', description: 'Demonstração', hashtags: ['#Shorts']},
  audio: {narration: 'demo/audio/narration.wav', music: 'demo/audio/music.wav', impact: 'demo/audio/impact.wav', whoosh: 'demo/audio/whoosh.wav'},
  scenes: [{id: 'hook', start: 0, duration: 2, kind: 'hook', headline: 'Golo!'}, {id: 'rest', start: 2, duration: 34, kind: 'cta', headline: 'Comenta!'}],
  captions: [caption],
};
test('aceita plano 9:16 válido mas não presume verificação editorial', () => {
  assert.deepEqual(validateProject(project, false), []);
  assert.equal(project.editorial.status, 'unverified');
});
test('rejeita palavras sobrepostas, invertidas e fora do vídeo', () => {
  assert.match(validateCaptions([caption, {...caption, startMs: 350, endMs: 500, timestampMs: 400}], 36).join(), /sobreposição/);
  assert.match(validateCaptions([{...caption, startMs: 400, endMs: 200}], 36).join(), /inválido/);
  assert.match(validateCaptions([{...caption, endMs: 40000}], 36).join(), /fora da duração/);
});
test('rejeita lacunas entre cenas e duração superior ao Short', () => {
  const changed = structuredClone(project);
  changed.scenes[1].start = 3;
  assert.match(validateProject(changed, false).join(), /lacuna/);
  changed.durationSeconds = 45;
  assert.match(validateProject(changed, false).join(), /30 e 40/);
});
test('rejeita texto sem timings, vídeo horizontal e id que escapa diretórios', () => {
  assert.match(validateProject({...project, captions: []}, false).join(), /Legendas/);
  assert.match(validateProject({...project, width: 1920, height: 1080}, false).join(), /1080/);
  assert.match(validateProject({...project, id: '../video'}, false).join(), /id inválido/);
  assert.throws(() => publicPath('../../etc/passwd'), /fora/);
  assert.throws(() => publicPath('https://example.com/image.jpg'), /local/);
});
test('deteta narração substituída ou durações nativas que já não coincidem com as palavras', () => {
  const manifest: SpeechManifest = {
    sampleRate: 22050, durationSeconds: 36, timingMethod: 'native-phoneme-duration',
    narrationSha256: 'actual-wave-hash', captionsSha256: 'actual-caption-hash', alignmentVerified: true,
    maxNativeDurationMismatchSamples: 0,
    nativeSegments: [{sampleCount: 100, nativeDurationSamples: 100}], words: [caption],
    scenes: project.scenes.map((scene) => ({id: scene.id, startMs: scene.start * 1000, endMs: (scene.start + scene.duration) * 1000})),
  };
  assert.deepEqual(validateSpeechManifest(project, manifest, 'actual-wave-hash', 'actual-caption-hash'), []);
  assert.match(validateSpeechManifest(project, manifest, 'new-wave-hash').join(), /narração foi alterada/);
  assert.match(validateSpeechManifest(project, {...manifest, words: [{...caption, startMs: 120}]}, 'actual-wave-hash').join(), /divergem das legendas/);
  assert.match(validateSpeechManifest(project, {...manifest, nativeSegments: [{sampleCount: 100, nativeDurationSamples: 99}]}, 'actual-wave-hash').join(), /amostras nativas divergente/);
});
