import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {mkdirSync, existsSync, readFileSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {findBrowser} from './doctor';
import {writeMetadata} from './metadata';
import {loadProject, projectArgument, publicPath, root} from './project';
import {validateOutput, validateProject} from './validate';

const projectFile = projectArgument();
let project = loadProject(projectFile);
if (!project.audio.mix) project.audio.mix = path.posix.join(path.posix.dirname(project.audio.narration), 'mix.wav');
mkdirSync('out', {recursive: true});
const music = spawnSync('python3', ['scripts/audio-bed.py', '--project', projectFile], {encoding: 'utf8', timeout: 180000, maxBuffer: 4 * 1024 * 1024});
if (music.status !== 0) throw new Error(`Geração/mistura de áudio falhou: ${music.stderr || music.error?.message}`);
console.log(music.stdout.trim());
// The generated mix is passed to the composition without modifying the authored JSON.
const issues = validateProject(project);
if (issues.length) throw new Error(`Projeto inválido:\n${issues.join('\n')}`);
const output = path.join(root, 'out', `${project.id}.mp4`);
const browserExecutable = findBrowser();
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public'), onProgress: (value) => {if (value === 100) console.log('Bundle pronto.');}});
const inputProps = {project};
const chromiumOptions = {disableWebSecurity: false, gl: 'angle' as const};
const composition = await selectComposition({serveUrl, id: 'FootballShort', inputProps, browserExecutable, chromiumOptions});
if (composition.durationInFrames !== Math.round(project.durationSeconds * project.fps)) throw new Error('Metadados de composição divergem da duração configurada');
console.log(`A renderizar ${composition.durationInFrames} frames, ${composition.width}×${composition.height}, ${composition.fps} FPS...`);
let lastProgress = -1;
await renderMedia({
  composition, serveUrl, codec: 'h264', audioCodec: 'aac', outputLocation: output,
  inputProps, browserExecutable, chromiumOptions, concurrency: 2, crf: 18,
  pixelFormat: 'yuv420p', audioBitrate: '192k', x264Preset: 'fast',
  onProgress: ({progress}) => {
    const percent = Math.floor(progress * 100 / 10) * 10;
    if (percent !== lastProgress) {lastProgress = percent; console.log(`Render ${percent}%`);}
  },
});
if (!existsSync(output)) throw new Error('O renderizador não criou o MP4 esperado');
writeMetadata(project);
const report = validateOutput(output, project);
if (!report.passed) throw new Error(`MP4 gerado mas falhou validação: ${report.errors.join('; ')}`);
console.log(`MP4 real gerado e verificado: ${output}`);
console.log(`Revisão editorial: ${project.editorial.status}. ${project.editorial.notice}`);
