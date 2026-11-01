import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';
import type {Caption} from '@remotion/captions';
import type {Project} from './model';
export const useProductionAssets = (project: Project) => {
  const [handle] = useState(() => delayRender('Carregar fontes locais e legendas'));
  const [captions, setCaptions] = useState<Caption[]>(project.captions ?? []);
  useEffect(() => {
    let live = true;
    Promise.all([
      ...[['Barlow', 'fonts/BarlowCondensed-ExtraBold.ttf'], ['DM Sans', 'fonts/DMSans.ttf']].map(async ([name,path]) => {
        const face = new FontFace(name, `url(${staticFile(path)})`, {weight: name === 'Barlow' ? '800' : '100 1000'});
        (document.fonts as FontFaceSet & {add: (font: FontFace) => void}).add(await face.load());
      }),
      project.captions?.length ? project.captions : fetch(staticFile(project.captionsFile!)).then(r => {
        if(!r.ok) throw new Error('Legendas em falta: ' + project.captionsFile);
        return r.json() as Promise<Caption[]>;
      })
    ]).then(result => {
      if(live) { setCaptions(result[2] as Caption[]); continueRender(handle); }
    }).catch(cancelRender);
    return () => {live = false;};
  }, [handle, project]);
  return captions;
};
