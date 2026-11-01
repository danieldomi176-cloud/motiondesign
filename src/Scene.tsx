import {AbsoluteFill, CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {MotionPhoto} from './MotionPhoto';
import type {Scene as SceneData} from './model';
const lime = '#d9ff43';
export const Scene = ({scene}: {scene:SceneData}) => {
 const f = useCurrentFrame(); const {fps}=useVideoConfig();
 const enter = {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.16,1,.3,1)} as const;
 return <AbsoluteFill style={{background:'#050a10',overflow:'hidden'}}>
  <MotionPhoto image={scene.image} duration={scene.duration} focus={scene.kind==='reveal'}/>
  {scene.foregroundImage && <CanvasImage src={staticFile(scene.foregroundImage)} premountFor={fps} style={{position:'absolute',top:690,left:560,width:440,height:440,objectFit:'contain',filter:'drop-shadow(0 30px 30px #0009)',rotate:interpolate(f,[0,scene.duration*fps],['-20deg','15deg']),translate:interpolate(f,[0,scene.duration*fps],['90px 50px','-90px -80px'])}}/>}
  {scene.kind==='hook' && <>
    <div style={{position:'absolute',top:770,left:-120,right:-120,height:180,background:lime,rotate:'-13deg',opacity:.95,translate:interpolate(f,[0,10],['-1200px 0px','0px 0px'],enter)}}/>
    <div style={{position:'absolute',top:800,left:50,fontFamily:'Barlow',fontSize:115,color:'#07100d',rotate:'-13deg',letterSpacing:3,translate:interpolate(f,[0,10],['-1200px 0px','0px 0px'],enter)}}>{scene.details?.[0] ?? scene.accent}</div>
  </>}
  {scene.kind==='stat' && <>
    <AbsoluteFill style={{background:'#050a1066'}}/>
    <div style={{position:'absolute',top:540,left:80,right:150,fontFamily:'Barlow',lineHeight:.78,color:lime,fontSize:480,letterSpacing:-18,scale:interpolate(f,[0,20],[1.6,1],enter)}}>{scene.headline}</div>
    <div style={{position:'absolute',top:960,left:86,right:155,fontFamily:'Barlow',fontSize:118,lineHeight:.94}}>{scene.details?.[0]}<br/><span style={{color:lime}}>{scene.details?.[1]}</span></div>
    <div style={{position:'absolute',top:1255,left:88,fontFamily:'DM Sans',fontSize:30,color:'#c3cbd2',letterSpacing:3}}>{scene.details?.[2]}</div>
  </>}
  {scene.kind==='reveal' && <>
    <div style={{position:'absolute',top:526,left:-40,right:-40,fontFamily:'Barlow',fontSize:211,textAlign:'center',color:'transparent',WebkitTextStroke:'2px #d9ff4377',letterSpacing:2,translate:interpolate(f,[0,scene.duration*fps],['-20px 0px','20px 0px'])}}>{scene.headline}</div>
    <div style={{position:'absolute',top:1010,left:75,fontFamily:'Barlow',fontSize:164,color:lime,letterSpacing:-2,rotate:'-5deg',translate:interpolate(f,[0,16],['-1000px 0px','0px 0px'],enter)}}>{scene.headline}</div>
    <div style={{position:'absolute',top:1188,left:85,display:'flex',gap:12,alignItems:'center',fontFamily:'DM Sans',fontWeight:700,fontSize:32}}><div style={{height:18,width:18,background:lime,borderRadius:100}}/>{scene.accent}</div>
  </>}
  {scene.kind==='cta' && <>
    <div style={{position:'absolute',inset:'510px 0 480px 0',display:'flex',overflow:'hidden',clipPath:'polygon(0 0,100% 0,100% 100%,0 100%)'}}>
      <CanvasImage src={staticFile(scene.secondaryImage ?? scene.image)} premountFor={fps} style={{width:'50%',height:'100%',objectFit:'cover',objectPosition:'50% 55%',scale:1.2}}/>
      <CanvasImage src={staticFile(scene.image)} premountFor={fps} style={{width:'50%',height:'100%',objectFit:'cover',objectPosition:'50% 55%',scale:1.2}}/>
    </div>
    <div style={{position:'absolute',top:840,left:430,fontFamily:'Barlow',fontSize:135,color:lime,rotate:'-8deg',textShadow:'0 4px 12px black'}}>VS</div>
    <div style={{position:'absolute',left:80,right:155,top:1150,display:'flex',gap:14,fontFamily:'Barlow',fontSize:55}}>
      <div style={{flex:1,padding:'20px 12px',background:lime,color:'#07100d',textAlign:'center'}}>{scene.details?.[0]}</div><div style={{flex:1,padding:'20px 12px',background:'#f3f5ed',color:'#07100d',textAlign:'center'}}>{scene.details?.[1]}</div>
    </div>
  </>}
  <div style={{position:'absolute',top:260,left:82,right:150,translate:interpolate(f,[0,14],['0px 40px','0px 0px'],enter),opacity:interpolate(f,[0,8],[0,1],enter)}}>
   <div style={{fontFamily:'DM Sans',fontSize:27,fontWeight:800,letterSpacing:4,color:lime,marginBottom:20}}>{scene.eyebrow}</div>
   {scene.kind!=='stat'&&scene.kind!=='reveal' && <div style={{fontFamily:'Barlow',fontSize:scene.kind==='hook'?132:127,lineHeight:.91,letterSpacing:-1.5,whiteSpace:'pre-line',textShadow:'0 4px 25px #0008'}}>{scene.headline}</div>}
   {scene.kind==='reveal' && <div style={{fontFamily:'Barlow',fontSize:123,lineHeight:.91}}>{scene.details?.[0]}<br/><span style={{color:lime}}>{scene.details?.[1]}</span></div>}
   {scene.kind==='stat' && <div style={{fontFamily:'Barlow',fontSize:111,lineHeight:.91}}>ISTO É<br/>ABSURDO.</div>}
  </div>
  {scene.kind==='tease' && <div style={{position:'absolute',top:1050,left:84,right:155,background:lime,color:'#07100d',padding:'28px 35px',fontFamily:'Barlow',fontSize:70,rotate:'-4deg',scale:interpolate(f,[0,16],[.8,1],enter)}}>+ INSCREVE-TE</div>}
  {scene.kind!=='stat' && scene.kind!=='reveal' && scene.kind!=='cta' && <div style={{position:'absolute',top:1280,left:85,right:155,fontFamily:'DM Sans',fontSize:26,fontWeight:800,letterSpacing:2,color:lime,borderLeft:`5px solid ${lime}`,paddingLeft:18}}>{scene.accent}</div>}
  <div style={{position:'absolute',inset:0,pointerEvents:'none',background:lime,opacity:interpolate(f,[0,3,8],[.7,.12,0],{extrapolateRight:'clamp'})}}/>
  <div style={{position:'absolute',top:0,bottom:0,width:170,background:'linear-gradient(90deg,transparent,#d9ff4322,transparent)',rotate:'-18deg',translate:interpolate(f,[0,18],['-300px 0px','1500px 0px'],{extrapolateRight:'clamp'})}}/>
 </AbsoluteFill>;
};
