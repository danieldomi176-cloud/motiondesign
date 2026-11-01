import {useEffect,useMemo} from 'react';
import {useLoader} from '@react-three/fiber';
import {staticFile} from 'remotion';
import {SRGBColorSpace,TextureLoader} from 'three';
import {roundedPlane} from './geometry';

/** Captured product pixels, aspect-preserving. ThreeCanvas suspends until texture is ready. */
export const ScreenSurface=({src,width=1.83,height=3.85,radius=.18}:{src:string;width?:number;height?:number;radius?:number})=>{
 const loaded=useLoader(TextureLoader,staticFile(src));
 const texture=useMemo(()=>{
   // Isolate UV transforms when one capture appears on differently sized surfaces.
   const asset=loaded.clone();asset.needsUpdate=true;asset.colorSpace=SRGBColorSpace;asset.anisotropy=4;
   const image=asset.image as {width:number;height:number};const ratio=image.width/image.height;const panelRatio=width/height;
   if(ratio>panelRatio){asset.repeat.x=panelRatio/ratio;asset.offset.x=(1-asset.repeat.x)/2;}
   else{asset.repeat.y=ratio/panelRatio;asset.offset.y=1-asset.repeat.y;}
   return asset;
 },[loaded,width,height]);
 const geometry=useMemo(()=>roundedPlane(width,height,radius),[width,height,radius]);
 useEffect(()=>()=>{geometry.dispose();texture.dispose();},[geometry,texture]);
 return <mesh geometry={geometry}><meshBasicMaterial map={texture} toneMapped={false}/></mesh>;
};
