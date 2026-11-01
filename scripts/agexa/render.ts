import {validateAgexa} from './validate';
import type {BrandConfig} from '../../src/agexa/brand';
import {bundle} from '@remotion/bundler';
import {renderMedia,renderStill,selectComposition,openBrowser} from '@remotion/renderer';
import {mkdirSync,existsSync,writeFileSync,readFileSync,copyFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {findBrowser} from '../doctor';
const args=process.argv.slice(2);
const framesOnly=args.includes('--stills');const draft=args.includes('--preview');const shortOnly=args.includes('--short-only');
const out=path.resolve('out/agexa');mkdirSync(out,{recursive:true});
const inputProps={threePixelRatio:draft?.45:args.includes('--full-3d')?1:.75};
const campaign=JSON.parse(readFileSync('content/agexa/campaign.json','utf8')) as BrandConfig;
const configErrors=validateAgexa(campaign,file=>existsSync(path.join('public',file)));
if(configErrors.length)throw Error(configErrors.join('\n'));
const browserExecutable=findBrowser();
const chromiumOptions={gl:'swangle' as const};
const bundleUrl=await bundle({entryPoint:path.resolve('src/index.ts'),publicDir:path.resolve('public')});
const browser=await openBrowser('chrome',{browserExecutable,chromiumOptions,logLevel:'error'});
const info={source:'React + Remotion + Three.js',engine:'WebGL2 via Chromium ANGLE',checkedAt:new Date().toISOString(),browserExecutable,threePixelRatio:inputProps.threePixelRatio,narrationProduced:false,narrationNote:'Guia pt-MZ preparado para gravação humana; não há voz artificial apresentada como moçambicana.',assets:campaign};
try{
 if(framesOnly){
  const c=await selectComposition({serveUrl:bundleUrl,id:'AGEXA-Official',browserExecutable,puppeteerInstance:browser,chromiumOptions});
  for(const [name,frame]of [['hook',55],['pain',205],['brand',360],['product',610],['business',845],['conversion',1100]] as const){
   await renderStill({serveUrl:bundleUrl,composition:c,frame,output:path.join(out,`frame-${name}.png`),imageFormat:'png',puppeteerInstance:browser,browserExecutable,chromiumOptions});console.log(`Frame real ${name}: ${frame}`);
  }
 }else{
  const specs=shortOnly?[{id:'AGEXA-TikTok-15s',name:'AGEXA_TikTok_15s.mp4',duration:15}]:draft?[{id:'AGEXA-Official',name:'AGEXA_Preview_540p.mp4',duration:40}]:[{id:'AGEXA-Official',name:'AGEXA_Official_Motion_Design.mp4',duration:40},{id:'AGEXA-TikTok-15s',name:'AGEXA_TikTok_15s.mp4',duration:15}];
  for(const spec of specs){
   const selected=await selectComposition({serveUrl:bundleUrl,id:spec.id,inputProps,puppeteerInstance:browser,browserExecutable,chromiumOptions});const c=draft?{...selected,fps:15,durationInFrames:600}:selected;const file=path.join(out,spec.name);let last=-10;
   await renderMedia({serveUrl:bundleUrl,composition:c,inputProps,outputLocation:file,codec:'h264',audioCodec:'aac',audioBitrate:'192k',videoBitrate:draft?'2500k':'8500k',pixelFormat:'yuv420p',colorSpace:'bt709',x264Preset:'fast',scale:draft?.5:1,concurrency:1,puppeteerInstance:browser,browserExecutable,chromiumOptions,onProgress:({progress})=>{const n=Math.floor(progress*10)*10;if(n!==last){last=n;console.log(`${spec.name} ${n}%`);}}});
   if(!existsSync(file))throw Error('MP4 não foi criado');
   const probe=spawnSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file],{encoding:'utf8',timeout:30000});if(probe.status!==0)throw Error('ffprobe falhou: '+probe.stderr);
   const media=JSON.parse(probe.stdout);const v=media.streams.find((s:any)=>s.codec_type==='video');const a=media.streams.find((s:any)=>s.codec_type==='audio');const errors=[];
   if(v.width!==(draft?540:1080)||v.height!==(draft?960:1920)||v.avg_frame_rate!==(draft?'15/1':'30/1'))errors.push('Resolução/FPS incorretos');
   if(v.codec_name!=='h264'||a?.codec_name!=='aac')errors.push('Codecs incorretos');
   if(Math.abs(Number(media.format.duration)-spec.duration)>.1)errors.push('Duração incorreta');
   const scan=spawnSync('ffmpeg',['-hide_banner','-i',file,'-af','silencedetect=noise=-48dB:d=1','-vf','blackdetect=d=0.8:pix_th=0.025','-f','null','-'],{encoding:'utf8',timeout:180000,maxBuffer:8e6,killSignal:'SIGKILL'});
   if(scan.status!==0)errors.push('Scan FFmpeg falhou');
   const silence=[...scan.stderr.matchAll(/silence_start: ([\d.]+)/g)].map(x=>+x[1]);if(silence.length)errors.push('Silêncio maior que 1 segundo');
   // Intentionally dark brand frames are reviewed visually, not treated as missing images.
   const black=[...scan.stderr.matchAll(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g)].map(m=>({start:+m[1],end:+m[2],duration:+m[3]}));
   if(black.some(i=>i.duration>1))errors.push('Imagem preta prolongada');
   const report={...info,file,passed:!errors.length,errors,media,silence,black,sha256:createHash('sha256').update(readFileSync(file)).digest('hex'),review:{originalLogoAvailable:Boolean(info.assets.logoIsOriginal),brandAssetPresent:Boolean(info.assets.logoFile),realProductScreens:info.assets.clientScreens.length,realBusinessScreens:info.assets.businessScreens.length,commercialMasterApproved:false,pending:['Substituir visualizações conceptuais por capturas oficiais para cumprir integralmente o storyboard.','Aprovar derivado da referência da marca com o titular ou fornecer vetor original.','Gravar e aprovar a narração pt-MZ se desejada.']}};
   writeFileSync(file.replace('.mp4','.report.json'),JSON.stringify(report,null,2)+'\n');
   if(errors.length)throw Error(errors.join('; '));console.log(`MP4 REAL VERIFICADO: ${file}`);
  }
 }
}finally{await browser.close({silent:true});}
