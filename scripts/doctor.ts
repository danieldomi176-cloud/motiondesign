import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openBrowser} from '@remotion/renderer';

export function findBrowser(): string {
  const candidates = [process.env.REMOTION_BROWSER_EXECUTABLE, process.env.BROWSER_EXECUTABLE, '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].filter((v): v is string => Boolean(v));
  const browser = candidates.find(existsSync);
  if (!browser) throw new Error('Chromium/Chrome não encontrado. Defina BROWSER_EXECUTABLE.');
  return browser;
}
export async function inspectTools() {
  const run = (command: string, args: string[]) => {
    const result = spawnSync(command, args, {encoding: 'utf8', timeout: 25000, killSignal: 'SIGKILL', maxBuffer: 4 * 1024 * 1024});
    return {ok: result.status === 0, text: (result.stdout || result.stderr || result.error?.message || '').trim(), exitCode: result.status};
  };
  const ffmpeg = run('ffmpeg', ['-version']);
  const ffprobe = run('ffprobe', ['-version']);
  const encoders = run('ffmpeg', ['-hide_banner', '-encoders']);
  let browser: {path?: string; version?: string; launchOk: boolean; error?: string};
  try {
    const executable = findBrowser();
    const version = run(executable, ['--version']);
    const launched = await openBrowser('chrome', {browserExecutable: executable, chromiumOptions: {gl: 'angle'}, logLevel: 'error'});
    await launched.close({silent: true});
    browser = {path: executable, version: version.text, launchOk: true};
  } catch (error) { browser = {launchOk: false, error: String(error)}; }
  const result = {
    checkedAt: new Date().toISOString(), platform: `${os.platform()} ${os.arch()}`, node: process.version,
    ffmpeg: {available: ffmpeg.ok, version: ffmpeg.text.split('\n')[0], h264Encoder: /\blibx264\b/.test(encoders.text), aacEncoder: /\baac\s/.test(encoders.text)},
    ffprobe: {available: ffprobe.ok, version: ffprobe.text.split('\n')[0]}, browser,
    neuralSpeechModel: {configured: Boolean(process.env.FOOTBALL_TTS_MODEL), note: 'A existência de um modelo não comprova a sua licença ou execução; consultar speech-manifest.json.'},
    apiVoiceCredentials: {openaiConfigured: Boolean(process.env.OPENAI_API_KEY), elevenLabsConfigured: Boolean(process.env.ELEVENLABS_API_KEY)},
    renderingReady: ffmpeg.ok && ffprobe.ok && browser.launchOk && /\blibx264\b/.test(encoders.text) && /\baac\s/.test(encoders.text),
  };
  mkdirSync('out', {recursive: true});
  writeFileSync('out/capabilities.json', JSON.stringify(result, null, 2) + '\n');
  return result;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await inspectTools();
  console.log(JSON.stringify(result, null, 2));
  if (!result.renderingReady) process.exitCode = 1;
}
