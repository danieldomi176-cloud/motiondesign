import {interpolate,useCurrentFrame,useVideoConfig} from 'remotion';
import {Scene3D} from '../three';
import {Stage,TextIn,Kicker,ProductDisclosure,StepDots} from '../Design';
import {brand} from '../brand';
export const Product=()=>{
 const f=useCurrentFrame();const {fps,durationInFrames}=useVideoConfig();const p=f/Math.max(1,durationInFrames-1);const step=Math.min(2,Math.floor(p*3));const item=brand.product[step];const screen=brand.clientScreens[Math.min(step,brand.clientScreens.length-1)];
 return <Stage><div style={{position:'absolute',top:280,left:86,right:150,zIndex:2}}><Kicker>PARA QUEM MARCA.</Kicker><TextIn key={step} delay={step*durationInFrames/fps/3} style={{fontSize:124,fontWeight:620,lineHeight:1,letterSpacing:-6}}>{item.title}</TextIn><div style={{fontSize:44,color:'#bcb4c7',marginTop:26}}>{item.detail}</div></div>
  <div style={{position:'absolute',left:0,right:0,top:590,height:1100}}><Scene3D mode="product" screen={screen} progress={p} width={1080} height={1100}/></div>
  {!brand.clientScreens.length&&<div style={{position:'absolute',left:345,right:390,top:975,textAlign:'center',pointerEvents:'none'}}><div style={{fontSize:21,letterSpacing:2,color:'#c3a8eb'}}>AGEXA</div><div style={{fontSize:61,color:'#e5d9f6',marginTop:48,fontWeight:550}}>{['01','02','03'][step]}</div></div>}
  <div style={{position:'absolute',left:86,right:150,bottom:320}}><StepDots active={step}/></div><ProductDisclosure/>
 </Stage>;
};
