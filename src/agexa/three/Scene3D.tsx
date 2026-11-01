import {ThreeQuality} from './quality';
import type {CSSProperties} from 'react';
import {useMemo,useEffect,useLayoutEffect,useContext} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {CanvasTexture,EquirectangularReflectionMapping,SRGBColorSpace,ACESFilmicToneMapping} from 'three';
import {Easing,interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {Phone} from './Phone';
import {Clock} from './Clock';
import {Notification} from './Notification';
import {ScreenSurface} from './ScreenSurface';
import {bevelledPanel} from './geometry';

export type Scene3DMode='hook'|'chaos'|'product'|'business'|'brand';
export type Scene3DProps={mode:Scene3DMode;screen?:string;secondaryScreens?:string[];progress?:number;width?:number;height?:number;enableShadows?:boolean;style?:CSSProperties};
const ease={extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)} as const;

/** A studio environment made locally; no remote HDRI or third-party model assets. */
const StudioEnvironment=()=>{
 const scene=useThree(s=>s.scene);
 const texture=useMemo(()=>{
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#15131c';ctx.fillRect(0,0,512,256);
  const strip=(x:number,w:number,color:string)=>{const g=ctx.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'#15131c');g.addColorStop(.3,color);g.addColorStop(.7,color);g.addColorStop(1,'#15131c');ctx.fillStyle=g;ctx.fillRect(x,40,w,180);};
  strip(25,40,'#d4cfdf');strip(180,28,'#7039ae');strip(325,65,'#f4f0ff');
  const map=new CanvasTexture(canvas);map.colorSpace=SRGBColorSpace;map.mapping=EquirectangularReflectionMapping;return map;
 },[]);
 useLayoutEffect(()=>{scene.environment=texture;return()=>{scene.environment=null;texture.dispose();};},[scene,texture]);return null;
};
const FloatingPanel=({screen}:{screen?:string})=>{
 const geometry=useMemo(()=>bevelledPanel(1.75,2.65,.045,.12,.015),[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <group><mesh geometry={geometry} castShadow><meshPhysicalMaterial color="#241934" metalness={.5} roughness={.25} clearcoat={1}/></mesh>{screen&&<group position={[0,0,.065]}><ScreenSurface key={screen} src={screen} width={1.67} height={2.55} radius={.09}/></group>}</group>;
};

export const Scene3D=({mode,screen,secondaryScreens=[],progress,width,height,enableShadows=true,style}:Scene3DProps)=>{
 const pixelRatio=useContext(ThreeQuality);const f=useCurrentFrame();const config=useVideoConfig();const t=f/config.fps;
 const p=progress??Math.min(1,f/Math.max(1,config.durationInFrames-1));
 const entrance=interpolate(t,[0,.95],[0,1],ease);
 const phoneAngle=mode==='hook'?[.07,-.42+p*.3,-.05]:mode==='chaos'?[.05,.2+p*.15,.075]:mode==='business'?[.06,-.13-p*.1,-.02]:[.035,-.32+p*.42,-.025];
 const cameraDistance=mode==='product'?interpolate(p,[0,1],[7.6,6.5],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}):mode==='hook'?7.8:9;
 const phoneScale=mode==='business'?.85:mode==='product'?.93:mode==='brand'?.84:.9;
 return <ThreeCanvas width={width??config.width} height={height??config.height} style={{background:'transparent',...style}} camera={{fov:35,position:[0,0,cameraDistance],near:.1,far:35}} gl={{alpha:true,antialias:true,preserveDrawingBuffer:true,toneMapping:ACESFilmicToneMapping}} dpr={pixelRatio} shadows={enableShadows}>
  <StudioEnvironment/>
  <ambientLight intensity={.65}/>
  <directionalLight color="#f5edff" position={[-3,5,5]} intensity={4.2} castShadow={enableShadows} shadow-mapSize={[512,512]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-normalBias={.025} shadow-bias={-.0001}/>
  <directionalLight color="#a884ff" position={[3,.5,2]} intensity={3.3}/>
  <directionalLight color="#7347d4" position={[-2,-1,-3]} intensity={2.5}/>
  <pointLight color="#ffffff" position={[-.7,3,2]} intensity={8} distance={12} decay={2}/>
  {mode==='business'&&<>
    <group position={[-1.16,-.05,-.7]} rotation={[.08,.22,-.08]} scale={entrance*.9}><FloatingPanel screen={secondaryScreens[0]}/></group>
    <group position={[1.14,.3,-.85]} rotation={[.03,-.24,.09]} scale={entrance*.85}><FloatingPanel screen={secondaryScreens[1]}/></group>
  </>}
  <group position={[0,mode==='chaos'?-.17:-.12+(1-entrance)*-.55,0]} rotation={phoneAngle as [number,number,number]} scale={phoneScale*(.94+.06*entrance)}>
    <Phone screen={screen}/>
  </group>
  {(mode==='hook'||mode==='chaos')&&[
    {title:'Há horário disponível?',detail:'Mensagem por responder',x:-.35,y:.83,at:.45},
    {title:'Podes confirmar?',detail:'Nova mensagem',x:.37,y:.06,at:1.08},
    {title:'Ainda dá para hoje?',detail:'A aguardar resposta',x:-.15,y:-.71,at:1.75},
  ].map((note,index)=>{
    const a=interpolate(t,[note.at,note.at+.55],[0,1],ease);
    const tension=mode==='chaos'?Math.sin(t*(1.5+index))*.08:0;
    return <group key={note.title} position={[note.x+tension,note.y+(1-a)*-.3,1.04+index*.1]} rotation={[.015,.04*(index-1),(index-1)*.04+tension*.2]} scale={.83*a}>
      <Notification title={note.title} detail={note.detail} accent={index===2?'#aa78fa':'#8b6bbf'}/>
    </group>;
  })}
  {mode==='chaos'&&<group position={[.9,-1.33,1.45]} rotation={[.05,-.14,-.12]} scale={.72*entrance}><Clock angle={t*t*2.2}/></group>}
  {/* Reflected horizon, with no expensive realtime transmission or external assets. */}
  <mesh receiveShadow position={[0,-2.35,-.15]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[15,15]}/><meshStandardMaterial color="#08080d" metalness={.55} roughness={.4} transparent opacity={.46}/></mesh>
 </ThreeCanvas>;
};
