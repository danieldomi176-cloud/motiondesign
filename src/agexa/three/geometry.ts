import {ExtrudeGeometry, Shape, ShapeGeometry} from 'three';

/** Geometry has real depth and bevels; coordinates are centred in world units. */
export const roundedShape = (width:number, height:number, radius:number) => {
  const shape = new Shape(); const x=-width/2;const y=-height/2;const r=Math.min(radius,width/2,height/2);
  shape.moveTo(x+r,y);shape.lineTo(x+width-r,y);shape.quadraticCurveTo(x+width,y,x+width,y+r);
  shape.lineTo(x+width,y+height-r);shape.quadraticCurveTo(x+width,y+height,x+width-r,y+height);
  shape.lineTo(x+r,y+height);shape.quadraticCurveTo(x,y+height,x,y+height-r);
  shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);return shape;
};
export const bevelledPanel = (width:number,height:number,depth:number,radius=.16,bevel=.018) => new ExtrudeGeometry(roundedShape(width,height,radius),{
 depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:14,
});
export const roundedPlane = (width:number,height:number,radius=.12) => {
 const geometry=new ShapeGeometry(roundedShape(width,height,radius),16);
 const positions=geometry.getAttribute('position');const uv=geometry.getAttribute('uv');
 for(let i=0;i<positions.count;i++) uv.setXY(i,positions.getX(i)/width+.5,positions.getY(i)/height+.5);
 uv.needsUpdate=true;return geometry;
};
