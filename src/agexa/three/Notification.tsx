import {useEffect,useMemo} from 'react';
import {CanvasTexture,SRGBColorSpace} from 'three';
import {bevelledPanel,roundedPlane} from './geometry';

export const Notification=({title,detail,accent='#a78bfa',opacity=1}:{title:string;detail:string;accent?:string;opacity?:number})=>{
 const geometry=useMemo(()=>bevelledPanel(2.25,.64,.04,.09,.01),[]);
 const plane=useMemo(()=>roundedPlane(2.2,.59,.075),[]);
 const texture=useMemo(()=>{
  const canvas=document.createElement('canvas');canvas.width=900;canvas.height=240;
  const ctx=canvas.getContext('2d')!;
  ctx.clearRect(0,0,900,240);ctx.fillStyle=accent;ctx.beginPath();ctx.roundRect(40,56,74,74,18);ctx.fill();
  ctx.strokeStyle='#ffffff';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(59,81);ctx.lineTo(95,81);ctx.moveTo(59,95);ctx.lineTo(87,95);ctx.stroke();
  ctx.font='bold 38px Arial';ctx.fillStyle='#ffffff';ctx.fillText(title,145,86);
  ctx.font='30px Arial';ctx.fillStyle='#b5afc8';ctx.fillText(detail,145,136);
  ctx.fillStyle='#9385aa';ctx.font='23px Arial';ctx.fillText('AGORA',745,76);
  const map=new CanvasTexture(canvas);map.colorSpace=SRGBColorSpace;return map;
 },[title,detail,accent]);
 useEffect(()=>()=>{geometry.dispose();plane.dispose();texture.dispose();},[geometry,plane,texture]);
 return <group>
  <mesh geometry={geometry} castShadow><meshPhysicalMaterial color="#292333" metalness={.25} roughness={.25} clearcoat={.7} transparent opacity={opacity}/></mesh>
  <mesh geometry={plane} position={[0,0,.055]}><meshBasicMaterial map={texture} transparent opacity={opacity} toneMapped={false}/></mesh>
 </group>;
};
