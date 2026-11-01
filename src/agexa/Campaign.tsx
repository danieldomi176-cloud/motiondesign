import {ThreeQuality} from './three/quality';
import {Audio} from '@remotion/media';
import {AbsoluteFill,Sequence,staticFile,useVideoConfig} from 'remotion';
import {brand} from './brand';
import {useAgexaFonts} from './Design';
import {Hook} from './scenes/Hook';
import {Pain} from './scenes/Pain';
import {Reveal} from './scenes/Reveal';
import {Product} from './scenes/Product';
import {Business} from './scenes/Business';
import {Conversion} from './scenes/Conversion';
export const AgexaCampaign=({threePixelRatio=.75}:{threePixelRatio?:number})=>{
 const {fps}=useVideoConfig();
 return <ThreeQuality.Provider value={threePixelRatio}><AbsoluteFill><Sequence name="01 — O risco" from={0} durationInFrames={4*fps} premountFor={fps}><Hook/></Sequence>
 <Sequence name="02 — A desorganização" from={4*fps} durationInFrames={6*fps} premountFor={fps}><Pain/></Sequence>
 <Sequence name="03 — AGEXA" from={10*fps} durationInFrames={5*fps} premountFor={fps}><Reveal/></Sequence>
 <Sequence name="04 — Como marcar" from={15*fps} durationInFrames={10*fps} premountFor={fps}><Product/></Sequence>
 <Sequence name="05 — Como gerir" from={25*fps} durationInFrames={8*fps} premountFor={fps}><Business/></Sequence>
 <Sequence name="06 — Contacto" from={33*fps} durationInFrames={7*fps} premountFor={fps}><Conversion/></Sequence>
 <Audio src={staticFile(brand.audio.main)} premountFor={fps}/></AbsoluteFill></ThreeQuality.Provider>;
};
export const AgexaShort=({threePixelRatio=.75}:{threePixelRatio?:number})=>{
 const {fps}=useVideoConfig();
 return <ThreeQuality.Provider value={threePixelRatio}><AbsoluteFill><Sequence name="01 — O risco" from={0} durationInFrames={2*fps} premountFor={fps}><Hook/></Sequence>
 <Sequence name="02 — A marca" from={2*fps} durationInFrames={2*fps} premountFor={fps}><Reveal/></Sequence>
 <Sequence name="03 — A solução" from={4*fps} durationInFrames={5*fps} premountFor={fps}><Product/></Sequence>
 <Sequence name="04 — Contacto" from={9*fps} durationInFrames={6*fps} premountFor={fps}><Conversion/></Sequence>
 <Audio src={staticFile(brand.audio.short)} premountFor={fps}/></AbsoluteFill></ThreeQuality.Provider>;
};
