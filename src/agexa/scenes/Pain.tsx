import {useCurrentFrame,useVideoConfig,interpolate} from 'remotion';
import {Scene3D} from '../three';
import {Stage,TextIn,Kicker,BottomLine} from '../Design';
import {brand} from '../brand';
export const Pain=()=>{
 const frame=useCurrentFrame();const {fps,durationInFrames}=useVideoConfig();const f=Math.min(frame,Math.round(5.62*fps));const beat=Math.min(2,Math.floor(f/(fps*1.8)));
 return <Stage><div style={{position:'absolute',left:86,right:150,top:292}}><Kicker>QUANDO TUDO CHEGA AO MESMO TEMPO.</Kicker><TextIn key={beat} delay={beat*1.8} style={{fontSize:108,fontWeight:600,letterSpacing:-6,lineHeight:1.06}}>{brand.pain[beat]}</TextIn></div>
  <div style={{position:'absolute',top:510,left:0,right:0,height:1090,opacity:interpolate(frame,[durationInFrames-8,durationInFrames-1],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'})}}><Scene3D mode="chaos" progress={f/durationInFrames} width={1080} height={1090}/></div>
  <BottomLine>Horários confundidos.<br/>Marcações por confirmar.</BottomLine>
 </Stage>;
};
