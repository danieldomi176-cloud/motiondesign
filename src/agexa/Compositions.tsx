import {Composition,Folder} from 'remotion';
import {AgexaCampaign,AgexaShort} from './Campaign';
import {Hook} from './scenes/Hook';
import {Pain} from './scenes/Pain';
import {Reveal} from './scenes/Reveal';
import {Product} from './scenes/Product';
import {Business} from './scenes/Business';
import {Conversion} from './scenes/Conversion';
export const AgexaCompositions=()=> <Folder name="AGEXA">
 <Composition id="AGEXA-Official" component={AgexaCampaign} defaultProps={{threePixelRatio:.75}} width={1080} height={1920} fps={30} durationInFrames={1200}/>
 <Composition id="AGEXA-TikTok-15s" component={AgexaShort} defaultProps={{threePixelRatio:.75}} width={1080} height={1920} fps={30} durationInFrames={450}/>
 <Folder name="Cenas">
 <Composition id="AGEXA-Hook" component={Hook} width={1080} height={1920} fps={30} durationInFrames={120}/>
 <Composition id="AGEXA-Pain" component={Pain} width={1080} height={1920} fps={30} durationInFrames={180}/>
 <Composition id="AGEXA-Reveal" component={Reveal} width={1080} height={1920} fps={30} durationInFrames={150}/>
 <Composition id="AGEXA-Product" component={Product} width={1080} height={1920} fps={30} durationInFrames={300}/>
 <Composition id="AGEXA-Business" component={Business} width={1080} height={1920} fps={30} durationInFrames={240}/>
 <Composition id="AGEXA-Conversion" component={Conversion} width={1080} height={1920} fps={30} durationInFrames={210}/>
 </Folder>
 </Folder>;
