import {useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
import {Scene3D} from '../three';
import {Stage,TextIn,Kicker,ease} from '../Design';
import {brand} from '../brand';
export const Hook=()=>{
 const f=useCurrentFrame();const {fps,durationInFrames}=useVideoConfig();const switchAt=Math.min(1.7,durationInFrames/fps*.48)*fps;
 return <Stage>
  <div style={{position:'absolute',left:84,right:150,top:305,zIndex:2}}><Kicker>UMA MENSAGEM SEM RESPOSTA.</Kicker>
  <TextIn style={{fontSize:114,fontWeight:620,lineHeight:1.04,letterSpacing:-4}}>{f<switchAt?brand.hook.lead:brand.hook.question}</TextIn>
  <TextIn delay={.25} style={{marginTop:24,fontSize:45,fontWeight:400,lineHeight:1.25,color:'#b5adbf',maxWidth:780}}>{brand.hook.support}</TextIn></div>
  <div style={{position:'absolute',left:0,right:0,top:540,height:1120,opacity:interpolate(f,[0,15],[.5,1],ease)}}><Scene3D mode="hook" progress={f/durationInFrames} width={1080} height={1120}/></div>
  <div style={{position:'absolute',bottom:250,left:86,right:150,display:'flex',alignItems:'center',gap:18,color:'#8e829e',fontSize:26,letterSpacing:1}}><span style={{width:7,height:7,background:'#9d75db',borderRadius:'50%'}}/>PODE ACONTECER NO TEU NEGÓCIO.</div>
 </Stage>;
};
