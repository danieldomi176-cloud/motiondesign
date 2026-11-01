import {interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {Scene3D} from '../three';
import {Stage,TextIn,Kicker,ProductDisclosure,ease} from '../Design';
import {brand} from '../brand';
export const Business=()=>{
 const f=useCurrentFrame();const {fps,durationInFrames}=useVideoConfig();const p=f/durationInFrames;
 return <Stage><div style={{position:'absolute',top:270,left:86,right:150,zIndex:2}}><Kicker>PARA QUEM GERE O NEGÓCIO.</Kicker><TextIn style={{fontSize:85,fontWeight:600,lineHeight:1.09,letterSpacing:-4}}>{brand.benefit.title}<br/><span style={{color:'#aa83e1'}}>{brand.benefit.accent}</span></TextIn></div>
  <div style={{position:'absolute',left:0,right:0,top:560,height:1000}}><Scene3D mode="business" screen={brand.businessScreens[0]} secondaryScreens={brand.businessScreens.slice(1)} progress={p} width={1080} height={1000}/></div>
  {!brand.businessScreens.length&&<div style={{position:'absolute',left:112,right:172,top:765,display:'grid',gridTemplateColumns:'1fr 1fr',gap:22,perspective:1200}}>{brand.benefit.features.map((feature,i)=><TextIn key={feature} delay={.3+i*.22} style={{background:'linear-gradient(135deg,#342547ee,#17101fee)',border:'1px solid #c2a6e939',borderRadius:22,padding:'28px 20px',boxShadow:'0 20px 40px #0005',rotate:`${i%2?3:-3}deg`,translate:`${i%2?20:-20}px ${i%2?90:0}px`}}><div style={{fontSize:19,color:'#a78ac9',letterSpacing:2,marginBottom:25}}>AGEXA / 0{i+1}</div><div style={{fontSize:34,fontWeight:550}}>{feature}</div><div style={{height:3,background:'#9e74d44d',width:'58%',marginTop:30}}/></TextIn>)}</div>}
  <TextIn delay={1.25} style={{position:'absolute',bottom:315,left:86,right:150,textAlign:'center',fontSize:42,color:'#beb3c9'}}>O teu negócio. Num só lugar.</TextIn><ProductDisclosure/>
 </Stage>;
};
