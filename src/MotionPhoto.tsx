import {AbsoluteFill, CanvasImage, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
export const MotionPhoto = ({image, duration, focus=false}: {image:string;duration:number;focus?:boolean}) => {
 const f=useCurrentFrame(); const {fps}=useVideoConfig();
 return <AbsoluteFill style={{overflow:'hidden'}}>
  <CanvasImage src={staticFile(image)} premountFor={fps} style={{width:'100%',height:'100%',objectFit:'cover',scale:interpolate(f,[0,duration*fps],[focus?1.1:1,focus?1.22:1.1],{extrapolateRight:'clamp'}),translate:interpolate(f,[0,duration*fps],['0px 12px','-12px -20px'],{extrapolateRight:'clamp'})}}/>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(4,8,12,.1) 0%,transparent 45%,rgba(4,8,12,.3) 65%,#050a10 100%)'}}/>
 </AbsoluteFill>;
};
