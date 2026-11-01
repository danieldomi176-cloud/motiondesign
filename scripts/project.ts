import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';

export type WordCaption = {text: string; startMs: number; endMs: number; timestampMs: number | null; confidence: number | null; pageBreakAfter?: boolean};
export type Project = {
  id: string; title: string; language: string; durationSeconds: number; fps: number; width: number; height: number;
  editorial: {status: string; notice: string; sources: unknown[]};
  publication: {title: string; description: string; hashtags: string[]};
  audio: {narration: string; music: string; impact: string; whoosh: string; mix?: string; musicMode?: "generated" | "import"};
  scenes: Array<{id: string; start: number; duration: number; kind: string; headline: string; image?: string; secondaryImage?: string; foregroundImage?: string; narration?: string}>;
  captions: WordCaption[]; captionsFile?: string; speechManifestFile?: string;
  [key: string]: unknown;
};

export const root = process.cwd();
export function projectArgument(args = process.argv.slice(2)): string {
  const position = args.indexOf('--project');
  if (position >= 0 && !args[position + 1]) throw new Error('--project requer um caminho JSON');
  return path.resolve(root, position >= 0 ? args[position + 1] : 'content/demo.json');
}
export function publicPath(file: string): string {
  if (!file || path.isAbsolute(file) || /^(https?:|data:)/.test(file)) throw new Error(`Recurso deve ser local e relativo a public/: ${file}`);
  const base = path.resolve(root, 'public');
  const result = path.resolve(base, file);
  if (!result.startsWith(base + path.sep)) throw new Error(`Recurso fora de public/: ${file}`);
  return result;
}
export function loadProject(file = projectArgument()): Project {
  const project = JSON.parse(readFileSync(file, 'utf8')) as Project;
  if (project.captionsFile) project.captions = JSON.parse(readFileSync(publicPath(project.captionsFile), 'utf8'));
  if (!Array.isArray(project.captions)) project.captions = [];
  return project;
}
export function referencedFiles(project: Project): string[] {
  return [...new Set([
    ...project.scenes.flatMap((scene) => [scene.image, scene.secondaryImage, scene.foregroundImage].filter((file): file is string => Boolean(file))),
    ...[project.audio.narration,project.audio.music,project.audio.impact,project.audio.whoosh,project.audio.mix].filter((file): file is string => typeof file === 'string'),
  ])];
}
export function findCreditFiles(directory = path.resolve(root, 'public')): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    return statSync(file).isDirectory() ? findCreditFiles(file) : /credits\.json$/.test(name) ? [file] : [];
  });
}
export function collectCredits(): {assets: Array<Record<string, unknown>>; files: string[]} {
  const files = findCreditFiles();
  const assets = files.flatMap((file) => JSON.parse(readFileSync(file, 'utf8')).assets ?? []);
  return {assets, files};
}
