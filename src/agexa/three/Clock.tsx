/** A true geometric clock; hand animation is entirely frame-driven by its caller. */
export const Clock=({angle=0}:{angle?:number})=><group>
 <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.72,.72,.12,64]}/><meshStandardMaterial color="#423355" metalness={.85} roughness={.24}/></mesh>
 <mesh position={[0,0,.067]}><circleGeometry args={[.67,64]}/><meshPhysicalMaterial color="#12101e" roughness={.28} metalness={.3} clearcoat={.9}/></mesh>
 <mesh position={[0,0,.078]}><torusGeometry args={[.697,.017,12,72]}/><meshStandardMaterial color="#bd9ff4" metalness={.8} roughness={.2}/></mesh>
 {Array.from({length:12},(_,i)=>{
  const a=i*Math.PI/6;return <mesh key={i} position={[Math.sin(a)*.578,Math.cos(a)*.578,.08]} rotation={[0,0,-a]}><boxGeometry args={[.018,i%3===0?.075:.04,.012]}/><meshBasicMaterial color={i%3===0?'#ffffff':'#8a789d'}/></mesh>;
 })}
 <group position={[0,0,.105]} rotation={[0,0,-angle/12]}><mesh position={[0,.12,0]}><boxGeometry args={[.037,.25,.018]}/><meshStandardMaterial color="#eeeaf7" roughness={.3}/></mesh></group>
 <group position={[0,0,.13]} rotation={[0,0,-angle]}><mesh position={[0,.21,0]}><boxGeometry args={[.024,.43,.016]}/><meshStandardMaterial color="#b988ff" emissive="#7c3aed" emissiveIntensity={.3}/></mesh></group>
 <mesh position={[0,0,.151]}><sphereGeometry args={[.04,16,12]}/><meshStandardMaterial color="#eee7ff" metalness={.6} roughness={.15}/></mesh>
</group>;
