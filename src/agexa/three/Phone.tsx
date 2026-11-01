import {useEffect,useMemo} from 'react';
import {bevelledPanel,roundedPlane} from './geometry';
import {ScreenSurface} from './ScreenSurface';

export const Phone=({screen}:{screen?:string})=>{
 const pieces=useMemo(()=>({
  metal:bevelledPanel(2,4.16,.17,.24,.025),
  back:bevelledPanel(1.97,4.13,.045,.225,.018),
  glass:bevelledPanel(1.925,4.085,.018,.215,.012),
  display:roundedPlane(1.83,3.85,.17),
  speaker:bevelledPanel(.3,.025,.009,.012,.003),
  island:bevelledPanel(.43,.125,.012,.06,.008),
  button:bevelledPanel(.036,.39,.06,.014,.009),
 }),[]);
 useEffect(()=>()=>Object.values(pieces).forEach(g=>g.dispose()),[pieces]);
 return <group>
  <mesh geometry={pieces.metal} position={[0,0,-.09]} castShadow receiveShadow>
   <meshStandardMaterial color="#757187" metalness={.94} roughness={.22}/>
  </mesh>
  <mesh geometry={pieces.back} position={[0,0,-.125]} castShadow>
   <meshPhysicalMaterial color="#101018" metalness={.5} roughness={.2} clearcoat={1} clearcoatRoughness={.15}/>
  </mesh>
  <mesh geometry={pieces.glass} position={[0,0,.105]}>
   <meshPhysicalMaterial color="#080911" metalness={.2} roughness={.1} clearcoat={1} clearcoatRoughness={.05}/>
  </mesh>
  <group position={[0,-.006,.142]}>
   {screen?<ScreenSurface key={screen} src={screen}/>:<>
    <mesh geometry={pieces.display}><meshPhysicalMaterial color="#141024" metalness={.18} roughness={.12} clearcoat={1}/></mesh>
    {/* An abstract material treatment, never a purported AGEXA application screen. */}
    <mesh position={[0,-.08,.003]}><torusGeometry args={[.57,.018,12,80]}/><meshStandardMaterial color="#8e64e9" emissive="#7c3aed" emissiveIntensity={.3} roughness={.25} metalness={.6}/></mesh>
    <mesh position={[0,-.08,.005]}><circleGeometry args={[.48,48]}/><meshPhysicalMaterial color="#1d113b" roughness={.2} clearcoat={1}/></mesh>
   </>}
  </group>
  <mesh geometry={pieces.island} position={[0,1.81,.155]}><meshStandardMaterial color="#020205" roughness={.36} metalness={.1}/></mesh>
  <mesh geometry={pieces.speaker} position={[-.025,1.814,.174]}><meshStandardMaterial color="#16161d" metalness={.2} roughness={.8}/></mesh>
  <mesh position={[.145,1.811,.179]}><circleGeometry args={[.024,20]}/><meshPhysicalMaterial color="#101d38" metalness={.65} roughness={.06} clearcoat={1}/></mesh>
  <mesh geometry={pieces.button} position={[1.01,.56,-.015]}><meshStandardMaterial color="#615d72" metalness={1} roughness={.24}/></mesh>
  <mesh geometry={pieces.button} position={[-1.01,.8,-.015]} scale={[1,.6,1]}><meshStandardMaterial color="#615d72" metalness={1} roughness={.24}/></mesh>
  <mesh geometry={pieces.button} position={[-1.01,.26,-.015]} scale={[1,.6,1]}><meshStandardMaterial color="#615d72" metalness={1} roughness={.24}/></mesh>
  <mesh geometry={pieces.speaker} position={[0,-2.075,.0]} rotation={[Math.PI/2,0,0]} scale={[1.1,1,1]}><meshStandardMaterial color="#010104"/></mesh>
 </group>;
};
