import type {Caption} from '@remotion/captions';
export type SceneKind = 'hook' | 'tease' | 'stat' | 'reveal' | 'duel' | 'cta';
export interface Scene {
  id: string; start: number; duration: number; kind: SceneKind;
  details?: string[]; secondaryImage?: string; foregroundImage?: string;
  eyebrow: string; headline: string; accent: string; image: string; narration: string;
}
export interface Project {
  id: string; title: string; language: string; durationSeconds: number;
  fps: number; width: number; height: number;
  editorial: {status: 'unverified'|'verified'; notice: string; sources: string[]};
  publication: {title: string; description: string; hashtags: string[]};
  audio: {narration: string; music: string; impact: string; whoosh: string; mix: string; musicMode?: "generated"|"import"};
  captions?: Caption[]; captionsFile?: string; speechManifestFile?: string;
  scenes: Scene[];
}
