import { analysisRounds, continuationSources, pathColumns, pathContinuations, pathEdges, type PathColor, type AnalysisRound } from './bebop-analysis-path';

export type NodeBox = {x:number; y:number; width:number; height:number};
export type PathRoute = {from:string[]; to:string; d:string; color:PathColor; continuation?:boolean; arrow?:boolean; dots?:[number,number][]};
export const pathHeaderHeight=64;
export const pathColumnHeight=40;

// Walk ancestors and descendants independently so selecting one test never selects its siblings.
export function relatedPathNodes(id:string|null, edges=pathEdges) {
  const related=new Set<string>(id?[id]:[]);
  if(!id)return related;
  for(const upstream of [true,false]){
    const seen=new Set([id]),queue=[id];
    while(queue.length){
      const current=queue.shift();
      for(const [from,to] of edges){
        const source=upstream?to:from,target=upstream?from:to;
        if(source===current&&!seen.has(target)){seen.add(target);related.add(target);queue.push(target);}
      }
    }
  }
  return related;
}

export function analysisPathLayout(width:number, contentHeights:Record<string,number>={}, graphRounds:AnalysisRound[]=analysisRounds, footerHeight=0) {
  const boxes:Record<string,NodeBox>={};
  const rounds:Record<string,{top:number;height:number;diagramTop:number;diagramHeight:number}>={};
  let top=0;
  for(const round of graphRounds){
    const diagramTop=top+pathHeaderHeight+pathColumnHeight+1;
    let bottom=0;
    for(const column of Object.keys(pathColumns) as (keyof typeof pathColumns)[]){
      let previousBottom=-20;
      const col=pathColumns[column];
      for(const node of round.nodes.filter(n=>n.column===column).sort((a,b)=>a.y-b.y)){
        const y=Math.max(node.y,previousBottom+20);
        const height=Math.max(node.h,Math.ceil(contentHeights[node.id]??0)+32);
        boxes[node.id]={x:width*col.x/100,y:diagramTop+y,width:width*col.w/100,height};
        previousBottom=y+height;
        bottom=Math.max(bottom,previousBottom);
      }
    }
    let pairBottom=0;
    for(const [left,right] of round.alignments??[]){
      const a=boxes[left],b=boxes[right];
      const y=Math.max(a.y,b.y,diagramTop+pairBottom+20),height=Math.max(a.height,b.height);
      for(const box of [a,b]){box.y=y;box.height=height;}
      pairBottom=y-diagramTop+height;
      bottom=Math.max(bottom,pairBottom);
    }
    if(round.centerObservations){
      for(const node of round.nodes.filter(n=>n.column==='observation')){
        const targets=round.edges.filter(([from,to])=>from===node.id&&!to.startsWith('custom-')).map(([,to])=>boxes[to]);
        if(!targets.length)continue;
        const box=boxes[node.id];
        box.y=Math.max(diagramTop+28,(Math.min(...targets.map(b=>b.y))+Math.max(...targets.map(b=>b.y+b.height))-box.height)/2);
        bottom=Math.max(bottom,box.y-diagramTop+box.height);
      }
    }
    // Reflow appended nodes after source-node alignment and centering.
    for(const column of Object.keys(pathColumns)){
      let previousBottom=diagramTop-20;
      for(const node of round.nodes.filter(node=>node.column===column).sort((a,b)=>a.y-b.y)){
        const box=boxes[node.id];
        box.y=Math.max(box.y,previousBottom+20);
        previousBottom=box.y+box.height;
        bottom=Math.max(bottom,previousBottom-diagramTop);
      }
    }
    const diagramHeight=Math.max(round.height,bottom+28)+footerHeight;
    const height=pathHeaderHeight+pathColumnHeight+diagramHeight+2;
    rounds[round.id]={top,height,diagramTop,diagramHeight};
    top+=height+52;
  }
  const routes:PathRoute[]=[];
  for(const round of graphRounds){
    for(const [from,to,color] of round.edges){
      const a=boxes[from],b=boxes[to];
      const branches=round.edges.filter(([id])=>id===from);
      const index=branches.findIndex(([,id])=>id===to);
      const offset=round.nodes.find(n=>n.id===to)?.type==='finding'?(index-(branches.length-1)/2)*Math.min(32,a.height/4):0;
      const x1=a.x+a.width,y1=a.y+a.height/2+offset,x2=b.x-5,y2=b.y+b.height/2,dx=(x2-x1)*.47;
      routes.push({from:[from],to,color,arrow:true,d:`M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`});
    }
  }
  for(const edge of pathContinuations){
    const sources=continuationSources(edge),a=boxes[sources[0]],b=boxes[edge.to];
    const sourceRound=rounds[graphRounds.find(round=>round.nodes.some(n=>n.id===sources[0]))!.id];
    const x1=a.x,y1=a.y+a.height-20,x2=b.x+b.width*.6,y2=b.y-5;
    const lane=width*edge.lane,returnLane=Math.max(width*edge.returnLane,152);
    const turnY=sourceRound.top+sourceRound.height+edge.gapOffset,approachY=y2-24;
    const radius=Math.max(0,Math.min(18,(x1-lane)/2,(returnLane-x2)/2,(approachY-turnY)/2));
    let start=`M ${x1} ${y1} H ${lane+radius} Q ${lane} ${y1} ${lane} ${y1+radius}`;
    let dots:[number,number][]=[[x1,y1]];
    if(sources.length>1){
      const ports=sources.map(id=>({id,x:boxes[id].x,y:boxes[id].y+boxes[id].height-20})).sort((a,b)=>a.y-b.y);
      ports.forEach((port,index)=>{
        routes.push({from:[port.id],to:edge.to,color:'continuation',continuation:true,d:`M ${port.x} ${port.y} H ${lane}`,dots:[[port.x,port.y],[lane,port.y]]});
        if(index<ports.length-1)routes.push({from:ports.slice(0,index+1).map(p=>p.id),to:edge.to,color:'continuation',continuation:true,d:`M ${lane} ${port.y} V ${ports[index+1].y}`});
      });
      start=`M ${lane} ${ports[ports.length-1].y}`;
      dots=[];
    }
    const d=`${start} V ${turnY-radius} Q ${lane} ${turnY} ${lane-radius} ${turnY} H ${returnLane+radius} Q ${returnLane} ${turnY} ${returnLane} ${turnY+radius} V ${approachY-radius} Q ${returnLane} ${approachY} ${returnLane-radius} ${approachY} H ${x2+radius} Q ${x2} ${approachY} ${x2} ${approachY+radius} V ${y2}`;
    routes.push({from:sources,to:edge.to,color:'continuation',continuation:true,arrow:true,d,dots});
  }
  return {width,height:top-52,boxes,rounds,routes};
}
