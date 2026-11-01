import React,{useEffect,useState} from 'react';
import {AbsoluteFill,CanvasImage,Img,Easing,cancelRender,continueRender,delayRender,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {brand,ink,purple,violet} from './brand';
export const ease={extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.18,.9,.18,1)} as const;
export const useAgexaFonts=()=>{
 const [handle]=useState(()=>delayRender('Fontes oficiais de composição AGEXA'));
 useEffect(()=>{let live=true;const face=new FontFace('Agexa Sans',`url(${staticFile('fonts/DMSans.ttf')})`,{weight:'100 1000'});
 face.load().then(font=>{(document.fonts as FontFaceSet&{add:(f:FontFace)=>void}).add(font);if(live)continueRender(handle);}).catch(cancelRender);return()=>{live=false;continueRender(handle);};},[handle]);
};
export const Stage=({children,glow=true}:{children:React.ReactNode;glow?:boolean})=>{
 useAgexaFonts();const f=useCurrentFrame();const {fps}=useVideoConfig();
 return <AbsoluteFill style={{background:ink,color:'white',fontFamily:'Agexa Sans, sans-serif',overflow:'hidden'}}>
  {glow&&<div style={{position:'absolute',left:-250,right:-250,top:450,height:1200,background:'radial-gradient(ellipse at 50% 52%, #5321a424 0%, #29104e15 35%, transparent 68%)',translate:`${Math.sin(f/fps*.3)*35}px ${Math.cos(f/fps*.25)*25}px`}}/>}
  <div style={{position:'absolute',left:86,right:150,top:143,display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:24,letterSpacing:4,color:'#d5d0e1',fontWeight:600}}><span>AGEXA</span><span style={{fontSize:19,color:'#7f788b',letterSpacing:3}}>FEITO PARA O TEU NEGÓCIO</span></div>
  {children}
 </AbsoluteFill>;
};
export const TextIn=({children,delay=0,style={}}:{children:React.ReactNode;delay?:number;style?:React.CSSProperties})=>{
 const frame=useCurrentFrame();const {fps}=useVideoConfig();
 return <div style={{opacity:interpolate(frame,[delay*fps,(delay+.45)*fps],[0,1],ease),translate:interpolate(frame,[delay*fps,(delay+.65)*fps],['0px 35px','0px 0px'],ease),...style}}>{children}</div>;
};
export const Kicker=({children}:{children:React.ReactNode})=><div style={{fontSize:25,fontWeight:650,letterSpacing:4,color:'#bda8e8',marginBottom:24}}>{children}</div>;
export const BrandMark=({size=132,icon=true}:{size?:number;icon?:boolean})=>{
 const {fps}=useVideoConfig();
 if(brand.logoFile)return <div style={{width:'100%',display:'flex',justifyContent:'center'}}>
  <svg width={0} height={0} style={{position:'absolute'}}><defs><filter id="agexa-logo-key" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  .2126 .7152 .0722 0 0" result="luma"/><feComponentTransfer in="luma" result="alpha"><feFuncA type="linear" slope={12} intercept={-.6}/></feComponentTransfer><feComposite in="SourceGraphic" in2="alpha" operator="in"/></filter></defs></svg>
  <Img src={staticFile(brand.logoFile)} style={{width:'100%',maxWidth:820,height:250,objectFit:'contain',filter:'url(#agexa-logo-key)'}}/>
 </div>;
 return <div style={{fontWeight:600,fontSize:size,letterSpacing:-size*.065,lineHeight:1,color:'white'}}>Agexa<span style={{color:violet}}>.</span></div>;
};
export const LightArc=({progress=0}:{progress?:number})=><svg width="1080" height="620" viewBox="0 0 1080 620" style={{position:'absolute',left:0,top:710,opacity:.45+progress*.3,overflow:'visible'}}><defs><linearGradient id="arc" x1="0" x2="1"><stop stopColor="#7C3AED" stopOpacity="0"/><stop offset=".45" stopColor="#A855F7"/><stop offset=".65" stopColor="#e7d5ff"/><stop offset="1" stopColor="#7C3AED" stopOpacity="0"/></linearGradient></defs><path d={`M -100 ${390+progress*35} C 230 530 820 60 1190 220`} fill="none" stroke="url(#arc)" strokeWidth="2"/><path d="M -100 414 C 270 530 800 100 1190 245" fill="none" stroke="url(#arc)" strokeWidth="1" opacity=".28"/></svg>;
export const ProductDisclosure=()=>!brand.assetsVerified?<div style={{position:'absolute',left:86,right:150,top:565,fontSize:28,color:'#c3b6d2',letterSpacing:2,textAlign:'center',lineHeight:1.45}}>VISUALIZAÇÃO CONCEPTUAL<div style={{fontSize:24,color:'#aaa0b6',letterSpacing:.7}}>Capturas reais não disponíveis.</div></div>:null;
export const BottomLine=({children}:{children:React.ReactNode})=><div style={{position:'absolute',left:86,right:150,bottom:280,fontSize:42,fontWeight:450,lineHeight:1.3,color:'#c5bfce',textAlign:'center'}}>{children}</div>;
export const StepDots=({active,count=3}:{active:number;count?:number})=><div style={{display:'flex',gap:14,justifyContent:'center'}}>{Array.from({length:count},(_,i)=><div key={i} style={{width:i===active?44:8,height:8,borderRadius:10,background:i===active?'#ad82f2':'#4a3a5e'}}/>)}</div>;
