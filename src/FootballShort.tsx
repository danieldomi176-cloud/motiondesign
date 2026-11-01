import {Audio} from '@remotion/media';
import {AbsoluteFill, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Project} from './model';
import {Captions} from './Captions';
import {Scene} from './Scene';
import {useProductionAssets} from './useProductionAssets';
export const FootballShort = ({project}: {project:Project}) => {
 const f=useCurrentFrame();const {fps,durationInFrames}=useVideoConfig();
 const captions=useProductionAssets(project);
 return <AbsoluteFill style={{background:'#050a10',color:'#fff',fontFamily:'DM Sans'}}>
  {/* All instances intentionally share this data-driven scene template. */}
  {project.scenes.map((scene,index)=><Sequence key={scene.id} name={`${index+1} · ${scene.id}`} from={Math.round(scene.start*fps)} durationInFrames={Math.round((scene.start+scene.duration)*fps)-Math.round(scene.start*fps)} premountFor={fps}><Scene scene={scene}/></Sequence>)}
  <Audio src={staticFile(project.audio.mix)} premountFor={fps}/>
  <div style={{position:'absolute',top:114,left:82,right:155,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
    <div style={{display:'flex',gap:12,alignItems:'center'}}><div style={{height:42,width:42,background:'#d9ff43',color:'#051014',fontFamily:'Barlow',fontSize:32,textAlign:'center'}}>F.</div><span style={{fontSize:22,fontWeight:800,letterSpacing:3}}>FOOTBALL / SHORTS</span></div>
    <div style={{fontFamily:'Barlow',fontSize:29,color:'#d9ff43'}}>001</div>
  </div>
  <div style={{position:'absolute',top:190,left:82,right:155,height:2,background:'#ffffff33'}}/>
  <Captions captions={captions}/>
  <div style={{position:'absolute',left:85,right:155,bottom:232,display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:20,fontWeight:700,letterSpacing:1.8,color:'#b0bac3'}}><span>{project.editorial.status==='unverified'?project.editorial.notice:'FOOTBALL SHORTS STUDIO'}</span><span>IMAGENS IA</span></div>
  <div style={{position:'absolute',bottom:207,left:85,right:155,height:4,background:'#ffffff22'}}><div style={{height:'100%',width:`${interpolate(f,[0,durationInFrames-1],[0,100])}%`,background:'#d9ff43'}}/></div>
  <div style={{position:'absolute',bottom:140,left:85,fontFamily:'DM Sans',fontSize:22,fontWeight:700,letterSpacing:2,color:'#d9ff43'}}>COMENTA A TUA ESCOLHA ↓</div>
 </AbsoluteFill>;
};
