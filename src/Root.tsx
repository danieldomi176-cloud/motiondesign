import {AgexaCompositions} from './agexa/Compositions';
import {Composition} from 'remotion';
import {FootballShort} from './FootballShort';
import data from '../content/demo.json';
import type {Project} from './model';
const project=data as Project;
export const RemotionRoot = () => <><Composition id="FootballShort" component={FootballShort} width={1080} height={1920} fps={30} durationInFrames={Math.round(project.durationSeconds*project.fps)} defaultProps={{project}} calculateMetadata={({props})=>({durationInFrames:Math.round(props.project.durationSeconds*props.project.fps),fps:props.project.fps,width:props.project.width,height:props.project.height})}/><AgexaCompositions/></>;
