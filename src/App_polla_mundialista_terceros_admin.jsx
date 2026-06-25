import { useState, useEffect, useMemo } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set } from 'firebase/database'

const firebaseConfig = {
  apiKey:"AIzaSyDfJrHhYfo2-qXi50dVLoAt-CNc7_ddJWA",
  authDomain:"polla-mundialista-96aa1.firebaseapp.com",
  databaseURL:"https://polla-mundialista-96aa1-default-rtdb.firebaseio.com",
  projectId:"polla-mundialista-96aa1",
  storageBucket:"polla-mundialista-96aa1.firebasestorage.app",
  messagingSenderId:"408399682887",
  appId:"1:408399682887:web:fe5c08e9723312163d4062",
}
let db=null
const DB_PATH='polla2026'
try{const a=initializeApp(firebaseConfig);db=getDatabase(a)}catch(e){}

const DEFAULT_PIN='1234'
const GROUPS=['A','B','C','D','E','F','G','H','I','J','K','L']
const COLORS=['#f0c040','#4ade80','#60a5fa','#f87171','#c084fc','#fb923c','#34d399','#a78bfa','#f472b6','#facc15','#38bdf8','#e879f9']
const PP={'Fase de Grupos':3,'Ronda de 32':5,'Octavos de Final':5,'Cuartos de Final':5,'Semifinales':7,'Tercer Puesto':7,'Gran Final':10}
const PL={'Fase de Grupos':'Grupos','Ronda de 32':'1/32','Octavos de Final':'Octavos','Cuartos de Final':'Cuartos','Semifinales':'Semis','Tercer Puesto':'3er P.','Gran Final':'Final'}
const KO_PH=['Ronda de 32','Octavos de Final','Cuartos de Final','Semifinales','Tercer Puesto','Gran Final']

const TEAMS={
  A:[['Mexico','\uD83C\uDDF2\uD83C\uDDFD'],['Corea del Sur','\uD83C\uDDF0\uD83C\uDDF7'],['Sudafrica','\uD83C\uDDFF\uD83C\uDDE6'],['Chequia','\uD83C\uDDE8\uD83C\uDDFF']],
  B:[['Canada','\uD83C\uDDE8\uD83C\uDDE6'],['Suiza','\uD83C\uDDE8\uD83C\uDDED'],['Qatar','\uD83C\uDDF6\uD83C\uDDE6'],['Bosnia','\uD83C\uDDE7\uD83C\uDDE6']],
  C:[['Brasil','\uD83C\uDDE7\uD83C\uDDF7'],['Marruecos','\uD83C\uDDF2\uD83C\uDDE6'],['Escocia','\uD83C\uDFF4'],['Haiti','\uD83C\uDDED\uD83C\uDDF9']],
  D:[['Estados Unidos','\uD83C\uDDFA\uD83C\uDDF8'],['Paraguay','\uD83C\uDDF5\uD83C\uDDFE'],['Australia','\uD83C\uDDE6\uD83C\uDDFA'],['Turquia','\uD83C\uDDF9\uD83C\uDDF7']],
  E:[['Alemania','\uD83C\uDDE9\uD83C\uDDEA'],['Curazao','\uD83C\uDDE8\uD83C\uDDFC'],['C. de Marfil','\uD83C\uDDE8\uD83C\uDDEE'],['Ecuador','\uD83C\uDDEA\uD83C\uDDE8']],
  F:[['Paises Bajos','\uD83C\uDDF3\uD83C\uDDF1'],['Japon','\uD83C\uDDEF\uD83C\uDDF5'],['Tunez','\uD83C\uDDF9\uD83C\uDDF3'],['Suecia','\uD83C\uDDF8\uD83C\uDDEA']],
  G:[['Belgica','\uD83C\uDDE7\uD83C\uDDEA'],['Egipto','\uD83C\uDDEA\uD83C\uDDEC'],['Iran','\uD83C\uDDEE\uD83C\uDDF7'],['Nueva Zelanda','\uD83C\uDDF3\uD83C\uDDFF']],
  H:[['Espana','\uD83C\uDDEA\uD83C\uDDF8'],['Cabo Verde','\uD83C\uDDE8\uD83C\uDDFB'],['Arabia Saudita','\uD83C\uDDF8\uD83C\uDDE6'],['Uruguay','\uD83C\uDDFA\uD83C\uDDFE']],
  I:[['Francia','\uD83C\uDDEB\uD83C\uDDF7'],['Senegal','\uD83C\uDDF8\uD83C\uDDF3'],['Noruega','\uD83C\uDDF3\uD83C\uDDF4'],['Irak','\uD83C\uDDEE\uD83C\uDDF6']],
  J:[['Argentina','\uD83C\uDDE6\uD83C\uDDF7'],['Argelia','\uD83C\uDDE9\uD83C\uDDFF'],['Austria','\uD83C\uDDE6\uD83C\uDDF9'],['Jordania','\uD83C\uDDEF\uD83C\uDDF4']],
  K:[['Portugal','\uD83C\uDDF5\uD83C\uDDF9'],['Colombia','\uD83C\uDDE8\uD83C\uDDF4'],['Uzbekistan','\uD83C\uDDFA\uD83C\uDDFF'],['RD Congo','\uD83C\uDDE8\uD83C\uDDE9']],
  L:[['Inglaterra','\uD83C\uDFF4'],['Croacia','\uD83C\uDDED\uD83C\uDDF7'],['Ghana','\uD83C\uDDEC\uD83C\uDDED'],['Panama','\uD83C\uDDF5\uD83C\uDDE6']],
}
function tl(f,n){return f+' '+n}

function genGrpMatches(){
  const ms=[],mdP=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]]
  GROUPS.forEach(g=>{const t=TEAMS[g];mdP.forEach((pairs,md)=>{pairs.forEach(([i,j])=>{ms.push({id:'G'+g+i+j,phase:'Fase de Grupos',group:g,matchday:md+1,home:tl(t[i][1],t[i][0]),away:tl(t[j][1],t[j][0]),allowDraw:true})})})})
  return ms
}
const GRP_MATCHES=genGrpMatches()

const R32=['M73','M74','M75','M76','M77','M78','M79','M80','M81','M82','M83','M84','M85','M86','M87','M88']
const R16=['M89','M90','M91','M92','M93','M94','M95','M96']
const QF=['M97','M98','M99','M100']
const SF=['M101','M102']
const R16F={M89:['M74','M77'],M90:['M73','M75'],M91:['M76','M78'],M92:['M79','M80'],M93:['M83','M84'],M94:['M81','M82'],M95:['M86','M88'],M96:['M85','M87']}
const QFF={M97:['M89','M90'],M98:['M93','M94'],M99:['M91','M92'],M100:['M95','M96']}
const SFF={M101:['M97','M98'],M102:['M99','M100']}
const TC={M74:['A','B','C','D','F'],M77:['C','D','F','G','H'],M79:['C','E','F','H','I'],M80:['E','H','I','J','K'],M81:['B','E','F','I','J'],M82:['A','E','H','I','J'],M85:['E','F','G','I','J'],M87:['D','E','I','J','L']}
const KO_IDS={'Ronda de 32':R32,'Octavos de Final':R16,'Cuartos de Final':QF,'Semifinales':SF,'Tercer Puesto':['M103'],'Gran Final':['M104']}

function getPhase(mid){
  if(R32.includes(mid))return'Ronda de 32'
  if(R16.includes(mid))return'Octavos de Final'
  if(QF.includes(mid))return'Cuartos de Final'
  if(SF.includes(mid))return'Semifinales'
  if(mid==='M103')return'Tercer Puesto'
  if(mid==='M104')return'Gran Final'
  return'Ronda de 32'
}

function buildStandings(picks){
  const st={}
  GROUPS.forEach(g=>{
    const pts=[0,0,0,0],wins=[0,0,0,0],draws=[0,0,0,0],pk={};
    ;[[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]].forEach(([i,j])=>{
      const r=picks['G'+g+i+j]||'';pk[i+'-'+j]=r
      if(r==='1'){pts[i]+=3;wins[i]++}else if(r==='X'){pts[i]++;pts[j]++;draws[i]++;draws[j]++}else if(r==='2'){pts[j]+=3;wins[j]++}
    })
    function h2h(a,b){const lo=Math.min(a,b),hi=Math.max(a,b),r=pk[lo+'-'+hi];if(r==='1')return a===lo?[3,0]:[0,3];if(r==='2')return a===hi?[3,0]:[0,3];if(r==='X')return[1,1];return[0,0]}
    const rank=[0,1,2,3].sort((a,b)=>{if(pts[b]!==pts[a])return pts[b]-pts[a];const[ha]=h2h(a,b);const[hb]=h2h(b,a);if(ha!==hb)return hb-ha;if(wins[b]!==wins[a])return wins[b]-wins[a];return a-b})
    const t=TEAMS[g]
    st[g]={p1:{name:t[rank[0]][0],flag:t[rank[0]][1],pts:pts[rank[0]],wins:wins[rank[0]],draws:draws[rank[0]]},p2:{name:t[rank[1]][0],flag:t[rank[1]][1],pts:pts[rank[1]],wins:wins[rank[1]],draws:draws[rank[1]]},p3:{name:t[rank[2]][0],flag:t[rank[2]][1],pts:pts[rank[2]],wins:wins[rank[2]],draws:draws[rank[2]]},p4:{name:t[rank[3]][0],flag:t[rank[3]][1],pts:pts[rank[3]],wins:wins[rank[3]],draws:draws[rank[3]]}}
  })
  return st
}

function fl(t){return t?t.flag+' '+t.name:'TBD'}

function buildR32(picks,manualThirdGroups=null){
  const s=buildStandings(picks)
  const thirds=GROUPS.map(g=>({group:g,...s[g].p3})).sort((a,b)=>b.pts-a.pts||b.wins-a.wins||b.draws-a.draws||a.group.localeCompare(b.group))
  const autoTop8=thirds.slice(0,8)
  // Admin override applies only when exactly eight group letters are selected.
  const manualGroups=Array.isArray(manualThirdGroups)?[...new Set(manualThirdGroups)].filter(g=>GROUPS.includes(g)).sort():[]
  const top8=manualGroups.length===8 ? manualGroups.map(g=>thirds.find(t=>t.group===g)).filter(Boolean) : autoTop8
  // IMPORTANT — third-place allocation policy for this polla:
  // FIFA's official allocation table must be applied from a published
  // combination-to-slot map. Until that complete table is loaded below,
  // this deterministic fallback is used ONLY for the prediction game.
  // It is stable: the same eight qualifying groups always produce the same bracket,
  // regardless of their points/wins order. It must NOT be described as FIFA official.
  const TC_KEYS=['M74','M77','M79','M80','M81','M82','M85','M87']
  const asgn={}
  const byGroup=Object.fromEntries(top8.map(t=>[t.group,t]))
  const combo=top8.map(t=>t.group).sort().join('')

  // Add FIFA's complete official table here when it is available/verified.
  // Shape: { ABCDEFGH:{M74:'A',M77:'C',...}, ... }
  const FIFA_THIRD_PLACE_MAP={}
  const official=FIFA_THIRD_PLACE_MAP[combo]

  if(official){
    TC_KEYS.forEach(slot=>{
      const group=official[slot]
      asgn[slot]=group&&byGroup[group]?fl(byGroup[group]):'TBD'
    })
  }else{
    // Deterministic bipartite assignment: candidates are always tried in group-letter
    // order, never in points order. This prevents the previous arbitrary movement
    // of a third-placed team when its points changed but the qualifying groups did not.
    function assignThirds(idx,usedGroups){
      if(idx===TC_KEYS.length) return true
      const slot=TC_KEYS[idx], cluster=TC[slot]
      const candidates=Object.keys(byGroup).filter(group=>cluster.includes(group)&&!usedGroups.has(group)).sort()
      for(const group of candidates){
        usedGroups.add(group); asgn[slot]=fl(byGroup[group])
        if(assignThirds(idx+1,usedGroups)) return true
        usedGroups.delete(group); delete asgn[slot]
      }
      return false
    }
    assignThirds(0,new Set())
    TC_KEYS.forEach(k=>{if(!asgn[k])asgn[k]='TBD'})
  }
  const g=(gr,p)=>fl(s[gr][p])
  return{M73:{h:g('A','p2'),a:g('B','p2')},M74:{h:g('E','p1'),a:asgn.M74||'TBD'},M75:{h:g('F','p1'),a:g('C','p2')},M76:{h:g('C','p1'),a:g('F','p2')},M77:{h:g('I','p1'),a:asgn.M77||'TBD'},M78:{h:g('E','p2'),a:g('I','p2')},M79:{h:g('A','p1'),a:asgn.M79||'TBD'},M80:{h:g('L','p1'),a:asgn.M80||'TBD'},M81:{h:g('D','p1'),a:asgn.M81||'TBD'},M82:{h:g('G','p1'),a:asgn.M82||'TBD'},M83:{h:g('K','p2'),a:g('L','p2')},M84:{h:g('H','p1'),a:g('J','p2')},M85:{h:g('B','p1'),a:asgn.M85||'TBD'},M86:{h:g('J','p1'),a:g('H','p2')},M87:{h:g('K','p1'),a:asgn.M87||'TBD'},M88:{h:g('D','p2'),a:g('G','p2')}}
}

function nextRound(feedMap,koPicks){const out={};Object.entries(feedMap).forEach(([id,[m1,m2]])=>{out[id]={h:koPicks[m1]||'TBD',a:koPicks[m2]||'TBD'}});return out}

function buildFinal(sfKo,sfBkt){
  const w1=sfKo['M101']||'TBD',w2=sfKo['M102']||'TBD'
  const b1=sfBkt['M101']||{h:'TBD',a:'TBD'},b2=sfBkt['M102']||{h:'TBD',a:'TBD'}
  return{M103:{h:w1==='TBD'?'TBD':(w1===b1.h?b1.a:b1.h),a:w2==='TBD'?'TBD':(w2===b2.h?b2.a:b2.h)},M104:{h:w1,a:w2}}
}

// Build full bracket from user's group picks + their KO picks
function userBracket(pid,predictions,lockedPicks){
  const pp=predictions[pid]||{},lk=lockedPicks[pid]||{},kp=pp.__k||{}
  const b32=pp.__b||{}
  if(!Object.keys(b32).length)return null
  const b16=lk['Ronda de 32']?nextRound(R16F,kp):{}
  const bqf=lk['Octavos de Final']?nextRound(QFF,kp):{}
  const bsf=lk['Cuartos de Final']?nextRound(SFF,kp):{}
  const bfin=lk['Semifinales']?buildFinal(kp,bsf):{}
  return{...b32,...b16,...bqf,...bsf,...bfin}
}

// Build official bracket from admin results
function officialBracket(results,koResults,manualThirdGroups){
  const b32=buildR32(results,manualThirdGroups)
  const b16=nextRound(R16F,koResults)
  const bqf=nextRound(QFF,koResults)
  const bsf=nextRound(SFF,koResults)
  const bfin=buildFinal(koResults,bsf)
  return{...b32,...b16,...bqf,...bsf,...bfin}
}

function calcBoard(participants,predictions,results,koResults){
  return[...participants].map(p=>{
    const pp=predictions[p.id]||{},kp=pp.__k||{}
    let pts=0,correct=0,played=0
    GRP_MATCHES.forEach(m=>{if(pp[m.id]&&results[m.id]){played++;if(pp[m.id]===results[m.id]){pts+=3;correct++}}})
    Object.entries(koResults||{}).forEach(([mid,winner])=>{const pick=kp[mid];if(pick){played++;if(pick===winner){pts+=PP[getPhase(mid)]||5;correct++}}})
    return{...p,pts,correct,played,predCount:Object.keys(pp).filter(k=>!k.startsWith('__')).length}
  }).sort((a,b)=>b.pts-a.pts||b.correct-a.correct)
}

const isTBD=s=>!s||s==='TBD'||s==='Por definir'
function sht(s){if(!s||isTBD(s))return'TBD';const p=s.trim().split(' ');return p.length>1?p[p.length-1]:p[0]}

// ── STYLES ────────────────────────────────────────────────────────────────────
const S={
  app:{background:'#07111f',minHeight:'100vh',color:'#d8eaf7',fontFamily:"'Rajdhani',system-ui,sans-serif",display:'flex',flexDirection:'column'},
  hdr:{background:'linear-gradient(135deg,#0a1628,#0e2040,#0a1628)',borderBottom:'2px solid #f0c040',padding:'13px 16px',display:'flex',alignItems:'center',gap:12,flexShrink:0},
  con:{flex:1,overflowY:'auto',padding:14,paddingBottom:84},
  tab:{position:'fixed',bottom:0,left:0,right:0,background:'#0a1628',borderTop:'1px solid #1c3352',display:'flex',zIndex:50},
  crd:{background:'#0c1a2e',border:'1px solid #1c3352',borderRadius:10,padding:14,marginBottom:12},
  cdk:{background:'#0a1528',border:'1px solid #1c3352',borderRadius:10,padding:14,marginBottom:12},
  ct:{fontSize:11,letterSpacing:2,color:'#6d9bbf',marginBottom:10,textTransform:'uppercase',fontWeight:700},
  inp:{background:'#111d30',border:'1px solid #1c3352',borderRadius:6,color:'#d8eaf7',padding:'9px 12px',fontSize:14,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,width:'100%',outline:'none',boxSizing:'border-box'},
  sel:{background:'#111d30',border:'1px solid #1c3352',borderRadius:6,color:'#d8eaf7',padding:'9px 12px',fontSize:14,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,width:'100%',outline:'none',boxSizing:'border-box'},
  btn:{background:'#f0c040',color:'#050d10',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:700,fontFamily:"'Rajdhani',sans-serif",fontSize:13,letterSpacing:1,cursor:'pointer'},
  brd:{background:'#e63946',color:'#fff',border:'none',borderRadius:6,padding:'8px 14px',fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:12,cursor:'pointer'},
  bot:{background:'transparent',color:'#4d7a9e',border:'1px solid #1c3352',borderRadius:6,padding:'8px 14px',fontFamily:"'Rajdhani',sans-serif",fontWeight:600,fontSize:12,cursor:'pointer'},
  blk:{background:'#1a1a3a',color:'#c084fc',border:'1px solid #c084fc66',borderRadius:6,padding:'10px 18px',fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:13,cursor:'pointer'},
  mc:{background:'#0c1a2e',border:'1px solid #1c3352',borderRadius:8,padding:'12px 14px',marginBottom:8},
}

// ── SHARED ────────────────────────────────────────────────────────────────────
function GrpPills({cur,onChange}){
  return <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:6,marginBottom:10,scrollbarWidth:'none'}}>
    {GROUPS.map(g=><button key={g} onClick={()=>onChange(g)} style={{width:34,height:34,borderRadius:6,border:'1px solid',flexShrink:0,borderColor:g===cur?'#4a9eff':'#1c3352',background:g===cur?'#1e3a5f':'transparent',color:g===cur?'#4a9eff':'#4d7a9e',fontSize:13,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer'}}>{g}</button>)}
  </div>
}

function PinModal({title,sub,onOK,onCancel,pin0}){
  const[pin,setPin]=useState('');const[err,setErr]=useState(false)
  const check=()=>{if(pin===pin0){setErr(false);onOK()}else{setErr(true);setPin('')}}
  return <div style={{position:'fixed',inset:0,background:'#000c',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
    <div style={{background:'#0c1a2e',border:'1px solid #1c3352',borderRadius:14,padding:28,width:'100%',maxWidth:320,textAlign:'center'}}>
      <div style={{fontSize:36,marginBottom:12}}>{'\uD83D\uDD10'}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,color:'#f0c040',marginBottom:6}}>{title}</div>
      <div style={{fontSize:13,color:'#4d7a9e',marginBottom:20,lineHeight:1.5,whiteSpace:'pre-line'}}>{sub}</div>
      <input style={{...S.inp,textAlign:'center',fontSize:22,letterSpacing:8,marginBottom:10,border:'1px solid '+(err?'#e63946':'#1c3352')}} type="password" inputMode="numeric" maxLength={8} placeholder="****" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} autoFocus/>
      {err&&<div style={{color:'#e63946',fontSize:12,marginBottom:10}}>PIN incorrecto.</div>}
      <div style={{display:'flex',gap:8,marginTop:8}}>
        {onCancel&&<button style={{...S.bot,flex:1}} onClick={onCancel}>Cancelar</button>}
        <button style={{...S.btn,flex:1}} onClick={check}>Entrar</button>
      </div>
    </div>
  </div>
}

function LockModal({label,onOK,onCancel}){
  return <div style={{position:'fixed',inset:0,background:'#000c',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
    <div style={{background:'#0c1a2e',border:'1px solid #c084fc66',borderRadius:14,padding:28,width:'100%',maxWidth:340,textAlign:'center'}}>
      <div style={{fontSize:40,marginBottom:12}}>{'\uD83D\uDD12'}</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,color:'#c084fc',marginBottom:10}}>Confirmar Pronosticos</div>
      <div style={{fontSize:13,color:'#d8eaf7',marginBottom:6,lineHeight:1.6}}>Confirmas tus picks para <b style={{color:'#f0c040'}}>{label}</b>?</div>
      <div style={{fontSize:12,color:'#e63946',marginBottom:20,lineHeight:1.6,background:'#e6394610',border:'1px solid #e6394633',borderRadius:8,padding:'10px 14px'}}>
        Esta accion es irreversible. Solo el admin puede desbloquear.
      </div>
      <div style={{display:'flex',gap:8}}>
        <button style={{...S.bot,flex:1}} onClick={onCancel}>Cancelar</button>
        <button style={{...S.blk,flex:1}} onClick={onOK}>{'\uD83D\uDD12'} Confirmar</button>
      </div>
    </div>
  </div>
}

// ── BRACKET VIEW ──────────────────────────────────────────────────────────────
// ── BRACKET CONSTANTS ─────────────────────────────────────────────────────────
const BW=136,BH=46,BSH=70,BTH=560,BCTW=160
const BSC=[35,105,175,245,315,385,455,525]
const BR16=[70,210,350,490]
const BQF=[140,420]
const BSF=280
const BXL0=0,BXL1=160,BXL2=320,BXL3=480
const BXCTR=640,BXRS=800,BXRQ=960,BXRL=1120,BXRR=1280
const BTW=BXRR+BW
const BGLD='#f0c040',BCLR='#1e3a5a',BCLR2='#f0c04055'

const BLR32=['M73','M75','M74','M77','M79','M80','M76','M78']
const BLR16=['M90','M89','M92','M91']
const BLQF=['M97','M99']
const BLSF=['M101']
const BRSF=['M102']
const BRQF=['M98','M100']
const BRR16=['M93','M94','M95','M96']
const BRR32=['M83','M84','M81','M82','M86','M88','M85','M87']

// SVG helper — draws bracket connection lines (returns array of SVG elements)
function bktLines(sc,dc,xR,xL,side,keyPfx){
  const lines=[], mx=(xR+xL)/2
  dc.forEach((dy,i)=>{
    const y1=sc[i*2],y2=sc[i*2+1]
    if(y1===undefined||y2===undefined)return
    const k=keyPfx+i
    if(side==='left'){
      lines.push(
        <line key={'h1'+k} x1={xR} y1={y1} x2={mx} y2={y1} stroke={BCLR} strokeWidth="1"/>,
        <line key={'h2'+k} x1={xR} y1={y2} x2={mx} y2={y2} stroke={BCLR} strokeWidth="1"/>,
        <line key={'v'+k}  x1={mx} y1={y1} x2={mx} y2={y2} stroke={BCLR} strokeWidth="1"/>,
        <line key={'m'+k}  x1={mx} y1={dy} x2={xL} y2={dy} stroke={BCLR} strokeWidth="1"/>,
      )
    } else {
      lines.push(
        <line key={'h1'+k} x1={xL} y1={y1} x2={mx} y2={y1} stroke={BCLR} strokeWidth="1"/>,
        <line key={'h2'+k} x1={xL} y1={y2} x2={mx} y2={y2} stroke={BCLR} strokeWidth="1"/>,
        <line key={'v'+k}  x1={mx} y1={y1} x2={mx} y2={y2} stroke={BCLR} strokeWidth="1"/>,
        <line key={'m'+k}  x1={mx} y1={dy} x2={xR} y2={dy} stroke={BCLR} strokeWidth="1"/>,
      )
    }
  })
  return lines
}

// Match card — defined at module level (NOT inside BracketView)
function BMatchCard({mid,x,y,bracket,koPicks,koResults,isLocked,readOnly,onKoPick}){
  const m=(bracket&&bracket[mid])||{h:'TBD',a:'TBD'}
  const picked=koPicks?.[mid], result=koResults?.[mid]
  const phase=getPhase(mid)
  const locked=!!(isLocked&&isLocked(phase))||!!readOnly
  const borderC=picked?BGLD+'77':result?'#3ddc8477':BCLR

  function teamRow(team,idx){
    const tbd=isTBD(team)
    const sel=!tbd&&picked===team, win=!tbd&&result===team
    const wrong=sel&&result&&!win, ok=sel&&win
    const bg=ok?'#143a14':wrong?'#3a1414':sel?'#f0c04020':'transparent'
    const tc=ok?'#3ddc84':wrong?'#e63946':sel?BGLD:tbd?'#2a4a6e':'#b0ccdd'
    return (
      <div key={idx}
        onClick={()=>{if(!locked&&!tbd&&onKoPick)onKoPick(mid,sel?null:team)}}
        style={{height:22,padding:'0 5px',display:'flex',alignItems:'center',
          background:bg,color:tc,fontSize:10,fontWeight:sel||win?700:400,
          fontFamily:"'Rajdhani',sans-serif",overflow:'hidden',textOverflow:'ellipsis',
          whiteSpace:'nowrap',cursor:!locked&&!tbd?'pointer':'default',userSelect:'none',
          borderBottom:idx===0?'1px solid #1c3352':'none'}}>
        {ok&&'✓ '}{wrong&&'✗ '}{win&&!ok&&'▶ '}{team||'TBD'}
      </div>
    )
  }

  return (
    <div style={{position:'absolute',left:x,top:y,width:BW,
      border:'1px solid '+borderC,borderRadius:4,overflow:'hidden',
      background:'#0a1827',boxShadow:'0 2px 6px #00000060',zIndex:2}}>
      {teamRow(m.h,0)}
      {teamRow(m.a,1)}
    </div>
  )
}

// Visual bracket tree (horizontally scrollable)
function BracketView({bracket,koPicks,koResults,onKoPick,isLocked,readOnly}){
  if(!bracket) return null
  const H=22, finY=BSF-BH-12, thrY=BSF+12, cX=(BCTW-BW)/2
  const bProps={bracket,koPicks,koResults,isLocked,readOnly,onKoPick}
  return (
    <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch',
      background:'#06101c',borderRadius:8,marginBottom:12,padding:'4px 0'}}>
      <div style={{position:'relative',width:BTW,height:BTH+H+8,flexShrink:0}}>

        {/* Column headers */}
        {[[BXL0,'16avos'],[BXL1,'8avos'],[BXL2,'4tos'],[BXL3,'Semis'],
          [BXRS,'Semis'],[BXRQ,'4tos'],[BXRL,'8avos'],[BXRR,'16avos']
        ].map(([x,l])=>(
          <div key={l+x} style={{position:'absolute',top:0,left:x,width:BW,
            textAlign:'center',fontSize:9,letterSpacing:1.5,color:'#2a4a6a',
            fontWeight:700,fontFamily:"'Rajdhani',sans-serif",textTransform:'uppercase'}}>{l}</div>
        ))}
        <div style={{position:'absolute',top:0,left:BXCTR,width:BCTW,textAlign:'center',
          fontSize:9,color:BGLD,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:1}}>
          FINAL {'&'} 3ro
        </div>

        {/* SVG connection lines */}
        <svg style={{position:'absolute',top:H,left:0,width:BTW,height:BTH,pointerEvents:'none'}}>
          {bktLines(BSC, BR16, BXL0+BW, BXL1, 'left',  'a')}
          {bktLines(BR16,BQF,  BXL1+BW, BXL2, 'left',  'b')}
          {bktLines(BQF, [BSF],BXL2+BW, BXL3, 'left',  'c')}
          <line x1={BXL3+BW} y1={BSF} x2={BXCTR}      y2={BSF} stroke={BCLR2} strokeWidth="1.5"/>
          {bktLines(BSC, BR16, BXRR,    BXRL+BW,'right','d')}
          {bktLines(BR16,BQF,  BXRL,    BXRQ+BW,'right','e')}
          {bktLines(BQF, [BSF],BXRQ,    BXRS+BW,'right','f')}
          <line x1={BXRS}     y1={BSF} x2={BXCTR+BCTW} y2={BSF} stroke={BCLR2} strokeWidth="1.5"/>
          <line x1={BXCTR+BCTW/2} y1={finY+BH} x2={BXCTR+BCTW/2} y2={BSF}
            stroke={BCLR2} strokeWidth="1" strokeDasharray="3,3"/>
          <line x1={BXCTR+BCTW/2} y1={BSF}     x2={BXCTR+BCTW/2} y2={thrY}
            stroke={BCLR2} strokeWidth="1" strokeDasharray="3,3"/>
        </svg>

        {/* Left match cards */}
        {BLR32.map((id,i)=><BMatchCard key={id} mid={id} x={BXL0} y={H+BSC[i] -BH/2} {...bProps}/>)}
        {BLR16.map((id,i)=><BMatchCard key={id} mid={id} x={BXL1} y={H+BR16[i]-BH/2} {...bProps}/>)}
        {BLQF.map( (id,i)=><BMatchCard key={id} mid={id} x={BXL2} y={H+BQF[i] -BH/2} {...bProps}/>)}
        {BLSF.map( (id  )=><BMatchCard key={id} mid={id} x={BXL3} y={H+BSF-BH/2}      {...bProps}/>)}

        {/* Center block */}
        <div style={{position:'absolute',top:H,left:BXCTR,width:BCTW,height:BTH}}>
          <div style={{position:'absolute',top:finY-14,width:'100%',textAlign:'center',
            fontSize:9,color:BGLD,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:1}}>
            CAMPEON
          </div>
          <BMatchCard mid="M104" x={cX} y={finY} {...bProps}/>
          <div style={{position:'absolute',top:thrY-14,width:'100%',textAlign:'center',
            fontSize:9,color:'#c084fc',fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:1}}>
            3er PUESTO
          </div>
          <BMatchCard mid="M103" x={cX} y={thrY} {...bProps}/>
        </div>

        {/* Right match cards */}
        {BRSF.map( (id  )=><BMatchCard key={id} mid={id} x={BXRS}  y={H+BSF-BH/2}      {...bProps}/>)}
        {BRQF.map( (id,i)=><BMatchCard key={id} mid={id} x={BXRQ}  y={H+BQF[i] -BH/2} {...bProps}/>)}
        {BRR16.map((id,i)=><BMatchCard key={id} mid={id} x={BXRL}  y={H+BR16[i]-BH/2} {...bProps}/>)}
        {BRR32.map((id,i)=><BMatchCard key={id} mid={id} x={BXRR}  y={H+BSC[i] -BH/2} {...bProps}/>)}
      </div>
    </div>
  )
}

// ── BOARD TAB ─────────────────────────────────────────────────────────────────
function BoardTab({board,results,koResults}){
  const done=Object.keys(results).length+Object.keys(koResults).length
  const total=GRP_MATCHES.length+32,pct=total>0?Math.round(done/total*100):0
  const mx=board[0]?.pts||1
  const medals=['\uD83E\uDD47','\uD83E\uDD48','\uD83E\uDD49']
  return <div>
    <div style={{...S.cdk,marginBottom:12}}>
      <div style={S.ct}>Sistema de Puntuacion</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {[['Grupos','3pts','#4d7a9e'],['1/32-Octavos-Cuartos','5pts','#4a9eff'],['Semifinales','7pts','#c084fc'],['Final','10pts','#f0c040']].map(([ph,p,c])=>(
          <div key={ph} style={{padding:'4px 10px',borderRadius:6,background:c+'18',border:'1px solid '+c+'33',fontSize:11,color:c}}><b>{p}</b> - {ph}</div>
        ))}
      </div>
    </div>
    <div style={S.crd}>
      <div style={S.ct}>Clasificacion General</div>
      {!board.length&&<div style={{textAlign:'center',color:'#4d7a9e',padding:'30px 0',fontSize:13}}>Aun no hay participantes. Ve a Admin.</div>}
      {board.map((p,i)=>(
        <div key={p.id} style={{padding:'11px 0',borderBottom:'1px solid #1c3352'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:5}}>
            <div style={{fontSize:18,width:32,textAlign:'center',fontWeight:700,color:['#f0c040','#c0c0c0','#cd7f32'][i]||'#4d7a9e'}}>{medals[i]||i+1}</div>
            <div style={{width:11,height:11,borderRadius:'50%',background:p.color,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:16,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:i===0?'#f0c040':'#d8eaf7'}}>{p.name}</div>
              <div style={{fontSize:10,color:'#4d7a9e'}}>{p.correct}/{p.played} aciertos - {p.predCount}/{GRP_MATCHES.length} grupos</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:26,fontWeight:800,lineHeight:1,color:i===0?'#f0c040':'#d8eaf7'}}>{p.pts}</div>
              <div style={{fontSize:9,letterSpacing:1,color:'#4d7a9e'}}>PTS</div>
            </div>
          </div>
          <div style={{paddingLeft:42}}>
            <div style={{background:'#1c3352',borderRadius:3,height:4,overflow:'hidden'}}>
              <div style={{height:'100%',background:p.color,width:(mx>0?Math.round(p.pts/mx*100):0)+'%',transition:'width .5s'}}/>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div style={S.cdk}>
      <div style={S.ct}>Progreso del Torneo</div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{flex:1}}>
          <div style={{background:'#1c3352',borderRadius:4,height:8,overflow:'hidden'}}>
            <div style={{height:'100%',background:'#f0c040',borderRadius:4,width:pct+'%',transition:'width .5s'}}/>
          </div>
          <div style={{fontSize:11,color:'#4d7a9e',marginTop:5}}>{done} de {total} partidos con resultado</div>
        </div>
        <div style={{fontSize:24,fontWeight:800,color:'#f0c040'}}>{pct}%</div>
      </div>
    </div>
  </div>
}

// ── MATCHES TAB ───────────────────────────────────────────────────────────────
function MatchesTab({results,koResults,predictions,participants}){
  const[phase,setPhase]=useState('Fase de Grupos');const[group,setGroup]=useState('A')
  const isGrp=phase==='Fase de Grupos'
  const grpMs=isGrp?GRP_MATCHES.filter(m=>m.group===group):[]
  return <div>
    <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8,marginBottom:10,scrollbarWidth:'none'}}>
      {['Fase de Grupos',...KO_PH].map(ph=>(
        <button key={ph} onClick={()=>setPhase(ph)} style={{whiteSpace:'nowrap',padding:'5px 11px',borderRadius:20,border:'1px solid',borderColor:ph===phase?'#f0c040':'#1c3352',background:ph===phase?'#f0c040':'transparent',color:ph===phase?'#050d10':'#4d7a9e',fontSize:11,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center'}}>
          <span>{PL[ph]||ph}</span><span style={{fontSize:9,opacity:.8}}>{PP[ph]}pts</span>
        </button>
      ))}
    </div>
    {isGrp&&<GrpPills cur={group} onChange={setGroup}/>}
    {isGrp&&grpMs.map(m=>{
      const result=results[m.id],counts={'1':0,'X':0,'2':0}
      participants.forEach(p=>{const pr=(predictions[p.id]||{})[m.id];if(pr)counts[pr]++})
      const tot=participants.length
      return <div key={m.id} style={S.mc}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700}}>JORNADA {m.matchday} <span style={{color:'#4d7a9e',fontWeight:800}}>3pts</span></span>
          {result&&<span style={{padding:'2px 9px',borderRadius:4,fontSize:11,fontWeight:700,background:'#1a3a1a',color:'#3ddc84'}}>{result==='X'?'EMPATE':sht(result==='1'?m.home:m.away)}</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.home}</span>
          <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 6px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
          <span style={{flex:1,fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.away}</span>
        </div>
        {tot>0&&<div style={{display:'flex',gap:4,marginTop:10}}>
          {['1','X','2'].map(opt=>{const c=counts[opt],pc=tot>0?Math.round(c/tot*100):0;return <div key={opt} style={{flex:1,textAlign:'center'}}>
            <div style={{background:'#1c3352',borderRadius:2,height:3,overflow:'hidden',marginBottom:3}}><div style={{height:'100%',background:'#4a9eff',width:pc+'%'}}/></div>
            <div style={{fontSize:9,color:'#4d7a9e'}}>{opt}: {c} ({pc}%)</div>
          </div>})}
        </div>}
      </div>
    })}
    {!isGrp&&<div>
      <div style={{...S.cdk,marginBottom:10,border:'1px solid #f0c04033'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:22}}>{'\uD83C\uDFC6'}</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:'#f0c040'}}>Bracket Oficial del Mundial</div>
            <div style={{fontSize:11,color:'#4d7a9e'}}>Resultados reales confirmados por el admin. Verde = equipo que avanza. Comparalo con tu bracket personal.</div>
          </div>
        </div>
      </div>
      <BracketView
        bracket={officialBracket(results,koResults,manualThirdGroups)}
        koPicks={koResults}
        koResults={koResults}
        onKoPick={null}
        isLocked={()=>true}
        readOnly={true}
      />
    </div>}
  </div>
}

// ── PICKS TAB ─────────────────────────────────────────────────────────────────
function PicksTab({predictions,participants,lockedPicks,onPick,onLockSection,onOpenBracket}){
  const[pid,setPid]=useState(participants[0]?.id||null)
  const[group,setGroup]=useState('A')
  const[onlyUndone,setOnly]=useState(false)
  const[lockModal,setLockModal]=useState(null)
  const selP=participants.find(p=>p.id===pid)||participants[0]
  const pp=pid?(predictions[pid]||{}):{};const pCount=Object.keys(pp).filter(k=>!k.startsWith('__')).length
  const secMs=GRP_MATCHES.filter(m=>m.group===group)
  const curSec='GRP-'+group
  const isLkd=!!(pid&&lockedPicks[pid]&&lockedPicks[pid][curSec])
  const secPks=secMs.filter(m=>pp[m.id]).length
  const allLkd=pid&&GROUPS.every(g=>lockedPicks[pid]&&lockedPicks[pid]['GRP-'+g])
  const filtered=GRP_MATCHES.filter(m=>{if(m.group!==group)return false;if(onlyUndone&&pp[m.id])return false;return true})
  if(!participants.length) return <div style={{textAlign:'center',color:'#4d7a9e',padding:50,fontSize:13}}>Primero anade participantes en Admin</div>
  return <div>
    {lockModal&&<LockModal label={'Grupo '+group} onOK={()=>{onLockSection(pid,lockModal);setLockModal(null)}} onCancel={()=>setLockModal(null)}/>}
    <div style={S.crd}>
      <div style={S.ct}>Quien pronostica?</div>
      <select style={S.sel} value={pid||''} onChange={e=>setPid(e.target.value)}>
        {participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {selP&&<>
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
          <div style={{width:10,height:10,borderRadius:'50%',background:selP.color}}/>
          <div style={{flex:1,fontSize:12,color:'#4d7a9e'}}>{pCount}/{GRP_MATCHES.length} picks de fase de grupos</div>
          <div style={{fontSize:13,fontWeight:700,color:'#f0c040'}}>{Math.round(pCount/GRP_MATCHES.length*100)}%</div>
        </div>
        <div style={{background:'#1c3352',borderRadius:3,height:5,overflow:'hidden',marginTop:6}}>
          <div style={{height:'100%',background:selP.color,width:Math.round(pCount/GRP_MATCHES.length*100)+'%',transition:'width .4s'}}/>
        </div>
      </>}
    </div>
    {allLkd&&<button style={{...S.blk,width:'100%',marginBottom:12,fontSize:14,background:'#1a2a0a',color:'#f0c040',border:'1px solid #f0c04066'}} onClick={()=>onOpenBracket(pid)}>
      {'\uD83C\uDFC6'} Ver mi Bracket Eliminatorio
    </button>}
    <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:6,marginBottom:10,scrollbarWidth:'none'}}>
      {GROUPS.map(g=>{
        const lkd=!!(pid&&lockedPicks[pid]&&lockedPicks[pid]['GRP-'+g])
        return <button key={g} onClick={()=>setGroup(g)} style={{width:36,height:36,borderRadius:6,border:'1px solid',flexShrink:0,borderColor:g===group?'#4a9eff':'#1c3352',background:g===group?'#1e3a5f':'transparent',color:g===group?'#4a9eff':'#4d7a9e',fontSize:11,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer',position:'relative'}}>
          {g}{lkd&&<span style={{position:'absolute',top:-3,right:-3,fontSize:8}}>{'\uD83D\uDD12'}</span>}
        </button>
      })}
    </div>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,padding:'8px 12px',background:'#0c1a2e',borderRadius:8,border:'1px solid '+(isLkd?'#c084fc44':'#1c3352')}}>
      <div style={{fontSize:12,color:'#4d7a9e'}}>{secPks}/6 picks - Grupo {group}{isLkd&&<span style={{marginLeft:8,color:'#c084fc',fontWeight:700}}>{'\uD83D\uDD12'} BLOQUEADO</span>}</div>
      {!isLkd&&<label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:'#4d7a9e'}}><input type="checkbox" checked={onlyUndone} onChange={e=>setOnly(e.target.checked)}/> Sin pick</label>}
    </div>
    {isLkd&&<div style={{...S.cdk,border:'1px solid #c084fc44',textAlign:'center',padding:'14px',marginBottom:12}}>
      <div style={{fontSize:13,fontWeight:700,color:'#c084fc',marginBottom:4}}>{'\uD83D\uDD12'} Grupo {group} Bloqueado</div>
      <div style={{fontSize:12,color:'#4d7a9e'}}>Solo el admin puede desbloquear.</div>
    </div>}
    {filtered.map(m=>{
      const pred=pp[m.id],opts=['1','X','2'],labels={'1':m.home,'X':'Empate','2':m.away},locked=isLkd
      return <div key={m.id} style={{...S.mc,borderColor:locked?'#c084fc22':pred?'#f0c04033':'#1c3352'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700}}>JORNADA {m.matchday} <span style={{fontWeight:800}}>3pts</span></span>
          {pred&&<span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:locked?'#c084fc22':'#f0c04022',color:locked?'#c084fc':'#f0c040',border:'1px solid '+(locked?'#c084fc44':'#f0c04044')}}>{locked?'\uD83D\uDD12 ':''}{pred==='X'?'EMPATE':sht(labels[pred])}</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
          <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700}}>{m.home}</span>
          <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 6px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
          <span style={{flex:1,fontSize:14,fontWeight:700}}>{m.away}</span>
        </div>
        {!locked&&<div style={{display:'flex',gap:6}}>
          {opts.map(opt=><button key={opt} onClick={()=>onPick(pid,m.id,pred===opt?null:opt)} style={{flex:1,padding:'8px 4px',borderRadius:7,border:'1px solid',borderColor:pred===opt?'#f0c040':'#1c3352',background:pred===opt?'#f0c040':'#111d30',color:pred===opt?'#050d10':'#4d7a9e',fontFamily:"'Rajdhani',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
            <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
            <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{opt==='X'?'Empate':sht(labels[opt])}</span>
          </button>)}
        </div>}
        {locked&&<div style={{display:'flex',gap:6}}>
          {opts.map(opt=><div key={opt} style={{flex:1,padding:'8px 4px',borderRadius:7,border:'1px solid',borderColor:pred===opt?'#c084fc':'#1c3352',background:pred===opt?'#1a1a3a':'#0a0f1a',color:pred===opt?'#c084fc':'#2a4a6e',display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
            <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
            <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{opt==='X'?'Empate':sht(labels[opt])}</span>
          </div>)}
        </div>}
      </div>
    })}
    {pid&&!isLkd&&secPks>0&&<div style={{padding:'4px 0 16px'}}>
      <button style={{...S.blk,width:'100%',fontSize:14}} onClick={()=>setLockModal(curSec)}>
        {'\uD83D\uDD12'} Confirmar picks - Grupo {group}
      </button>
    </div>}
  </div>
}

// ── BRACKET TAB ───────────────────────────────────────────────────────────────
function BracketTab({pid,participants,predictions,lockedPicks,koResults,onKoPick,onLockKoSection,onBack}){
  const[lockModal,setLockModal]=useState(null)
  const[viewMode,setViewMode]=useState('bracket')
  const selP=participants.find(p=>p.id===pid)
  const pp=predictions[pid]||{},kp=pp.__k||{},lk=lockedPicks[pid]||{}
  const bracket=userBracket(pid,predictions,lockedPicks)||{}
  const allGrpLkd=GROUPS.every(g=>lk['GRP-'+g])
  if(!allGrpLkd) return <div>
    <div style={{...S.cdk,textAlign:'center',padding:'40px 20px'}}>
      <div style={{fontSize:32,marginBottom:12}}>{'\uD83C\uDFC6'}</div>
      <div style={{fontSize:14,color:'#4d7a9e'}}>Debes bloquear todos los grupos antes de ver tu bracket eliminatorio.</div>
    </div>
    <button style={{...S.bot,width:'100%'}} onClick={onBack}>{'\u2190'} Volver a Grupos</button>
  </div>
  const rounds=[
    {phase:'Ronda de 32',     ids:R32,pts:5, lock:'Ronda de 32',     need:''},
    {phase:'Octavos de Final',ids:R16,pts:5, lock:'Octavos de Final',need:'Ronda de 32'},
    {phase:'Cuartos de Final',ids:QF, pts:5, lock:'Cuartos de Final',need:'Octavos de Final'},
    {phase:'Semifinales',     ids:SF, pts:7, lock:'Semifinales',     need:'Cuartos de Final'},
    {phase:'Tercer Puesto',   ids:['M103'],pts:7, lock:'Tercer Puesto',need:'Semifinales'},
    {phase:'Gran Final',      ids:['M104'],pts:10,lock:'Gran Final',   need:'Semifinales'},
  ]
  return <div>
    {lockModal&&<LockModal label={lockModal} onOK={()=>{onLockKoSection(pid,lockModal);setLockModal(null)}} onCancel={()=>setLockModal(null)}/>}
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
      <button style={{...S.bot,padding:'6px 10px',fontSize:12}} onClick={onBack}>{'\u2190'}</button>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:15,fontWeight:700,color:selP?.color||'#f0c040',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selP?.name}</div>
        <div style={{fontSize:10,color:'#4d7a9e'}}>Bracket Eliminatorio Personal</div>
      </div>
      <div style={{display:'flex',gap:3,flexShrink:0}}>
        {[['bracket','Bracket'],['list','Lista']].map(([m,lbl])=>(
          <button key={m} onClick={()=>setViewMode(m)} style={{padding:'4px 10px',borderRadius:5,border:'1px solid',fontSize:10,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer',borderColor:viewMode===m?'#f0c040':'#1c3352',background:viewMode===m?'#f0c04015':'transparent',color:viewMode===m?'#f0c040':'#4d7a9e'}}>{lbl}</button>
        ))}
      </div>
    </div>
    {viewMode==='bracket'&&<BracketView bracket={bracket} koPicks={kp} koResults={koResults} onKoPick={(mid,team)=>onKoPick(pid,mid,team)} isLocked={phase=>!!lk[phase]}/>}
    {viewMode==='bracket'&&rounds.map(({phase,ids,lock,need})=>{
      if(need&&!lk[need])return null
      const rLkd=!!lk[lock],rPks=ids.filter(id=>kp[id]).length,allPkd=rPks===ids.length
      if(!allPkd||rLkd)return null
      return <div key={phase} style={{padding:'0 0 8px'}}>
        <button style={{...S.blk,width:'100%'}} onClick={()=>setLockModal(lock)}>{'\uD83D\uDD12'} Confirmar {PL[phase]||phase}</button>
      </div>
    })}
    {viewMode==='list'&&rounds.map(({phase,ids,pts,lock,need})=>{
      if(need&&!lk[need])return null
      const rLkd=!!lk[lock],rPks=ids.filter(id=>kp[id]).length,allPkd=rPks===ids.length
      const ptC=pts===10?'#f0c040':pts===7?'#c084fc':'#4a9eff'
      return <div key={phase}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,marginTop:4}}>
          <div style={{flex:1,fontSize:11,color:ptC,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>{phase}</div>
          <div style={{fontSize:10,background:ptC+'22',color:ptC,border:'1px solid '+ptC+'44',padding:'2px 8px',borderRadius:4,fontWeight:700}}>{pts}pts</div>
          <div style={{fontSize:10,color:'#4d7a9e'}}>{rPks}/{ids.length}</div>
          {rLkd&&<span style={{fontSize:12,color:'#c084fc'}}>{'\uD83D\uDD12'}</span>}
        </div>
        {ids.map(mid=>{
          const m=bracket[mid]||{h:'TBD',a:'TBD'},picked=kp[mid],result=koResults[mid]
          const ok=picked&&result&&picked===result,wrong=picked&&result&&picked!==result
          return <div key={mid} style={{...S.mc,marginBottom:8,borderColor:rLkd?'#c084fc22':picked?'#f0c04033':'#1c3352',opacity:(isTBD(m.h)&&isTBD(m.a))?.5:1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:10,color:'#4d7a9e',fontWeight:700}}>{mid}</span>
              {result&&<span style={{padding:'2px 9px',borderRadius:4,fontSize:11,fontWeight:700,background:ok?'#1a3a1a':'#3a1a1a',color:ok?'#3ddc84':'#e63946'}}>{ok?'\u2713':'\u2717'} {result}</span>}
              {!result&&picked&&<span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:rLkd?'#c084fc22':'#f0c04022',color:rLkd?'#c084fc':'#f0c040'}}>{rLkd?'\uD83D\uDD12 ':''}{picked}</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:rLkd?0:10}}>
              <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.h}</span>
              <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 6px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
              <span style={{flex:1,fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.a}</span>
            </div>
            {!rLkd&&!isTBD(m.h)&&!isTBD(m.a)&&<div style={{display:'flex',gap:6}}>
              {[m.h,m.a].map(team=><button key={team} onClick={()=>onKoPick(pid,mid,picked===team?null:team)} style={{flex:1,padding:'9px 6px',borderRadius:7,border:'1px solid',borderColor:picked===team?'#f0c040':'#1c3352',background:picked===team?'#f0c040':'#111d30',color:picked===team?'#050d10':'#4d7a9e',fontFamily:"'Rajdhani',sans-serif",fontSize:11,fontWeight:700,cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{team}</button>)}
            </div>}
          </div>
        })}
        {!rLkd&&allPkd&&<div style={{padding:'0 0 12px'}}>
          <button style={{...S.blk,width:'100%'}} onClick={()=>setLockModal(lock)}>{'\uD83D\uDD12'} Confirmar {PL[phase]||phase}</button>
        </div>}
        <div style={{height:1,background:'#1c3352',margin:'8px 0'}}/>
      </div>
    })}
  </div>
}

// ── ADMIN TAB ─────────────────────────────────────────────────────────────────
function AdminTab({participants,results,koResults,predictions,lockedPicks,adminPin,manualThirdGroups,updParticipants,updResults,updKoResults,updLockedPicks,updAdminPin,updManualThirdGroups,onReset,adminUnlocked,onNeedPin}){
  const[sec,setSec]=useState('participants')
  const[newName,setNewName]=useState('')
  const[resGroup,setResGroup]=useState('A')
  const[koPh,setKoPh]=useState('Ronda de 32')
  const standings=buildStandings(results)
  const thirds=GROUPS.map(g=>({group:g,...standings[g].p3})).sort((a,b)=>b.pts-a.pts||b.wins-a.wins||b.draws-a.draws||a.group.localeCompare(b.group))
  const selectedThirds=Array.isArray(manualThirdGroups)?manualThirdGroups:[]
  function toggleThird(g){const next=selectedThirds.includes(g)?selectedThirds.filter(x=>x!==g):[...selectedThirds,g];if(next.length<=8)updManualThirdGroups(next.sort())}
  function resetThirds(){updManualThirdGroups([])}
  const[oldPin,setOldPin]=useState('');const[newPin,setNewPin]=useState('');const[cPin,setCPin]=useState('');const[pinMsg,setPinMsg]=useState(null)
  function reqAdmin(cb){if(!adminUnlocked)onNeedPin(cb);else cb()}
  function addP(){if(!newName.trim())return;const np={id:Date.now().toString(),name:newName.trim(),color:COLORS[participants.length%COLORS.length]};updParticipants([...participants,np]);setNewName('')}
  function setRes(mid,val){const nr={...results};if(nr[mid]===val)delete nr[mid];else nr[mid]=val;updResults(nr)}
  function setKoRes(mid,val){const nr={...koResults};if(nr[mid]===val)delete nr[mid];else nr[mid]=val;updKoResults(nr)}
  function unlockSec(pid,sk){const nl={...lockedPicks};if(nl[pid])delete nl[pid][sk];updLockedPicks(nl)}
  function changePin(){
    if(oldPin!==adminPin){setPinMsg({err:true,msg:'PIN anterior incorrecto.'});return}
    if(newPin.length<4){setPinMsg({err:true,msg:'Minimo 4 digitos.'});return}
    if(newPin!==cPin){setPinMsg({err:true,msg:'Los PINs no coinciden.'});return}
    updAdminPin(newPin);setOldPin('');setNewPin('');setCPin('');setPinMsg({err:false,msg:'PIN cambiado.'});setTimeout(()=>setPinMsg(null),3000)
  }
  const resMs=GRP_MATCHES.filter(m=>m.group===resGroup)
  const koIds=KO_IDS[koPh]||[]
  return <div>
    <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
      {[['participants','\uD83D\uDC65 Jugadores'],['results','\uD83D\uDCCA Fase Grupos'],['thirds','\uD83C\uDFC6 Mejores 3ros'],['ko','\uD83C\uDFC6 Eliminatorias'],['settings','\u2699\uFE0F Config']].map(([id,label])=>(
        <button key={id} onClick={()=>{if((id==='results'||id==='thirds'||id==='ko'||id==='settings')&&!adminUnlocked){onNeedPin(()=>setSec(id));return}setSec(id)}}
          style={{flex:1,padding:'8px 4px',borderRadius:8,border:'1px solid',minWidth:70,borderColor:sec===id?'#f0c040':'#1c3352',background:sec===id?'#1a2a0a':'transparent',color:sec===id?'#f0c040':'#4d7a9e',fontFamily:"'Rajdhani',sans-serif",fontSize:10,fontWeight:700,cursor:'pointer'}}>
          {label}{(id==='results'||id==='thirds'||id==='ko'||id==='settings')&&!adminUnlocked?' \uD83D\uDD10':''}
        </button>
      ))}
    </div>
    {sec==='participants'&&<>
      <div style={{...S.cdk,border:'1px solid #f0c04033',marginBottom:12}}>
        <div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.7}}>{'\u26A0\uFE0F'} <b style={{color:'#f0c040'}}>Solo el admin puede agregar o quitar participantes.</b> Se requiere PIN.</div>
      </div>
      <div style={S.crd}>
        <div style={S.ct}>Anadir Participante</div>
        <div style={{display:'flex',gap:8}}>
          <input style={{...S.inp,flex:1}} placeholder="Nombre del jugador" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&reqAdmin(addP)}/>
          <button style={S.btn} onClick={()=>reqAdmin(addP)}>+</button>
        </div>
      </div>
      <div style={S.crd}>
        <div style={S.ct}>Participantes ({participants.length})</div>
        {!participants.length&&<div style={{textAlign:'center',color:'#4d7a9e',padding:'20px 0',fontSize:13}}>No hay participantes aun</div>}
        {participants.map(p=>{
          const ls=Object.keys(lockedPicks[p.id]||{}).filter(k=>lockedPicks[p.id][k])
          return <div key={p.id} style={{padding:'10px 0',borderBottom:'1px solid #1c3352'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:12,height:12,borderRadius:'50%',background:p.color,flexShrink:0}}/>
              <span style={{flex:1,fontSize:15,fontWeight:600}}>{p.name}</span>
              <span style={{fontSize:11,color:'#4d7a9e'}}>{Object.keys(predictions[p.id]||{}).filter(k=>!k.startsWith('__')).length} picks</span>
              {ls.length>0&&<span style={{fontSize:11,color:'#c084fc'}}>{'\uD83D\uDD12'}{ls.length}</span>}
              <button style={S.brd} onClick={()=>reqAdmin(()=>updParticipants(participants.filter(x=>x.id!==p.id)))}>X</button>
            </div>
            {ls.length>0&&adminUnlocked&&<div style={{paddingLeft:22,marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              {ls.map(sk=><button key={sk} onClick={()=>unlockSec(p.id,sk)} style={{fontSize:10,padding:'3px 8px',borderRadius:4,border:'1px solid #c084fc44',background:'transparent',color:'#c084fc',cursor:'pointer',fontFamily:"'Rajdhani',sans-serif"}}>{'\uD83D\uDD13'} {sk}</button>)}
            </div>}
          </div>
        })}
      </div>
      <div style={{textAlign:'center'}}>
        <button style={{background:'transparent',color:'#e63946',border:'1px solid #e63946',borderRadius:6,padding:'8px 14px',fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,cursor:'pointer'}} onClick={()=>reqAdmin(onReset)}>
          Reiniciar todos los datos
        </button>
      </div>
    </>}
    {sec==='results'&&adminUnlocked&&<>
      <div style={{...S.cdk,border:'1px solid #3ddc8433'}}>
        <div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.8}}><b style={{color:'#3ddc84'}}>{'\u2705'} Admin activo</b><br/><b style={{color:'#d8eaf7'}}>1</b>=local &nbsp;{'\u00B7'}&nbsp; <b style={{color:'#d8eaf7'}}>X</b>=empate &nbsp;{'\u00B7'}&nbsp; <b style={{color:'#d8eaf7'}}>2</b>=visitante</div>
      </div>
      <GrpPills cur={resGroup} onChange={setResGroup}/>
      <div style={{fontSize:11,color:'#4d7a9e',marginBottom:10,textAlign:'right'}}>{resMs.filter(m=>results[m.id]).length}/6 registrados</div>
      {resMs.map(m=>{
        const result=results[m.id],opts=['1','X','2'],labels={'1':m.home,'X':'Empate','2':m.away}
        return <div key={m.id} style={{...S.mc,borderColor:result?'#3ddc8433':'#1c3352'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <span style={{fontSize:10,color:'#4d7a9e',fontWeight:700}}>J{m.matchday}</span>
            {result&&<span style={{padding:'2px 9px',borderRadius:4,fontSize:11,fontWeight:700,background:'#1a3a1a',color:'#3ddc84'}}>{'\u2713'} {result==='X'?'EMPATE':sht(labels[result])}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
            <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700}}>{m.home}</span>
            <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 5px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
            <span style={{flex:1,fontSize:14,fontWeight:700}}>{m.away}</span>
          </div>
          <div style={{display:'flex',gap:6}}>
            {opts.map(opt=><button key={opt} onClick={()=>setRes(m.id,opt)} style={{flex:1,padding:'9px 4px',borderRadius:7,border:'1px solid',borderColor:result===opt?'#3ddc84':'#1c3352',background:result===opt?'#1a3a1a':'#111d30',color:result===opt?'#3ddc84':'#4d7a9e',fontFamily:"'Rajdhani',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
              <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
              <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{opt==='X'?'Empate':sht(labels[opt])}</span>
            </button>)}
          </div>
        </div>
      })}
    </>}
    {sec==='thirds'&&adminUnlocked&&<>
      <div style={{...S.cdk,border:'1px solid #f0c04055',marginBottom:12}}><div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.7}}><b style={{color:'#f0c040'}}>Mejores terceros oficiales</b><br/>Selecciona exactamente 8 grupos para sobrescribir el cálculo simplificado. Esto actualiza únicamente el bracket oficial. Si no seleccionas 8, la app usa el cálculo automático de la polla.</div></div>
      <div style={{...S.crd,marginBottom:12}}><div style={S.ct}>Seleccionados: {selectedThirds.length}/8</div><div style={{display:'flex',gap:8,marginBottom:10}}><button style={S.brd} onClick={resetThirds}>Volver a automático</button>{selectedThirds.length===8&&<span style={{fontSize:11,color:'#3ddc84',alignSelf:'center'}}>✓ Override activo</span>}</div>
      {thirds.map(t=>{const on=selectedThirds.includes(t.group);return <button key={t.group} onClick={()=>toggleThird(t.group)} style={{width:'100%',textAlign:'left',marginBottom:6,padding:'9px',borderRadius:7,border:'1px solid',borderColor:on?'#f0c040':'#1c3352',background:on?'#f0c04018':'#111d30',color:on?'#f0c040':'#d8eaf7',cursor:'pointer',fontFamily:"'Rajdhani',sans-serif",fontSize:12}}><b>Grupo {t.group}</b> · {t.flag} {t.name}<span style={{float:'right',color:'#4d7a9e'}}>{t.pts} pts · {t.wins} G · {t.draws} E {on?' ✓':''}</span></button>})}</div>
    </>}
    {sec==='ko'&&adminUnlocked&&<>
      <div style={{...S.cdk,border:'1px solid #3ddc8433'}}>
        <div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.7}}><b style={{color:'#3ddc84'}}>{'\u2705'} Admin activo</b><br/>Registra el equipo que avanza en cada partido. Escribe el nombre exactamente como aparece en los brackets.</div>
      </div>
      <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8,marginBottom:12,scrollbarWidth:'none'}}>
        {KO_PH.map(ph=><button key={ph} onClick={()=>setKoPh(ph)} style={{whiteSpace:'nowrap',padding:'5px 11px',borderRadius:20,border:'1px solid',borderColor:ph===koPh?'#3ddc84':'#1c3352',background:ph===koPh?'#1a3a1a':'transparent',color:ph===koPh?'#3ddc84':'#4d7a9e',fontSize:11,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer'}}>{PL[ph]||ph}</button>)}
      </div>
      {koIds.map(mid=>{
        const winner=koResults[mid]||''
        return <div key={mid} style={{...S.mc,borderColor:winner?'#3ddc8433':'#1c3352',marginBottom:8}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
            <span style={{fontSize:11,color:'#4d7a9e',fontWeight:700}}>{mid}</span>
            {winner&&<span style={{fontSize:11,color:'#3ddc84',fontWeight:700}}>{'\u2713'} {winner}</span>}
          </div>
          <input style={S.inp} placeholder={'Equipo ganador de '+mid} value={winner} onChange={e=>{const nr={...koResults};if(e.target.value)nr[mid]=e.target.value.trim();else delete nr[mid];updKoResults(nr)}}/>
        </div>
      })}
    </>}
    {sec==='settings'&&adminUnlocked&&<>
      <div style={S.crd}>
        <div style={S.ct}>Cambiar PIN</div>
        <div style={{fontSize:12,color:'#4d7a9e',marginBottom:12,lineHeight:1.6}}>Para cambiar el PIN debes ingresar el PIN actual.<br/><b style={{color:'#f0c040'}}>PIN por defecto: {DEFAULT_PIN}</b></div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,marginBottom:4,fontWeight:700}}>PIN ACTUAL</div>
          <input style={S.inp} type="password" inputMode="numeric" placeholder="PIN actual" value={oldPin} onChange={e=>setOldPin(e.target.value)}/>
        </div>
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,marginBottom:4,fontWeight:700}}>NUEVO PIN (min. 4)</div>
          <input style={S.inp} type="password" inputMode="numeric" placeholder="Nuevo PIN" value={newPin} onChange={e=>setNewPin(e.target.value)}/>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,marginBottom:4,fontWeight:700}}>CONFIRMAR PIN</div>
          <input style={S.inp} type="password" inputMode="numeric" placeholder="Repite" value={cPin} onChange={e=>setCPin(e.target.value)}/>
        </div>
        {pinMsg&&<div style={{fontSize:12,color:pinMsg.err?'#e63946':'#3ddc84',marginBottom:10,fontWeight:600}}>{pinMsg.msg}</div>}
        <button style={{...S.btn,width:'100%'}} onClick={changePin}>Guardar PIN</button>
      </div>
      <div style={S.cdk}>
        <div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.9}}>
          <b style={{color:'#d8eaf7'}}>Reglas de seguridad:</b><br/>
          - Agregar/quitar participantes: requiere PIN<br/>
          - Ver/editar resultados: requiere PIN<br/>
          - Cambiar PIN: requiere el PIN anterior<br/>
          - Reiniciar datos: requiere PIN<br/>
          - Desbloquear picks: solo si estas autenticado
        </div>
      </div>
    </>}
  </div>
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const[loading,setLoading]=useState(true)
  const[fatalError,setFatalError]=useState(null)
  const[participants,setP]=useState([])
  const[results,setR]=useState({})
  const[koResults,setKoR]=useState({})
  const[predictions,setPreds]=useState({})
  const[lockedPicks,setLocked]=useState({})
  const[adminPin,setAdminPin]=useState(DEFAULT_PIN)
  const[manualThirdGroups,setManualThirdGroups]=useState([])
  const[tab,setTab]=useState('picks')
  const[adminUnlocked,setAdminU]=useState(false)
  const[showPin,setShowPin]=useState(false)
  const[pendingCb,setPendingCb]=useState(null)
  const[bracketPid,setBracketPid]=useState(null)

  const board=useMemo(()=>calcBoard(participants,predictions,results,koResults),[participants,predictions,results,koResults])

  useEffect(()=>{
    if(!db){setFatalError('Firebase no inicializado. Verifica el firebaseConfig en App.jsx.');setLoading(false);return}
    const toArr=v=>!v?[]:Array.isArray(v)?v:Object.values(v)
    try{
      const unsub=onValue(ref(db,DB_PATH),snap=>{
        try{const d=snap.val();if(d){if(d.participants)setP(toArr(d.participants));if(d.results)setR(d.results||{});if(d.koResults)setKoR(d.koResults||{});if(d.predictions)setPreds(d.predictions||{});if(d.lockedPicks)setLocked(d.lockedPicks||{});if(d.adminPin)setAdminPin(d.adminPin);if(d.manualThirdGroups)setManualThirdGroups(d.manualThirdGroups||[])}}catch(e){}
        setLoading(false)
      },err=>{setFatalError('Error Firebase: '+err.message);setLoading(false)})
      return()=>unsub()
    }catch(e){setFatalError('Error Firebase: '+e.message);setLoading(false)}
  },[])

  function save(d){if(db)set(ref(db,DB_PATH),d).catch(e=>console.error(e))}
  function bun(o={}){return{participants,results,koResults,predictions,lockedPicks,adminPin,manualThirdGroups,...o}}
  function updP(v){setP(v);save(bun({participants:v}))}
  function updR(v){setR(v);save(bun({results:v}))}
  function updKoR(v){setKoR(v);save(bun({koResults:v}))}
  function updPr(v){setPreds(v);save(bun({predictions:v}))}
  function updLk(v){setLocked(v);save(bun({lockedPicks:v}))}
  function updPin(v){setAdminPin(v);save(bun({adminPin:v}))}
  function updManualThirdGroups(v){setManualThirdGroups(v);save(bun({manualThirdGroups:v}))}

  function handlePick(pid,mid,val){
    const lk=lockedPicks[pid]||{},g=mid[1]
    if(lk['GRP-'+g])return
    const pp={...(predictions[pid]||{})};if(val===null)delete pp[mid];else pp[mid]=val
    updPr({...predictions,[pid]:pp})
  }
  function handleKoPick(pid,mid,team){
    const lk=lockedPicks[pid]||{},phase=getPhase(mid)
    if(lk[phase])return
    const pp={...(predictions[pid]||{})},kp={...(pp.__k||{})}
    if(team===null)delete kp[mid];else kp[mid]=team
    pp.__k=kp;updPr({...predictions,[pid]:pp})
  }
  function handleLock(pid,sk){updLk({...lockedPicks,[pid]:{...(lockedPicks[pid]||{}),[sk]:true}})}
  function openBracket(pid){
    const pp=predictions[pid]||{}
    const lk=lockedPicks[pid]||{}
    // Regenerate the R32 bracket whenever it's safe to do so (R32 not locked yet for this user).
    // This guarantees the bracket always reflects the latest group standings/tiebreak logic,
    // instead of relying on a possibly-stale cached version (e.g. from before a bug fix).
    // Once 'Ronda de 32' is locked, we stop regenerating to avoid invalidating downstream picks.
    const r32Locked = !!lk['Ronda de 32']
    const needsRegen = !r32Locked
    if(needsRegen){
      try{
        const b=buildR32(pp)
        const hasTBD=Object.values(b).some(m=>isTBD(m.h)||isTBD(m.a))
        if(hasTBD) console.warn('Bracket regen produced TBD slots for', pid, b)
        const newPp={...pp,__b:b}
        updPr({...predictions,[pid]:newPp})
      }catch(e){
        console.error('Error generating bracket for', pid, e)
      }
    }
    setBracketPid(pid);setTab('bracket')
  }
  function handleNeedPin(cb){setPendingCb(()=>cb);setShowPin(true)}
  function handleReset(){
    setP([]);setR({});setKoR({});setPreds({});setLocked({});setAdminPin(DEFAULT_PIN);setManualThirdGroups([])
    save({participants:[],results:{},koResults:{},predictions:{},lockedPicks:{},adminPin:DEFAULT_PIN,manualThirdGroups:[]})
  }

  if(fatalError) return(
    <div style={{background:'#07111f',minHeight:'100vh',padding:30,fontFamily:'sans-serif'}}>
      <div style={{background:'#1a0a0a',border:'2px solid #e63946',borderRadius:12,padding:24,maxWidth:500,margin:'40px auto'}}>
        <div style={{fontSize:40,textAlign:'center',marginBottom:12}}>{'\u26A0\uFE0F'}</div>
        <div style={{color:'#f0c040',fontSize:20,fontWeight:'bold',marginBottom:12,textAlign:'center'}}>Error de Configuracion</div>
        <div style={{color:'#d8eaf7',fontSize:14,lineHeight:1.8}}>{fatalError}</div>
      </div>
    </div>
  )
  if(loading) return(
    <div style={{...S.app,alignItems:'center',justifyContent:'center',fontSize:18,color:'#f0c040'}}>{'\u26BD'} Cargando...</div>
  )

  const tabs=[
    {id:'board',   icon:'\uD83C\uDFC6',label:'TABLA'},
    {id:'matches', icon:'\u26BD',       label:'PARTIDOS'},
    {id:'picks',   icon:'\uD83C\uDFAF', label:'PICKS'},
    {id:'admin',   icon:'\u2699\uFE0F', label:'ADMIN'},
  ]

  return(
    <div style={S.app}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap\');*{box-sizing:border-box}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:#07111f}::-webkit-scrollbar-thumb{background:#1c3352;border-radius:2px}button:active{transform:scale(.97)}input[type=checkbox]{accent-color:#f0c040}'}</style>
      {showPin&&<PinModal title="ACCESO ADMIN" sub={'PIN por defecto: '+DEFAULT_PIN} pin0={adminPin} onOK={()=>{setAdminU(true);setShowPin(false);if(pendingCb){pendingCb();setPendingCb(null)}}} onCancel={()=>{setShowPin(false);setPendingCb(null)}}/>}
      <div style={S.hdr}>
        <div style={{fontSize:32}}>{'\u26BD'}</div>
        <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:3,color:'#f0c040',lineHeight:1}}>POLLA MUNDIALISTA</div>
          <div style={{fontSize:10,letterSpacing:2,color:'#4d7a9e',marginTop:2}}>FIFA WORLD CUP 2026</div>
        </div>
        <div style={{marginLeft:'auto',textAlign:'right'}}>
          <div style={{fontSize:20,fontWeight:700,lineHeight:1}}>{Object.keys(results).length+Object.keys(koResults).length}<span style={{fontSize:12,color:'#4d7a9e'}}>/{GRP_MATCHES.length+32}</span></div>
          <div style={{fontSize:9,letterSpacing:1,color:'#4d7a9e'}}>JUGADOS</div>
        </div>
      </div>
      <div style={S.con}>
        {tab==='board'  &&<BoardTab board={board} results={results} koResults={koResults}/>}
        {tab==='matches'&&<MatchesTab results={results} koResults={koResults} predictions={predictions} participants={participants}/>}
        {tab==='picks'&&<PicksTab predictions={predictions} participants={participants} lockedPicks={lockedPicks} onPick={handlePick} onLockSection={handleLock} onOpenBracket={openBracket}/>}
        {tab==='bracket'&&bracketPid&&<BracketTab pid={bracketPid} participants={participants} predictions={predictions} lockedPicks={lockedPicks} koResults={koResults} onKoPick={handleKoPick} onLockKoSection={handleLock} onBack={()=>setTab('picks')}/>}
        {tab==='admin'  &&<AdminTab participants={participants} results={results} koResults={koResults} predictions={predictions} lockedPicks={lockedPicks} adminPin={adminPin} manualThirdGroups={manualThirdGroups} updParticipants={updP} updResults={updR} updKoResults={updKoR} updLockedPicks={updLk} updAdminPin={updPin} updManualThirdGroups={updManualThirdGroups} onReset={handleReset} adminUnlocked={adminUnlocked} onNeedPin={handleNeedPin}/>}
      </div>
      <div style={S.tab}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'10px 4px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:2,border:'none',borderTop:'2px solid '+(tab===t.id||(t.id==='picks'&&tab==='bracket')?'#f0c040':'transparent'),background:'transparent',color:tab===t.id||(t.id==='picks'&&tab==='bracket')?'#f0c040':'#4d7a9e',cursor:'pointer',transition:'color .15s'}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
