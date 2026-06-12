import { useState, useEffect, useMemo } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set } from 'firebase/database'

const firebaseConfig = {
  apiKey:            "AIzaSyDfJrHhYfo2-qXi50dVLoAt-CNc7_ddJWA",
  authDomain:        "polla-mundialista-96aa1.firebaseapp.com",
  databaseURL:       "https://polla-mundialista-96aa1-default-rtdb.firebaseio.com",
  projectId:         "polla-mundialista-96aa1",
  storageBucket:     "polla-mundialista-96aa1.firebasestorage.app",
  messagingSenderId: "408399682887",
  appId:             "1:408399682887:web:fe5c08e9723312163d4062",
}
let db = null
const DB_PATH = 'polla2026'
try { const a = initializeApp(firebaseConfig); db = getDatabase(a) } catch(e) {}

const DEFAULT_PIN = '1234'
const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const COLORS  = ['#f0c040','#4ade80','#60a5fa','#f87171','#c084fc','#fb923c','#34d399','#a78bfa','#f472b6','#facc15','#38bdf8','#e879f9']
const PHASE_POINTS = {'Fase de Grupos':3,'Ronda de 32':5,'Octavos de Final':5,'Cuartos de Final':5,'Semifinales':7,'Tercer Puesto':7,'Gran Final':10}
const PHASE_LABELS = {'Fase de Grupos':'Grupos','Ronda de 32':'1/32','Octavos de Final':'Octavos','Cuartos de Final':'Cuartos','Semifinales':'Semis','Tercer Puesto':'3er P.','Gran Final':'Final'}
const KO_PHASES = ['Ronda de 32','Octavos de Final','Cuartos de Final','Semifinales','Tercer Puesto','Gran Final']
const KO_KEYS  = {'Ronda de 32':'R32','Octavos de Final':'R16','Cuartos de Final':'QF','Semifinales':'SF','Tercer Puesto':'3RD','Gran Final':'FIN'}

// Teams with flag emoji as JS unicode escapes (safe, no hidden chars)
const TEAMS = {
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
function tl(f,n){ return f+' '+n }

function genGroupMatches(){
  const ms=[], mdP=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]]
  GROUPS.forEach(g=>{ const t=TEAMS[g]; mdP.forEach((pairs,md)=>{ pairs.forEach(([i,j])=>{ ms.push({id:'G'+g+i+j,phase:'Fase de Grupos',group:g,matchday:md+1,home:tl(t[i][1],t[i][0]),away:tl(t[j][1],t[j][0]),allowDraw:true}) }) }) })
  return ms
}
const GROUP_MATCHES = genGroupMatches()

// Official FIFA 2026 Round of 32 structure
const R32_IDS = ['M73','M74','M75','M76','M77','M78','M79','M80','M81','M82','M83','M84','M85','M86','M87','M88']
const R16_IDS = ['M89','M90','M91','M92','M93','M94','M95','M96']
const QF_IDS  = ['M97','M98','M99','M100']
const SF_IDS  = ['M101','M102']

const R16_FEEDS = {M89:['M74','M77'],M90:['M73','M75'],M91:['M76','M78'],M92:['M79','M80'],M93:['M83','M84'],M94:['M81','M82'],M95:['M86','M88'],M96:['M85','M87']}
const QF_FEEDS  = {M97:['M89','M90'],M98:['M93','M94'],M99:['M91','M92'],M100:['M95','M96']}
const SF_FEEDS  = {M101:['M97','M98'],M102:['M99','M100']}

const THIRD_CLUSTERS = {M74:['A','B','C','D','F'],M77:['C','D','F','G','H'],M79:['C','E','F','H','I'],M80:['E','H','I','J','K'],M81:['B','E','F','I','J'],M82:['A','E','H','I','J'],M85:['E','F','G','I','J'],M87:['D','E','I','J','L']}

const KO_ROUND_IDS = {'Ronda de 32':R32_IDS,'Octavos de Final':R16_IDS,'Cuartos de Final':QF_IDS,'Semifinales':SF_IDS,'Tercer Puesto':['M103'],'Gran Final':['M104']}

function getKOPhase(mid){
  if(R32_IDS.includes(mid)) return 'Ronda de 32'
  if(R16_IDS.includes(mid)) return 'Octavos de Final'
  if(QF_IDS.includes(mid))  return 'Cuartos de Final'
  if(SF_IDS.includes(mid))  return 'Semifinales'
  if(mid==='M103') return 'Tercer Puesto'
  if(mid==='M104') return 'Gran Final'
  return 'Ronda de 32'
}

function calcGroupStandings(pid, predictions){
  const pp=predictions[pid]||{}, standings={}
  GROUPS.forEach(g=>{
    const pts=[0,0,0,0], wins=[0,0,0,0], draws=[0,0,0,0], picks={}
    const pairs=[[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]]
    pairs.forEach(([i,j])=>{
      const pick=pp['G'+g+i+j]||''; picks[i+'-'+j]=pick
      if(pick==='1'){pts[i]+=3;wins[i]++} else if(pick==='X'){pts[i]+=1;pts[j]+=1;draws[i]++;draws[j]++} else if(pick==='2'){pts[j]+=3;wins[j]++}
    })
    function h2h(a,b){ const lo=Math.min(a,b),hi=Math.max(a,b),r=picks[lo+'-'+hi]; if(r==='1')return a===lo?[3,0]:[0,3]; if(r==='2')return a===hi?[3,0]:[0,3]; if(r==='X')return[1,1]; return[0,0] }
    const rank=[0,1,2,3].sort((a,b)=>{ if(pts[b]!==pts[a])return pts[b]-pts[a]; const[ha]=h2h(a,b);const[hb]=h2h(b,a); if(ha!==hb)return hb-ha; if(wins[b]!==wins[a])return wins[b]-wins[a]; return a-b })
    const t=TEAMS[g]
    standings[g]={
      p1:{name:t[rank[0]][0],flag:t[rank[0]][1],pts:pts[rank[0]],wins:wins[rank[0]],draws:draws[rank[0]]},
      p2:{name:t[rank[1]][0],flag:t[rank[1]][1],pts:pts[rank[1]],wins:wins[rank[1]],draws:draws[rank[1]]},
      p3:{name:t[rank[2]][0],flag:t[rank[2]][1],pts:pts[rank[2]],wins:wins[rank[2]],draws:draws[rank[2]]},
      p4:{name:t[rank[3]][0],flag:t[rank[3]][1],pts:pts[rank[3]],wins:wins[rank[3]],draws:draws[rank[3]]},
    }
  })
  return standings
}

function fl(t){ return t?t.flag+' '+t.name:'TBD' }

function generateR32(pid, predictions){
  const s=calcGroupStandings(pid,predictions)
  const thirds=GROUPS.map(g=>({group:g,...s[g].p3})).sort((a,b)=>b.pts-a.pts||b.wins-a.wins||b.draws-a.draws||a.group.localeCompare(b.group))
  const top8=thirds.slice(0,8), used=new Set()
  const slotOrder=Object.entries(THIRD_CLUSTERS).map(([slot,cl])=>({slot,cl,cnt:top8.filter(t=>cl.includes(t.group)).length})).sort((a,b)=>a.cnt-b.cnt)
  const assigned={}
  slotOrder.forEach(({slot,cl})=>{ const c=top8.find(t=>cl.includes(t.group)&&!used.has(t.group)); if(c){assigned[slot]=fl(c);used.add(c.group)}else assigned[slot]='TBD' })
  const g=(grp,pos)=>fl(s[grp][pos])
  return {
    M73:{h:g('A','p2'),a:g('B','p2')},M74:{h:g('E','p1'),a:assigned.M74||'TBD'},
    M75:{h:g('F','p1'),a:g('C','p2')},M76:{h:g('C','p1'),a:g('F','p2')},
    M77:{h:g('I','p1'),a:assigned.M77||'TBD'},M78:{h:g('E','p2'),a:g('I','p2')},
    M79:{h:g('A','p1'),a:assigned.M79||'TBD'},M80:{h:g('L','p1'),a:assigned.M80||'TBD'},
    M81:{h:g('D','p1'),a:assigned.M81||'TBD'},M82:{h:g('G','p1'),a:assigned.M82||'TBD'},
    M83:{h:g('K','p2'),a:g('L','p2')},M84:{h:g('H','p1'),a:g('J','p2')},
    M85:{h:g('B','p1'),a:assigned.M85||'TBD'},M86:{h:g('J','p1'),a:g('H','p2')},
    M87:{h:g('K','p1'),a:assigned.M87||'TBD'},M88:{h:g('D','p2'),a:g('G','p2')},
  }
}

function generateNextRound(feedMap,prevKo){ const out={}; Object.entries(feedMap).forEach(([mId,[m1,m2]])=>{ out[mId]={h:prevKo[m1]||'TBD',a:prevKo[m2]||'TBD'} }); return out }

function generateFinal(sfKo,sfBracket){
  const w1=sfKo['M101']||'TBD',w2=sfKo['M102']||'TBD'
  const b1=sfBracket['M101']||{h:'TBD',a:'TBD'},b2=sfBracket['M102']||{h:'TBD',a:'TBD'}
  const l1=w1==='TBD'?'TBD':(w1===b1.h?b1.a:b1.h)
  const l2=w2==='TBD'?'TBD':(w2===b2.h?b2.a:b2.h)
  return {M103:{h:l1,a:l2},M104:{h:w1,a:w2}}
}

function getFullBracket(pid,predictions,lockedPicks){
  const pp=predictions[pid]||{},lk=lockedPicks[pid]||{},kp=pp.__k||{}
  const b32=pp.__b||{}
  if(!Object.keys(b32).length) return null
  const b16  = lk['Ronda de 32']       ? generateNextRound(R16_FEEDS,kp) : {}
  const bqf  = lk['Octavos de Final']  ? generateNextRound(QF_FEEDS,kp)  : {}
  const bsf  = lk['Cuartos de Final']  ? generateNextRound(SF_FEEDS,kp)  : {}
  const bfin = lk['Semifinales']       ? generateFinal(kp,bsf)           : {}
  return {...b32,...b16,...bqf,...bsf,...bfin}
}

function calcBoard(participants,predictions,results,koResults){
  return [...participants].map(p=>{
    const pp=predictions[p.id]||{},kp=pp.__k||{}
    let pts=0,correct=0,played=0
    GROUP_MATCHES.forEach(m=>{ if(pp[m.id]&&results[m.id]){played++;if(pp[m.id]===results[m.id]){pts+=3;correct++}} })
    Object.entries(koResults||{}).forEach(([mid,winner])=>{ const pick=kp[mid]; if(pick){played++;if(pick===winner){pts+=PHASE_POINTS[getKOPhase(mid)]||5;correct++}} })
    return{...p,pts,correct,played,predCount:Object.keys(pp).filter(k=>!k.startsWith('__')).length}
  }).sort((a,b)=>b.pts-a.pts||b.correct-a.correct)
}

const isTBD=s=>!s||s==='TBD'
function shortTeam(s){ if(!s||s==='TBD')return 'TBD'; const p=s.trim().split(' '); return p.length>1?p[p.length-1]:p[0] }

// ── STYLES ────────────────────────────────────────────────────────────────────
const S={
  app:    {background:'#07111f',minHeight:'100vh',color:'#d8eaf7',fontFamily:"'Rajdhani',system-ui,sans-serif",display:'flex',flexDirection:'column'},
  header: {background:'linear-gradient(135deg,#0a1628,#0e2040,#0a1628)',borderBottom:'2px solid #f0c040',padding:'13px 16px',display:'flex',alignItems:'center',gap:12,flexShrink:0},
  content:{flex:1,overflowY:'auto',padding:14,paddingBottom:84},
  tabbar: {position:'fixed',bottom:0,left:0,right:0,background:'#0a1628',borderTop:'1px solid #1c3352',display:'flex',zIndex:50},
  card:   {background:'#0c1a2e',border:'1px solid #1c3352',borderRadius:10,padding:14,marginBottom:12},
  cardD:  {background:'#0a1528',border:'1px solid #1c3352',borderRadius:10,padding:14,marginBottom:12},
  ct:     {fontSize:11,letterSpacing:2,color:'#6d9bbf',marginBottom:10,textTransform:'uppercase',fontWeight:700},
  input:  {background:'#111d30',border:'1px solid #1c3352',borderRadius:6,color:'#d8eaf7',padding:'9px 12px',fontSize:14,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,width:'100%',outline:'none',boxSizing:'border-box'},
  select: {background:'#111d30',border:'1px solid #1c3352',borderRadius:6,color:'#d8eaf7',padding:'9px 12px',fontSize:14,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,width:'100%',outline:'none',boxSizing:'border-box'},
  btn:    {background:'#f0c040',color:'#050d10',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:700,fontFamily:"'Rajdhani',sans-serif",fontSize:13,letterSpacing:1,cursor:'pointer'},
  btnRed: {background:'#e63946',color:'#fff',border:'none',borderRadius:6,padding:'8px 14px',fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:12,cursor:'pointer'},
  btnOut: {background:'transparent',color:'#4d7a9e',border:'1px solid #1c3352',borderRadius:6,padding:'8px 14px',fontFamily:"'Rajdhani',sans-serif",fontWeight:600,fontSize:12,cursor:'pointer'},
  btnLock:{background:'#1a1a3a',color:'#c084fc',border:'1px solid #c084fc66',borderRadius:6,padding:'10px 18px',fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:13,cursor:'pointer'},
  mc:     {background:'#0c1a2e',border:'1px solid #1c3352',borderRadius:8,padding:'12px 14px',marginBottom:8},
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function GroupPills({current,onChange}){
  return(
    <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:6,marginBottom:10,scrollbarWidth:'none'}}>
      {GROUPS.map(g=>(
        <button key={g} onClick={()=>onChange(g)} style={{width:34,height:34,borderRadius:6,border:'1px solid',flexShrink:0,borderColor:g===current?'#4a9eff':'#1c3352',background:g===current?'#1e3a5f':'transparent',color:g===current?'#4a9eff':'#4d7a9e',fontSize:13,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer'}}>{g}</button>
      ))}
    </div>
  )
}

function PinModal({title,subtitle,onSuccess,onCancel,storedPin}){
  const[pin,setPin]=useState('');const[err,setErr]=useState(false)
  function check(){if(pin===storedPin){setErr(false);onSuccess()}else{setErr(true);setPin('')}}
  return(
    <div style={{position:'fixed',inset:0,background:'#000000cc',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
      <div style={{background:'#0c1a2e',border:'1px solid #1c3352',borderRadius:14,padding:28,width:'100%',maxWidth:320,textAlign:'center'}}>
        <div style={{fontSize:36,marginBottom:12}}>{'\uD83D\uDD10'}</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,color:'#f0c040',marginBottom:6}}>{title}</div>
        <div style={{fontSize:13,color:'#4d7a9e',marginBottom:20,lineHeight:1.5,whiteSpace:'pre-line'}}>{subtitle}</div>
        <input style={{...S.input,textAlign:'center',fontSize:22,letterSpacing:8,marginBottom:10,border:'1px solid '+(err?'#e63946':'#1c3352')}} type="password" inputMode="numeric" maxLength={8} placeholder="****" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} autoFocus/>
        {err&&<div style={{color:'#e63946',fontSize:12,marginBottom:10}}>PIN incorrecto.</div>}
        <div style={{display:'flex',gap:8,marginTop:8}}>
          {onCancel&&<button style={{...S.btnOut,flex:1}} onClick={onCancel}>Cancelar</button>}
          <button style={{...S.btn,flex:1}} onClick={check}>Entrar</button>
        </div>
      </div>
    </div>
  )
}

function LockModal({sectionLabel,onConfirm,onCancel}){
  return(
    <div style={{position:'fixed',inset:0,background:'#000000cc',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
      <div style={{background:'#0c1a2e',border:'1px solid #c084fc66',borderRadius:14,padding:28,width:'100%',maxWidth:340,textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>{'\uD83D\uDD12'}</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,color:'#c084fc',marginBottom:10}}>Confirmar Pronosticos</div>
        <div style={{fontSize:13,color:'#d8eaf7',marginBottom:6,lineHeight:1.6}}>Confirmas tus picks para <b style={{color:'#f0c040'}}>{sectionLabel}</b>?</div>
        <div style={{fontSize:12,color:'#e63946',marginBottom:20,lineHeight:1.6,background:'#e6394610',border:'1px solid #e6394633',borderRadius:8,padding:'10px 14px'}}>
          Esta accion es irreversible. Solo el admin puede desbloquear.
        </div>
        <div style={{display:'flex',gap:8}}>
          <button style={{...S.btnOut,flex:1}} onClick={onCancel}>Cancelar</button>
          <button style={{...S.btnLock,flex:1}} onClick={onConfirm}>{'\uD83D\uDD12'} Confirmar</button>
        </div>
      </div>
    </div>
  )
}

// ── BRACKET VIEW ──────────────────────────────────────────────────────────────
// Visual bracket tree (horizontally scrollable)
const BV={MW:136,MH:46,SH:70,TH:560}
const BV_SC=[35,105,175,245,315,385,455,525]
const BV_R16=[70,210,350,490]
const BV_QF=[140,420]
const BV_SF=280
const BV_CW=160 // center block width
const BV_COL=160 // column width (match+gap)
// X positions (left edge)
const BV_XLR32=0,BV_XLR16=160,BV_XLQF=320,BV_XLSF=480
const BV_XCTR=640
const BV_XRSF=BV_XCTR+BV_CW,BV_XRQF=BV_XRSF+160,BV_XRRL16=BV_XRSF+320,BV_XRRL32=BV_XRSF+480
const BV_TW=BV_XRRL32+BV.MW

// Left bracket columns (top to bottom)
const BV_LR32=['M73','M75','M74','M77','M79','M80','M76','M78']
const BV_LR16=['M90','M89','M92','M91']
const BV_LQF=['M97','M99']
const BV_LSF=['M101']
const BV_RSF=['M102']
const BV_RQF=['M98','M100']
const BV_RR16=['M93','M94','M95','M96']
const BV_RR32=['M83','M84','M81','M82','M86','M88','M85','M87']

function BracketView({bracket,koPicks,koResults,onKoPick,isLocked}){
  const GLD='#f0c040',PRP='#c084fc',LC='#1e3a5a'

  function BCard({mid,x,y}){
    const m=bracket?.[mid]||{h:'TBD',a:'TBD'}
    const picked=koPicks?.[mid],result=koResults?.[mid]
    const phase=getKOPhase(mid),locked=isLocked?.(phase)||false
    const w=BV.MW
    function Row({team,idx}){
      const tbd=isTBD(team),sel=!tbd&&picked===team,win=!tbd&&result===team
      const wrong=sel&&result&&!win,ok=sel&&win
      const bg=ok?'#143a14':wrong?'#3a1414':sel?'#f0c04020':'transparent'
      const tc=ok?'#3ddc84':wrong?'#e63946':sel?GLD:tbd?'#2a4a6e':'#b0ccdd'
      return(
        <div onClick={()=>{if(!locked&&!tbd&&onKoPick)onKoPick(mid,sel?null:team)}}
          style={{height:22,padding:'0 5px',display:'flex',alignItems:'center',background:bg,color:tc,
            fontSize:10,fontWeight:sel?700:400,fontFamily:"'Rajdhani',sans-serif",
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
            cursor:!locked&&!tbd?'pointer':'default',userSelect:'none',
            borderBottom:idx===0?'1px solid #1c3352':'none'}}>
          {ok&&'\u2713 '}{wrong&&'\u2717 '}{team||'TBD'}
        </div>
      )
    }
    return(
      <div style={{position:'absolute',left:x,top:y,width:w,
        border:'1px solid '+(picked?GLD+'77':LC),borderRadius:4,
        overflow:'hidden',background:'#0a1827',boxShadow:'0 2px 6px #00000060',zIndex:2}}>
        <Row team={m.h} idx={0}/><Row team={m.a} idx={1}/>
      </div>
    )
  }

  const CLR='#1e3a5a',CLR2='#f0c04055'
  function LConn({sc,dc,xr,xl,k}){
    const mx=(xr+xl)/2
    return(<>{dc.map((dy,i)=>{const y1=sc[i*2],y2=sc[i*2+1];return(<g key={k+i}>
      <line x1={xr} y1={y1} x2={mx} y2={y1} stroke={CLR} strokeWidth="1"/>
      <line x1={xr} y1={y2} x2={mx} y2={y2} stroke={CLR} strokeWidth="1"/>
      <line x1={mx} y1={y1} x2={mx} y2={y2} stroke={CLR} strokeWidth="1"/>
      <line x1={mx} y1={dy} x2={xl} y2={dy} stroke={CLR} strokeWidth="1"/>
    </g>)})}></>)
  }
  function RConn({sc,dc,xl,xr,k}){
    const mx=(xl+xr)/2
    return(<>{dc.map((dy,i)=>{const y1=sc[i*2],y2=sc[i*2+1];return(<g key={k+i}>
      <line x1={xl} y1={y1} x2={mx} y2={y1} stroke={CLR} strokeWidth="1"/>
      <line x1={xl} y1={y2} x2={mx} y2={y2} stroke={CLR} strokeWidth="1"/>
      <line x1={mx} y1={y1} x2={mx} y2={y2} stroke={CLR} strokeWidth="1"/>
      <line x1={mx} y1={dy} x2={xr} y2={dy} stroke={CLR} strokeWidth="1"/>
    </g>)})}></>)
  }

  const H=22,SF=BV_SF,finY=SF-BV.MH-12,thrY=SF+12
  const ctrX=BV_XCTR+(BV_CW-BV.MW)/2

  return(
    <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch',background:'#06101c',borderRadius:8,marginBottom:12,padding:'4px 0'}}>
      <div style={{position:'relative',width:BV_TW,height:BV.TH+H+8,flexShrink:0}}>
        {/* Column headers */}
        {[[BV_XLR32,'16avos'],[BV_XLR16,'8avos'],[BV_XLQF,'4tos'],[BV_XLSF,'Semis'],
          [BV_XRSF,'Semis'],[BV_XRQF,'4tos'],[BV_XRRL16,'8avos'],[BV_XRRL32,'16avos']
        ].map(([x,l])=>(
          <div key={l+x} style={{position:'absolute',top:0,left:x,width:BV.MW,textAlign:'center',
            fontSize:9,letterSpacing:1.5,color:'#2a4a6a',fontWeight:700,
            fontFamily:"'Rajdhani',sans-serif",textTransform:'uppercase'}}>{l}</div>
        ))}
        <div style={{position:'absolute',top:0,left:BV_XCTR,width:BV_CW,textAlign:'center',
          fontSize:9,letterSpacing:1.5,color:GLD,fontWeight:700,fontFamily:"'Rajdhani',sans-serif"}}>
          FINAL {'&'} 3ro
        </div>

        {/* SVG connection lines */}
        <svg style={{position:'absolute',top:H,left:0,width:BV_TW,height:BV.TH,pointerEvents:'none'}}>
          {/* Left side */}
          <LConn sc={BV_SC}  dc={BV_R16} xr={BV_XLR32+BV.MW} xl={BV_XLR16}        k="a"/>
          <LConn sc={BV_R16} dc={BV_QF}  xr={BV_XLR16+BV.MW} xl={BV_XLQF}         k="b"/>
          <LConn sc={BV_QF}  dc={[SF]}   xr={BV_XLQF+BV.MW}  xl={BV_XLSF}         k="c"/>
          <line x1={BV_XLSF+BV.MW} y1={SF} x2={BV_XCTR} y2={SF} stroke={CLR2} strokeWidth="1.5"/>
          {/* Right side */}
          <RConn sc={BV_SC}  dc={BV_R16} xl={BV_XRRL32}       xr={BV_XRRL16+BV.MW} k="d"/>
          <RConn sc={BV_R16} dc={BV_QF}  xl={BV_XRRL16}       xr={BV_XRQF+BV.MW}   k="e"/>
          <RConn sc={BV_QF}  dc={[SF]}   xl={BV_XRQF}         xr={BV_XRSF+BV.MW}   k="f"/>
          <line x1={BV_XRSF} y1={SF} x2={BV_XCTR+BV_CW} y2={SF} stroke={CLR2} strokeWidth="1.5"/>
          {/* Center dashes */}
          <line x1={BV_XCTR+BV_CW/2} y1={finY+BV.MH} x2={BV_XCTR+BV_CW/2} y2={SF} stroke={CLR2} strokeWidth="1" strokeDasharray="3,3"/>
          <line x1={BV_XCTR+BV_CW/2} y1={SF} x2={BV_XCTR+BV_CW/2} y2={thrY} stroke={CLR2} strokeWidth="1" strokeDasharray="3,3"/>
        </svg>

        {/* Left match cards */}
        {BV_LR32.map((id,i)=><BCard key={id} mid={id} x={BV_XLR32} y={H+BV_SC[i] -BV.MH/2}/>)}
        {BV_LR16.map((id,i)=><BCard key={id} mid={id} x={BV_XLR16} y={H+BV_R16[i]-BV.MH/2}/>)}
        {BV_LQF.map( (id,i)=><BCard key={id} mid={id} x={BV_XLQF}  y={H+BV_QF[i] -BV.MH/2}/>)}
        {BV_LSF.map( (id  )=><BCard key={id} mid={id} x={BV_XLSF}  y={H+SF-BV.MH/2}/>)}

        {/* Center */}
        <div style={{position:'absolute',top:H,left:BV_XCTR,width:BV_CW,height:BV.TH}}>
          <div style={{position:'absolute',top:finY-14,width:'100%',textAlign:'center',fontSize:9,color:GLD,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:1}}>CAMPEON</div>
          <BCard mid="M104" x={ctrX-BV_XCTR} y={finY}/>
          <div style={{position:'absolute',top:thrY-14,width:'100%',textAlign:'center',fontSize:9,color:PRP,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",letterSpacing:1}}>3er PUESTO</div>
          <BCard mid="M103" x={ctrX-BV_XCTR} y={thrY}/>
        </div>

        {/* Right match cards */}
        {BV_RSF.map( (id  )=><BCard key={id} mid={id} x={BV_XRSF}   y={H+SF-BV.MH/2}/>)}
        {BV_RQF.map( (id,i)=><BCard key={id} mid={id} x={BV_XRQF}   y={H+BV_QF[i] -BV.MH/2}/>)}
        {BV_RR16.map((id,i)=><BCard key={id} mid={id} x={BV_XRRL16} y={H+BV_R16[i]-BV.MH/2}/>)}
        {BV_RR32.map((id,i)=><BCard key={id} mid={id} x={BV_XRRL32} y={H+BV_SC[i] -BV.MH/2}/>)}
      </div>
    </div>
  )
}

// ── BOARD TAB ─────────────────────────────────────────────────────────────────
function BoardTab({board,results,koResults}){
  const grpDone=Object.keys(results).length,koDone=Object.keys(koResults).length
  const total=GROUP_MATCHES.length+32,pct=total>0?Math.round((grpDone+koDone)/total*100):0
  const maxPts=board[0]?.pts||1
  const medals=['\uD83E\uDD47','\uD83E\uDD48','\uD83E\uDD49']
  return(
    <div>
      <div style={{...S.cardD,marginBottom:12}}>
        <div style={S.ct}>Sistema de Puntuacion</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {[['Grupos','3pts','#4d7a9e'],['1/32 - Octavos - Cuartos','5pts','#4a9eff'],['Semifinales','7pts','#c084fc'],['Final','10pts','#f0c040']].map(([ph,p,c])=>(
            <div key={ph} style={{padding:'4px 10px',borderRadius:6,background:c+'18',border:'1px solid '+c+'33',fontSize:11,color:c}}><b>{p}</b> - {ph}</div>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={S.ct}>Clasificacion General</div>
        {!board.length&&<div style={{textAlign:'center',color:'#4d7a9e',padding:'30px 0',fontSize:13}}>Aun no hay participantes. Ve a Admin.</div>}
        {board.map((p,i)=>(
          <div key={p.id} style={{padding:'11px 0',borderBottom:'1px solid #1c3352'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:5}}>
              <div style={{fontSize:18,width:32,textAlign:'center',fontWeight:700,color:['#f0c040','#c0c0c0','#cd7f32'][i]||'#4d7a9e'}}>{medals[i]||i+1}</div>
              <div style={{width:11,height:11,borderRadius:'50%',background:p.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:16,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:i===0?'#f0c040':'#d8eaf7'}}>{p.name}</div>
                <div style={{fontSize:10,color:'#4d7a9e'}}>{p.correct}/{p.played} aciertos - {p.predCount}/{GROUP_MATCHES.length} grupos</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:26,fontWeight:800,lineHeight:1,color:i===0?'#f0c040':'#d8eaf7'}}>{p.pts}</div>
                <div style={{fontSize:9,letterSpacing:1,color:'#4d7a9e'}}>PTS</div>
              </div>
            </div>
            <div style={{paddingLeft:42}}>
              <div style={{background:'#1c3352',borderRadius:3,height:4,overflow:'hidden'}}>
                <div style={{height:'100%',background:p.color,width:(maxPts>0?Math.round(p.pts/maxPts*100):0)+'%',transition:'width .5s'}}/>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={S.cardD}>
        <div style={S.ct}>Progreso del Torneo</div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{flex:1}}>
            <div style={{background:'#1c3352',borderRadius:4,height:8,overflow:'hidden'}}>
              <div style={{height:'100%',background:'#f0c040',borderRadius:4,width:pct+'%',transition:'width .5s'}}/>
            </div>
            <div style={{fontSize:11,color:'#4d7a9e',marginTop:5}}>{grpDone+koDone} de {total} partidos con resultado</div>
          </div>
          <div style={{fontSize:24,fontWeight:800,color:'#f0c040'}}>{pct}%</div>
        </div>
      </div>
    </div>
  )
}

// ── MATCHES TAB ───────────────────────────────────────────────────────────────
function MatchesTab({results,predictions,participants}){
  const [phase,setPhase]=useState('Fase de Grupos');const [group,setGroup]=useState('A')
  const allPhases=['Fase de Grupos',...KO_PHASES]
  const isGrp=phase==='Fase de Grupos'
  const grpMatches=isGrp?GROUP_MATCHES.filter(m=>m.group===group):[]
  return(
    <div>
      <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8,marginBottom:10,scrollbarWidth:'none'}}>
        {allPhases.map(ph=>(
          <button key={ph} onClick={()=>setPhase(ph)} style={{whiteSpace:'nowrap',padding:'5px 11px',borderRadius:20,border:'1px solid',borderColor:ph===phase?'#f0c040':'#1c3352',background:ph===phase?'#f0c040':'transparent',color:ph===phase?'#050d10':'#4d7a9e',fontSize:11,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center'}}>
            <span>{PHASE_LABELS[ph]||ph}</span><span style={{fontSize:9,opacity:.8}}>{PHASE_POINTS[ph]}pts</span>
          </button>
        ))}
      </div>
      {isGrp&&<GroupPills current={group} onChange={setGroup}/>}
      {isGrp&&grpMatches.map(m=>{
        const result=results[m.id],counts={'1':0,'X':0,'2':0}
        participants.forEach(p=>{const pr=(predictions[p.id]||{})[m.id];if(pr)counts[pr]++})
        const tot=participants.length
        return(
          <div key={m.id} style={S.mc}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700}}>JORNADA {m.matchday} <span style={{color:'#4d7a9e',fontWeight:800}}>3pts</span></span>
              {result&&<span style={{padding:'2px 9px',borderRadius:4,fontSize:11,fontWeight:700,background:'#1a3a1a',color:'#3ddc84'}}>{result==='X'?'EMPATE':shortTeam(result==='1'?m.home:m.away)}</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.home}</span>
              <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 6px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
              <span style={{flex:1,fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.away}</span>
            </div>
            {tot>0&&<div style={{display:'flex',gap:4,marginTop:10}}>
              {['1','X','2'].map(opt=>{const c=counts[opt],pc=tot>0?Math.round(c/tot*100):0;return(
                <div key={opt} style={{flex:1,textAlign:'center'}}>
                  <div style={{background:'#1c3352',borderRadius:2,height:3,overflow:'hidden',marginBottom:3}}><div style={{height:'100%',background:'#4a9eff',width:pc+'%'}}/></div>
                  <div style={{fontSize:9,color:'#4d7a9e'}}>{opt}: {c} ({pc}%)</div>
                </div>
              )})}
            </div>}
          </div>
        )
      })}
      {!isGrp&&<div style={{...S.cardD,textAlign:'center',padding:'30px 14px'}}>
        <div style={{fontSize:13,color:'#4d7a9e',lineHeight:1.9}}>
          Los partidos eliminatorios se ven en el<br/>
          <b style={{color:'#d8eaf7'}}>{'\uD83C\uDFAF'} Bracket</b> de cada participante<br/>
          (pestaña Picks)
        </div>
      </div>}
    </div>
  )
}

// ── PICKS TAB (group stage) ───────────────────────────────────────────────────
function PicksTab({predictions,participants,lockedPicks,onPick,onLockSection,onOpenBracket}){
  const [pid,setPid]=useState(participants[0]?.id||null)
  const [group,setGroup]=useState('A')
  const [onlyUndone,setOnly]=useState(false)
  const [lockModal,setLockModal]=useState(null)

  const selP=participants.find(p=>p.id===pid)||participants[0]
  const pp=pid?(predictions[pid]||{}):{};const predCount=Object.keys(pp).filter(k=>!k.startsWith('__')).length
  const secMatches=GROUP_MATCHES.filter(m=>m.group===group)
  const curSec='GRP-'+group
  const isLocked=!!(pid&&lockedPicks[pid]&&lockedPicks[pid][curSec])
  const secPicks=secMatches.filter(m=>pp[m.id]).length
  const allGroupsLocked=pid&&GROUPS.every(g=>lockedPicks[pid]&&lockedPicks[pid]['GRP-'+g])
  const filtered=GROUP_MATCHES.filter(m=>{ if(m.group!==group)return false; if(onlyUndone&&pp[m.id])return false; return true })

  if(!participants.length) return <div style={{textAlign:'center',color:'#4d7a9e',padding:50,fontSize:13}}>Primero anade participantes en Admin</div>
  return(
    <div>
      {lockModal&&<LockModal sectionLabel={'Grupo '+group} onConfirm={()=>{onLockSection(pid,lockModal);setLockModal(null)}} onCancel={()=>setLockModal(null)}/>}
      <div style={S.card}>
        <div style={S.ct}>Quien pronostica?</div>
        <select style={S.select} value={pid||''} onChange={e=>setPid(e.target.value)}>
          {participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {selP&&<>
          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:selP.color}}/>
            <div style={{flex:1,fontSize:12,color:'#4d7a9e'}}>{predCount}/{GROUP_MATCHES.length} picks de fase de grupos</div>
            <div style={{fontSize:13,fontWeight:700,color:'#f0c040'}}>{Math.round(predCount/GROUP_MATCHES.length*100)}%</div>
          </div>
          <div style={{background:'#1c3352',borderRadius:3,height:5,overflow:'hidden',marginTop:6}}>
            <div style={{height:'100%',background:selP.color,width:Math.round(predCount/GROUP_MATCHES.length*100)+'%',transition:'width .4s'}}/>
          </div>
        </>}
      </div>

      {allGroupsLocked&&(
        <button style={{...S.btnLock,width:'100%',marginBottom:12,fontSize:14,background:'#1a2a0a',color:'#f0c040',border:'1px solid #f0c04066'}} onClick={()=>onOpenBracket(pid)}>
          {'\uD83C\uDFC6'} Ver mi Bracket Eliminatorio
        </button>
      )}

      <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:6,marginBottom:10,scrollbarWidth:'none'}}>
        {GROUPS.map(g=>{
          const lkd=!!(pid&&lockedPicks[pid]&&lockedPicks[pid]['GRP-'+g])
          return(
            <button key={g} onClick={()=>setGroup(g)} style={{width:36,height:36,borderRadius:6,border:'1px solid',flexShrink:0,borderColor:g===group?'#4a9eff':'#1c3352',background:g===group?'#1e3a5f':'transparent',color:g===group?'#4a9eff':'#4d7a9e',fontSize:11,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer',position:'relative'}}>
              {g}{lkd&&<span style={{position:'absolute',top:-3,right:-3,fontSize:8}}>{'\uD83D\uDD12'}</span>}
            </button>
          )
        })}
      </div>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,padding:'8px 12px',background:'#0c1a2e',borderRadius:8,border:'1px solid '+(isLocked?'#c084fc44':'#1c3352')}}>
        <div style={{fontSize:12,color:'#4d7a9e'}}>{secPicks}/6 picks — Grupo {group}{isLocked&&<span style={{marginLeft:8,color:'#c084fc',fontWeight:700}}>{'\uD83D\uDD12'} BLOQUEADO</span>}</div>
        {!isLocked&&<label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:'#4d7a9e'}}><input type="checkbox" checked={onlyUndone} onChange={e=>setOnly(e.target.checked)}/> Sin pick</label>}
      </div>

      {isLocked&&<div style={{...S.cardD,border:'1px solid #c084fc44',textAlign:'center',padding:'14px',marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:'#c084fc',marginBottom:4}}>{'\uD83D\uDD12'} Grupo {group} Bloqueado</div>
        <div style={{fontSize:12,color:'#4d7a9e'}}>Solo el admin puede desbloquear.</div>
      </div>}

      {filtered.map(m=>{
        const pred=pp[m.id];const opts=['1','X','2'];const labels={'1':m.home,'X':'Empate','2':m.away};const locked=isLocked
        return(
          <div key={m.id} style={{...S.mc,borderColor:locked?'#c084fc22':pred?'#f0c04033':'#1c3352'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700}}>JORNADA {m.matchday} <span style={{color:'#4d7a9e',fontWeight:800}}>3pts</span></span>
              {pred&&<span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:locked?'#c084fc22':'#f0c04022',color:locked?'#c084fc':'#f0c040',border:'1px solid '+(locked?'#c084fc44':'#f0c04044')}}>{locked?'\uD83D\uDD12 ':''}{pred==='X'?'EMPATE':shortTeam(labels[pred])}</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
              <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700}}>{m.home}</span>
              <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 6px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
              <span style={{flex:1,fontSize:14,fontWeight:700}}>{m.away}</span>
            </div>
            {!locked&&<div style={{display:'flex',gap:6}}>
              {opts.map(opt=>(
                <button key={opt} onClick={()=>onPick(pid,m.id,pred===opt?null:opt)} style={{flex:1,padding:'8px 4px',borderRadius:7,border:'1px solid',borderColor:pred===opt?'#f0c040':'#1c3352',background:pred===opt?'#f0c040':'#111d30',color:pred===opt?'#050d10':'#4d7a9e',fontFamily:"'Rajdhani',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
                  <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
                  <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{opt==='X'?'Empate':shortTeam(labels[opt])}</span>
                </button>
              ))}
            </div>}
            {locked&&<div style={{display:'flex',gap:6}}>
              {opts.map(opt=>(
                <div key={opt} style={{flex:1,padding:'8px 4px',borderRadius:7,border:'1px solid',borderColor:pred===opt?'#c084fc':'#1c3352',background:pred===opt?'#1a1a3a':'#0a0f1a',color:pred===opt?'#c084fc':'#2a4a6e',display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
                  <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
                  <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{opt==='X'?'Empate':shortTeam(labels[opt])}</span>
                </div>
              ))}
            </div>}
          </div>
        )
      })}
      {pid&&!isLocked&&secPicks>0&&(
        <div style={{padding:'4px 0 16px'}}>
          <button style={{...S.btnLock,width:'100%',fontSize:14}} onClick={()=>setLockModal(curSec)}>
            {'\uD83D\uDD12'} Confirmar picks - Grupo {group}
          </button>
        </div>
      )}
    </div>
  )
}

// ── BRACKET TAB ───────────────────────────────────────────────────────────────
function BracketTab({pid,participants,predictions,lockedPicks,koResults,onKoPick,onLockKoSection,onBack}){
  const [lockModal,setLockModal]=useState(null)
  const [viewMode,setViewMode]=useState('bracket')
  const selP=participants.find(p=>p.id===pid)
  const pp=predictions[pid]||{},kp=pp.__k||{},lk=lockedPicks[pid]||{}
  const bracket=getFullBracket(pid,predictions,lockedPicks)||{}
  const allGroupsLocked=GROUPS.every(g=>lk['GRP-'+g])

  if(!allGroupsLocked) return(
    <div>
      <div style={{...S.cardD,textAlign:'center',padding:'40px 20px'}}>
        <div style={{fontSize:32,marginBottom:12}}>{'\uD83C\uDFC6'}</div>
        <div style={{fontSize:14,color:'#4d7a9e'}}>Debes bloquear todos los grupos<br/>antes de ver tu bracket eliminatorio.</div>
      </div>
      <button style={{...S.btnOut,width:'100%'}} onClick={onBack}>{'\u2190'} Volver a Grupos</button>
    </div>
  )

  const rounds=[
    {phase:'Ronda de 32',     ids:R32_IDS, pts:5,  lock:'Ronda de 32',     need:''},
    {phase:'Octavos de Final',ids:R16_IDS, pts:5,  lock:'Octavos de Final',need:'Ronda de 32'},
    {phase:'Cuartos de Final',ids:QF_IDS,  pts:5,  lock:'Cuartos de Final',need:'Octavos de Final'},
    {phase:'Semifinales',     ids:SF_IDS,  pts:7,  lock:'Semifinales',     need:'Cuartos de Final'},
    {phase:'Tercer Puesto',   ids:['M103'],pts:7,  lock:'Tercer Puesto',   need:'Semifinales'},
    {phase:'Gran Final',      ids:['M104'],pts:10, lock:'Gran Final',      need:'Semifinales'},
  ]

  return(
    <div>
      {lockModal&&<LockModal sectionLabel={lockModal} onConfirm={()=>{onLockKoSection(pid,lockModal);setLockModal(null)}} onCancel={()=>setLockModal(null)}/>}

      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <button style={{...S.btnOut,padding:'6px 10px',fontSize:12}} onClick={onBack}>{'\u2190'}</button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:15,fontWeight:700,color:selP?.color||'#f0c040',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selP?.name}</div>
          <div style={{fontSize:10,color:'#4d7a9e'}}>Bracket Eliminatorio Personal</div>
        </div>
        <div style={{display:'flex',gap:3,flexShrink:0}}>
          {[['bracket','Bracket'],['list','Lista']].map(([m,lbl])=>(
            <button key={m} onClick={()=>setViewMode(m)} style={{padding:'4px 10px',borderRadius:5,border:'1px solid',fontSize:10,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer',borderColor:viewMode===m?'#f0c040':'#1c3352',background:viewMode===m?'#f0c04015':'transparent',color:viewMode===m?'#f0c040':'#4d7a9e'}}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Visual bracket */}
      {viewMode==='bracket'&&(
        <BracketView
          bracket={bracket}
          koPicks={kp}
          koResults={koResults}
          onKoPick={(mid,team)=>onKoPick(pid,mid,team)}
          isLocked={phase=>!!lk[phase]}
        />
      )}

      {/* For bracket view: lock buttons per round */}
      {viewMode==='bracket'&&rounds.map(({phase,ids,lock,need})=>{
        if(need&&!lk[need]) return null
        const roundLocked=!!lk[lock]
        const roundPicks=ids.filter(id=>kp[id]).length
        const allPicked=roundPicks===ids.length
        if(!allPicked||roundLocked) return null
        return(
          <div key={phase} style={{padding:'0 0 8px'}}>
            <button style={{...S.btnLock,width:'100%'}} onClick={()=>setLockModal(lock)}>
              {'\uD83D\uDD12'} Confirmar {PHASE_LABELS[phase]||phase}
            </button>
          </div>
        )
      })}

      {/* List view */}
      {viewMode==='list'&&rounds.map(({phase,ids,pts,lock,need})=>{
        if(need&&!lk[need]) return null
        const roundLocked=!!lk[lock]
        const roundPicks=ids.filter(id=>kp[id]).length
        const allPicked=roundPicks===ids.length
        const ptC=pts===10?'#f0c040':pts===7?'#c084fc':'#4a9eff'
        return(
          <div key={phase}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,marginTop:4}}>
              <div style={{flex:1,fontSize:11,color:ptC,fontWeight:700,letterSpacing:1,textTransform:'uppercase'}}>{phase}</div>
              <div style={{fontSize:10,background:ptC+'22',color:ptC,border:'1px solid '+ptC+'44',padding:'2px 8px',borderRadius:4,fontWeight:700}}>{pts}pts</div>
              <div style={{fontSize:10,color:'#4d7a9e'}}>{roundPicks}/{ids.length}</div>
              {roundLocked&&<span style={{fontSize:12,color:'#c084fc'}}>{'\uD83D\uDD12'}</span>}
            </div>
            {ids.map(mid=>{
              const m=bracket[mid]||{h:'TBD',a:'TBD'}
              const picked=kp[mid],result=koResults[mid]
              const ok=picked&&result&&picked===result
              const wrong=picked&&result&&picked!==result
              return(
                <div key={mid} style={{...S.mc,marginBottom:8,borderColor:roundLocked?'#c084fc22':picked?'#f0c04033':'#1c3352',opacity:(isTBD(m.h)&&isTBD(m.a))?.5:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <span style={{fontSize:10,color:'#4d7a9e',fontWeight:700}}>{mid}</span>
                    {result&&<span style={{padding:'2px 9px',borderRadius:4,fontSize:11,fontWeight:700,background:ok?'#1a3a1a':'#3a1a1a',color:ok?'#3ddc84':'#e63946'}}>{ok?'\u2713':'\u2717'} {result}</span>}
                    {!result&&picked&&<span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:roundLocked?'#c084fc22':'#f0c04022',color:roundLocked?'#c084fc':'#f0c040'}}>{roundLocked?'\uD83D\uDD12 ':''}{picked}</span>}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:roundLocked?0:10}}>
                    <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.h}</span>
                    <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 6px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
                    <span style={{flex:1,fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.a}</span>
                  </div>
                  {!roundLocked&&!isTBD(m.h)&&!isTBD(m.a)&&(
                    <div style={{display:'flex',gap:6}}>
                      {[m.h,m.a].map(team=>(
                        <button key={team} onClick={()=>onKoPick(pid,mid,picked===team?null:team)} style={{flex:1,padding:'9px 6px',borderRadius:7,border:'1px solid',borderColor:picked===team?'#f0c040':'#1c3352',background:picked===team?'#f0c040':'#111d30',color:picked===team?'#050d10':'#4d7a9e',fontFamily:"'Rajdhani',sans-serif",fontSize:11,fontWeight:700,cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {team}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {!roundLocked&&allPicked&&viewMode==='list'&&(
              <div style={{padding:'0 0 12px'}}>
                <button style={{...S.btnLock,width:'100%'}} onClick={()=>setLockModal(lock)}>
                  {'\uD83D\uDD12'} Confirmar {PHASE_LABELS[phase]||phase}
                </button>
              </div>
            )}
            <div style={{height:1,background:'#1c3352',margin:'8px 0'}}/>
          </div>
        )
      })}
    </div>
  )
}

// ── ADMIN TAB ─────────────────────────────────────────────────────────────────
function AdminTab({participants,results,koResults,predictions,lockedPicks,adminPin,updParticipants,updResults,updKoResults,updLockedPicks,updAdminPin,onReset,adminUnlocked,onNeedPin}){
  const [sec,setSec]=useState('participants')
  const [newName,setNewName]=useState('')
  const [resGroup,setResGroup]=useState('A')
  const [koPhase,setKoPhase]=useState('Ronda de 32')
  const [oldPin,setOldPin]=useState('');const [newPin,setNewPin]=useState('');const [cPin,setCPin]=useState('');const [pinMsg,setPinMsg]=useState(null)

  function reqAdmin(cb){ if(!adminUnlocked)onNeedPin(cb); else cb() }
  function addP(){ if(!newName.trim())return; const np={id:Date.now().toString(),name:newName.trim(),color:COLORS[participants.length%COLORS.length]}; updParticipants([...participants,np]); setNewName('') }
  function setResult(mid,val){ const nr={...results};if(nr[mid]===val)delete nr[mid];else nr[mid]=val;updResults(nr) }
  function setKoResult(mid,val){ const nr={...koResults};if(nr[mid]===val)delete nr[mid];else nr[mid]=val;updKoResults(nr) }
  function unlockSec(pid,sk){ const nl={...lockedPicks};if(nl[pid])delete nl[pid][sk];updLockedPicks(nl) }
  function changePin(){
    if(oldPin!==adminPin){setPinMsg({err:true,msg:'PIN anterior incorrecto.'});return}
    if(newPin.length<4){setPinMsg({err:true,msg:'Minimo 4 digitos.'});return}
    if(newPin!==cPin){setPinMsg({err:true,msg:'Los PINs no coinciden.'});return}
    updAdminPin(newPin);setOldPin('');setNewPin('');setCPin('')
    setPinMsg({err:false,msg:'PIN cambiado.'});setTimeout(()=>setPinMsg(null),3000)
  }

  const resFiltered=GROUP_MATCHES.filter(m=>m.group===resGroup)
  const koIds=KO_ROUND_IDS[koPhase]||[]

  return(
    <div>
      <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
        {[['participants','\uD83D\uDC65 Jugadores'],['results','\uD83D\uDCCA Fase Grupos'],['ko','\uD83C\uDFC6 Eliminatorias'],['settings','\u2699\uFE0F Config']].map(([id,label])=>(
          <button key={id} onClick={()=>{ if((id==='results'||id==='ko'||id==='settings')&&!adminUnlocked){onNeedPin(()=>setSec(id));return} setSec(id) }}
            style={{flex:1,padding:'8px 4px',borderRadius:8,border:'1px solid',minWidth:70,borderColor:sec===id?'#f0c040':'#1c3352',background:sec===id?'#1a2a0a':'transparent',color:sec===id?'#f0c040':'#4d7a9e',fontFamily:"'Rajdhani',sans-serif",fontSize:10,fontWeight:700,cursor:'pointer'}}>
            {label}{(id==='results'||id==='ko'||id==='settings')&&!adminUnlocked?' \uD83D\uDD10':''}
          </button>
        ))}
      </div>

      {sec==='participants'&&<>
        <div style={{...S.cardD,border:'1px solid #f0c04033',marginBottom:12}}>
          <div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.7}}>{'\u26A0\uFE0F'} <b style={{color:'#f0c040'}}>Solo el admin puede agregar o quitar participantes.</b><br/>Se requiere PIN para modificar la lista.</div>
        </div>
        <div style={S.card}>
          <div style={S.ct}>Anadir Participante</div>
          <div style={{display:'flex',gap:8}}>
            <input style={{...S.input,flex:1}} placeholder="Nombre del jugador" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&reqAdmin(addP)}/>
            <button style={S.btn} onClick={()=>reqAdmin(addP)}>+</button>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.ct}>Participantes ({participants.length})</div>
          {!participants.length&&<div style={{textAlign:'center',color:'#4d7a9e',padding:'20px 0',fontSize:13}}>No hay participantes aun</div>}
          {participants.map(p=>{
            const ls=Object.keys(lockedPicks[p.id]||{}).filter(k=>lockedPicks[p.id][k])
            return(
              <div key={p.id} style={{padding:'10px 0',borderBottom:'1px solid #1c3352'}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:12,height:12,borderRadius:'50%',background:p.color,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:15,fontWeight:600}}>{p.name}</span>
                  <span style={{fontSize:11,color:'#4d7a9e'}}>{Object.keys(predictions[p.id]||{}).filter(k=>!k.startsWith('__')).length} picks</span>
                  {ls.length>0&&<span style={{fontSize:11,color:'#c084fc'}}>{'\uD83D\uDD12'}{ls.length}</span>}
                  <button style={S.btnRed} onClick={()=>reqAdmin(()=>updParticipants(participants.filter(x=>x.id!==p.id)))}>X</button>
                </div>
                {ls.length>0&&adminUnlocked&&(
                  <div style={{paddingLeft:22,marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
                    {ls.map(sk=>(
                      <button key={sk} onClick={()=>unlockSec(p.id,sk)} style={{fontSize:10,padding:'3px 8px',borderRadius:4,border:'1px solid #c084fc44',background:'transparent',color:'#c084fc',cursor:'pointer',fontFamily:"'Rajdhani',sans-serif"}}>
                        {'\uD83D\uDD13'} {sk}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{textAlign:'center'}}>
          <button style={{background:'transparent',color:'#e63946',border:'1px solid #e63946',borderRadius:6,padding:'8px 14px',fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,cursor:'pointer'}} onClick={()=>reqAdmin(onReset)}>
            Reiniciar todos los datos
          </button>
        </div>
      </>}

      {sec==='results'&&adminUnlocked&&<>
        <div style={{...S.cardD,border:'1px solid #3ddc8433'}}>
          <div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.8}}><b style={{color:'#3ddc84'}}>{'\u2705'} Admin activo</b><br/><b style={{color:'#d8eaf7'}}>1</b>=local &nbsp;{'\u00B7'}&nbsp; <b style={{color:'#d8eaf7'}}>X</b>=empate &nbsp;{'\u00B7'}&nbsp; <b style={{color:'#d8eaf7'}}>2</b>=visitante</div>
        </div>
        <GroupPills current={resGroup} onChange={setResGroup}/>
        <div style={{fontSize:11,color:'#4d7a9e',marginBottom:10,textAlign:'right'}}>{resFiltered.filter(m=>results[m.id]).length}/6 registrados</div>
        {resFiltered.map(m=>{
          const result=results[m.id];const opts=['1','X','2'];const labels={'1':m.home,'X':'Empate','2':m.away}
          return(
            <div key={m.id} style={{...S.mc,borderColor:result?'#3ddc8433':'#1c3352'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span style={{fontSize:10,color:'#4d7a9e',fontWeight:700}}>J{m.matchday}</span>
                {result&&<span style={{padding:'2px 9px',borderRadius:4,fontSize:11,fontWeight:700,background:'#1a3a1a',color:'#3ddc84'}}>{'\u2713'} {result==='X'?'EMPATE':shortTeam(labels[result])}</span>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700}}>{m.home}</span>
                <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 5px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
                <span style={{flex:1,fontSize:14,fontWeight:700}}>{m.away}</span>
              </div>
              <div style={{display:'flex',gap:6}}>
                {opts.map(opt=>(
                  <button key={opt} onClick={()=>setResult(m.id,opt)} style={{flex:1,padding:'9px 4px',borderRadius:7,border:'1px solid',borderColor:result===opt?'#3ddc84':'#1c3352',background:result===opt?'#1a3a1a':'#111d30',color:result===opt?'#3ddc84':'#4d7a9e',fontFamily:"'Rajdhani',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
                    <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
                    <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{opt==='X'?'Empate':shortTeam(labels[opt])}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </>}

      {sec==='ko'&&adminUnlocked&&<>
        <div style={{...S.cardD,border:'1px solid #3ddc8433'}}>
          <div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.7}}><b style={{color:'#3ddc84'}}>{'\u2705'} Admin activo</b><br/>Registra el equipo que avanza en cada partido eliminatorio. Escribe el nombre exactamente como aparece en los brackets.</div>
        </div>
        <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8,marginBottom:12,scrollbarWidth:'none'}}>
          {KO_PHASES.map(ph=>(
            <button key={ph} onClick={()=>setKoPhase(ph)} style={{whiteSpace:'nowrap',padding:'5px 11px',borderRadius:20,border:'1px solid',borderColor:ph===koPhase?'#3ddc84':'#1c3352',background:ph===koPhase?'#1a3a1a':'transparent',color:ph===koPhase?'#3ddc84':'#4d7a9e',fontSize:11,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer'}}>
              {PHASE_LABELS[ph]||ph}
            </button>
          ))}
        </div>
        {koIds.map(mid=>{
          const winner=koResults[mid]||''
          return(
            <div key={mid} style={{...S.mc,borderColor:winner?'#3ddc8433':'#1c3352',marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontSize:11,color:'#4d7a9e',fontWeight:700}}>{mid}</span>
                {winner&&<span style={{fontSize:11,color:'#3ddc84',fontWeight:700}}>{'\u2713'} {winner}</span>}
              </div>
              <input style={S.input} placeholder={'Equipo ganador de '+mid} value={winner} onChange={e=>{const nr={...koResults};if(e.target.value)nr[mid]=e.target.value.trim();else delete nr[mid];updKoResults(nr)}}/>
            </div>
          )
        })}
      </>}

      {sec==='settings'&&adminUnlocked&&<>
        <div style={S.card}>
          <div style={S.ct}>Cambiar PIN</div>
          <div style={{fontSize:12,color:'#4d7a9e',marginBottom:12,lineHeight:1.6}}>Para cambiar el PIN debes ingresar el PIN actual.<br/><b style={{color:'#f0c040'}}>PIN por defecto: {DEFAULT_PIN}</b></div>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,marginBottom:4,fontWeight:700}}>PIN ACTUAL</div>
            <input style={S.input} type="password" inputMode="numeric" placeholder="PIN actual" value={oldPin} onChange={e=>setOldPin(e.target.value)}/>
          </div>
          <div style={{marginBottom:8}}>
            <div style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,marginBottom:4,fontWeight:700}}>NUEVO PIN (min. 4)</div>
            <input style={S.input} type="password" inputMode="numeric" placeholder="Nuevo PIN" value={newPin} onChange={e=>setNewPin(e.target.value)}/>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,marginBottom:4,fontWeight:700}}>CONFIRMAR PIN</div>
            <input style={S.input} type="password" inputMode="numeric" placeholder="Repite" value={cPin} onChange={e=>setCPin(e.target.value)}/>
          </div>
          {pinMsg&&<div style={{fontSize:12,color:pinMsg.err?'#e63946':'#3ddc84',marginBottom:10,fontWeight:600}}>{pinMsg.msg}</div>}
          <button style={{...S.btn,width:'100%'}} onClick={changePin}>Guardar PIN</button>
        </div>
        <div style={S.cardD}>
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
  )
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
  const[tab,setTab]=useState('picks')
  const[adminUnlocked,setAdminU]=useState(false)
  const[showPin,setShowPin]=useState(false)
  const[pendingCb,setPendingCb]=useState(null)
  const[bracketPid,setBracketPid]=useState(null)

  const board=useMemo(()=>calcBoard(participants,predictions,results,koResults),[participants,predictions,results,koResults])

  useEffect(()=>{
    if(!db){setFatalError('Firebase no inicializado.');setLoading(false);return}
    const toArr=v=>!v?[]:Array.isArray(v)?v:Object.values(v)
    try{
      const unsub=onValue(ref(db,DB_PATH),snap=>{
        try{
          const d=snap.val()
          if(d){
            if(d.participants) setP(toArr(d.participants))
            if(d.results)      setR(d.results||{})
            if(d.koResults)    setKoR(d.koResults||{})
            if(d.predictions)  setPreds(d.predictions||{})
            if(d.lockedPicks)  setLocked(d.lockedPicks||{})
            if(d.adminPin)     setAdminPin(d.adminPin)
          }
        }catch(e){}
        setLoading(false)
      },err=>{setFatalError('Error Firebase: '+err.message);setLoading(false)})
      return()=>unsub()
    }catch(e){setFatalError('Error Firebase: '+e.message);setLoading(false)}
  },[])

  function save(d){ if(db) set(ref(db,DB_PATH),d).catch(e=>console.error(e)) }
  function bun(o={}){ return{participants,results,koResults,predictions,lockedPicks,adminPin,...o} }
  function updP(v){  setP(v);     save(bun({participants:v})) }
  function updR(v){  setR(v);     save(bun({results:v})) }
  function updKoR(v){setKoR(v);   save(bun({koResults:v})) }
  function updPr(v){ setPreds(v); save(bun({predictions:v})) }
  function updLk(v){ setLocked(v);save(bun({lockedPicks:v})) }
  function updPin(v){setAdminPin(v);save(bun({adminPin:v}))}

  function handlePick(pid,mid,val){
    const lk=lockedPicks[pid]||{},g=mid[1]
    if(lk['GRP-'+g]) return
    const pp={...(predictions[pid]||{})};if(val===null)delete pp[mid];else pp[mid]=val
    updPr({...predictions,[pid]:pp})
  }

  function handleKoPick(pid,mid,team){
    const lk=lockedPicks[pid]||{},phase=getKOPhase(mid)
    if(lk[phase]) return
    const pp={...(predictions[pid]||{})},kp={...(pp.__k||{})}
    if(team===null)delete kp[mid];else kp[mid]=team
    pp.__k=kp
    updPr({...predictions,[pid]:pp})
  }

  function handleLock(pid,sk){
    updLk({...lockedPicks,[pid]:{...(lockedPicks[pid]||{}),[sk]:true}})
  }

  function openBracket(pid){
    const pp=predictions[pid]||{}
    if(!pp.__b||!Object.keys(pp.__b).length){
      const bracket=generateR32(pid,predictions)
      const newPp={...pp,__b:bracket}
      updPr({...predictions,[pid]:newPp})
    }
    setBracketPid(pid);setTab('bracket')
  }

  function handleNeedPin(cb){ setPendingCb(()=>cb);setShowPin(true) }

  function handleReset(){
    setP([]);setR({});setKoR({});setPreds({});setLocked({});setAdminPin(DEFAULT_PIN)
    save({participants:[],results:{},koResults:{},predictions:{},lockedPicks:{},adminPin:DEFAULT_PIN})
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
    <div style={{...S.app,alignItems:'center',justifyContent:'center',fontSize:18,color:'#f0c040'}}>
      {'\u26BD'} Cargando...
    </div>
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

      {showPin&&<PinModal title="ACCESO ADMIN" subtitle={'PIN por defecto: '+DEFAULT_PIN} storedPin={adminPin} onSuccess={()=>{setAdminU(true);setShowPin(false);if(pendingCb){pendingCb();setPendingCb(null)}}} onCancel={()=>{setShowPin(false);setPendingCb(null)}}/>}

      <div style={S.header}>
        <div style={{fontSize:32}}>{'\u26BD'}</div>
        <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:3,color:'#f0c040',lineHeight:1}}>POLLA MUNDIALISTA</div>
          <div style={{fontSize:10,letterSpacing:2,color:'#4d7a9e',marginTop:2}}>FIFA WORLD CUP 2026</div>
        </div>
        <div style={{marginLeft:'auto',textAlign:'right'}}>
          <div style={{fontSize:20,fontWeight:700,lineHeight:1}}>{Object.keys(results).length+Object.keys(koResults).length}<span style={{fontSize:12,color:'#4d7a9e'}}>/{GROUP_MATCHES.length+32}</span></div>
          <div style={{fontSize:9,letterSpacing:1,color:'#4d7a9e'}}>JUGADOS</div>
        </div>
      </div>

      <div style={S.content}>
        {tab==='board'  &&<BoardTab board={board} results={results} koResults={koResults}/>}
        {tab==='matches'&&<MatchesTab results={results} predictions={predictions} participants={participants}/>}
        {(tab==='picks'||tab==='bracket')&&tab!=='bracket'&&<PicksTab predictions={predictions} participants={participants} lockedPicks={lockedPicks} onPick={handlePick} onLockSection={handleLock} onOpenBracket={openBracket}/>}
        {tab==='bracket'&&bracketPid&&<BracketTab pid={bracketPid} participants={participants} predictions={predictions} lockedPicks={lockedPicks} koResults={koResults} onKoPick={handleKoPick} onLockKoSection={handleLock} onBack={()=>setTab('picks')}/>}
        {tab==='admin'  &&<AdminTab participants={participants} results={results} koResults={koResults} predictions={predictions} lockedPicks={lockedPicks} adminPin={adminPin} updParticipants={updP} updResults={updR} updKoResults={updKoR} updLockedPicks={updLk} updAdminPin={updPin} onReset={handleReset} adminUnlocked={adminUnlocked} onNeedPin={handleNeedPin}/>}
      </div>

      <div style={S.tabbar}>
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
