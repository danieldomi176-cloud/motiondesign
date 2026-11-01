import {interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {BrandMark,Kicker,Stage,TextIn,ease} from '../Design';
import {brand} from '../brand';
export const Conversion=()=>{
 const f=useCurrentFrame();const {fps}=useVideoConfig();
 return <Stage glow={false}><div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 50% 30%, #55218b29, transparent 65%)'}}/>
  <div style={{position:'absolute',left:86,right:150,top:310,textAlign:'center'}}><TextIn><BrandMark size={142}/></TextIn><TextIn delay={.3} style={{marginTop:80}}><Kicker>{brand.cta.intro}</Kicker><div style={{fontSize:86,lineHeight:1.1,letterSpacing:-4,fontWeight:550,whiteSpace:'pre-line'}}>{brand.cta.headline}</div></TextIn>
  <TextIn delay={.65} style={{marginTop:70,background:'linear-gradient(105deg,#7C3AED,#9861dc)',border:'1px solid #c0a5eb60',borderRadius:18,padding:'30px 24px',fontSize:42,fontWeight:550,boxShadow:'0 20px 80px #713cbb20'}}>{brand.cta.action}</TextIn>
  <TextIn delay={.8} style={{marginTop:57,fontSize:44,fontWeight:550,letterSpacing:1}}>{brand.whatsapp}</TextIn>
  <TextIn delay={.9} style={{marginTop:24,fontSize:42,fontWeight:450,color:'#c0b5cc'}}>{brand.website}</TextIn>
  <TextIn delay={1.15} style={{marginTop:75,paddingTop:45,borderTop:'1px solid #b5a5c127',fontSize:34,lineHeight:1.4,color:'#a79bb6'}}>{brand.tagline}</TextIn></div>
 </Stage>;
};
