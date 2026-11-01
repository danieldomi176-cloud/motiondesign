import type {Caption} from '@remotion/captions';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
/** Pages are derived from aligned words; no estimated uniform word durations. */
export const Captions = ({captions}: {captions: Caption[]}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); const ms = frame / fps * 1000;
  const pages: Caption[][] = []; let page: Caption[] = [];
  for(const c of captions) {
    if(page.length && (page.length >= 4 || /[.!?]$/.test(page[page.length-1].text.trim()) || c.startMs - page[page.length-1].endMs > 350 || page.map(w=>w.text).join('').length+c.text.length>27)) {pages.push(page); page=[];}
    page.push(c); if(c.pageBreakAfter) {pages.push(page);page=[];}
  }
  if(page.length) pages.push(page);
  const current = pages.find(p => ms >= p[0].startMs && ms < p[p.length-1].endMs + 110);
  if(!current) return null;
  return <div style={{position:'absolute',left:90,right:155,bottom:310,display:'flex',justifyContent:'center',flexWrap:'wrap',gap:'4px 12px',fontFamily:'DM Sans',fontWeight:900,fontSize:54,lineHeight:1.24,textAlign:'center',textShadow:'0 3px 12px #000',padding:'18px 20px',borderRadius:14,background:'rgba(5,10,16,.90)',border:'1px solid #ffffff20'}}>
    {current.map((word,i) => {
      const active = ms>=word.startMs && ms<word.endMs;
      return <span key={i} style={{display:'inline-block',padding:'1px 7px',borderRadius:5,color:active?'#07100d':'white',background:active?'#d9ff43':'transparent',textShadow:active?'none':undefined,scale:active?interpolate(ms,[word.startMs,word.startMs+80],[1.12,1],{extrapolateRight:'clamp'}):1}}>{word.text.trim()}</span>;
    })}
  </div>;
};
