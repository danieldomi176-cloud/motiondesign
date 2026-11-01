import {interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {BrandMark,Kicker,LightArc,Stage,TextIn,ease} from '../Design';
import {brand} from '../brand';
export const Reveal=()=>{
 const f=useCurrentFrame();const {fps,durationInFrames}=useVideoConfig();
 return <Stage glow={false}>
  <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 49%,#5b21b634,transparent 54%)',opacity:interpolate(f,[0,.7*fps],[0,1],ease)}}/>
  <LightArc progress={f/durationInFrames}/>
  <div style={{position:'absolute',top:520,left:86,right:150,textAlign:'center'}}><TextIn delay={.2}><Kicker>UMA FORMA MAIS INTELIGENTE DE TRABALHAR.</Kicker></TextIn></div>
  <div style={{position:'absolute',top:790,left:86,right:150,textAlign:'center',scale:interpolate(f,[0,durationInFrames],[.92,1],ease)}}><TextIn delay={.2}><BrandMark size={208}/></TextIn><TextIn delay={.65} style={{marginTop:55,fontSize:49,lineHeight:1.28,fontWeight:400,color:'#d5cce1'}}>{brand.tagline}</TextIn></div>
  <TextIn delay={1.3} style={{position:'absolute',left:86,right:150,bottom:330,fontSize:29,textAlign:'center',color:'#8d809e',letterSpacing:1}}>Serviços. Pessoas. Marcações.</TextIn>
 </Stage>;
};
