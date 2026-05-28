import { useState, useEffect, useMemo } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set } from 'firebase/database'

// ─────────────────────────────────────────────────────────────────────────────
// 🔥 PASO 1: PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE
//    (la obtienes en console.firebase.google.com → tu proyecto → </> → Config)
// ─────────────────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "REEMPLAZA_apiKey",
  authDomain:        "REEMPLAZA_authDomain",
  databaseURL:       "REEMPLAZA_databaseURL",
  projectId:         "REEMPLAZA_projectId",
  storageBucket:     "REEMPLAZA_storageBucket",
  messagingSenderId: "REEMPLAZA_messagingSenderId",
  appId:             "REEMPLAZA_appId",
}
// ─────────────────────────────────────────────────────────────────────────────

const firebaseApp = initializeApp(firebaseConfig)
const db = getDatabase(firebaseApp)
const DB_PATH = 'polla2026'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const DEFAULT_PIN  = '1234'
const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const PHASES = ['Fase de Grupos','Ronda de 32','Octavos de Final','Cuartos de Final','Semifinales','Tercer Puesto','Gran Final']
const PHASE_LABELS = {'Fase de Grupos':'Grupos','Ronda de 32':'1/32','Octavos de Final':'Octavos','Cuartos de Final':'Cuartos','Semifinales':'Semis','Tercer Puesto':'3er P.','Gran Final':'Final'}
const PHASE_POINTS = {'Fase de Grupos':3,'Ronda de 32':5,'Octavos de Final':5,'Cuartos de Final':5,'Semifinales':7,'Tercer Puesto':7,'Gran Final':10}
const COLORS = ['#f0c040','#4ade80','#60a5fa','#f87171','#c084fc','#fb923c','#34d399','#a78bfa','#f472b6','#facc15','#38bdf8','#e879f9']
const KO_KEYS = {'Ronda de 32':'R32','Octavos de Final':'R16','Cuartos de Final':'QF','Semifinales':'SF','Tercer Puesto':'3RD','Gran Final':'FIN'}

const WC2026 = {
  A:[{name:'México',flag:'🇲🇽'},{name:'Corea del Sur',flag:'🇰🇷'},{name:'Sudáfrica',flag:'🇿🇦'},{name:'Chequia',flag:'🇨🇿'}],
  B:[{name:'Canadá',flag:'🇨🇦'},{name:'Suiza',flag:'🇨🇭'},{name:'Qatar',flag:'🇶🇦'},{name:'Bosnia-Herz.',flag:'🇧🇦'}],
  C:[{name:'Brasil',flag:'🇧🇷'},{name:'Marruecos',flag:'🇲🇦'},{name:'Escocia',flag:'🏴󠁧󠁢󠁳󠁣󠁴󠁿'},{name:'Haití',flag:'🇭🇹'}],
  D:[{name:'Estados Unidos',flag:'🇺🇸'},{name:'Paraguay',flag:'🇵🇾'},{name:'Australia',flag:'🇦🇺'},{name:'Turquía',flag:'🇹🇷'}],
  E:[{name:'Alemania',flag:'🇩🇪'},{name:'Curazao',flag:'🇨🇼'},{name:'C. de Marfil',flag:'🇨🇮'},{name:'Ecuador',flag:'🇪🇨'}],
  F:[{name:'Países Bajos',flag:'🇳🇱'},{name:'Japón',flag:'🇯🇵'},{name:'Túnez',flag:'🇹🇳'},{name:'Suecia',flag:'🇸🇪'}],
  G:[{name:'Bélgica',flag:'🇧🇪'},{name:'Egipto',flag:'🇪🇬'},{name:'Irán',flag:'🇮🇷'},{name:'Nueva Zelanda',flag:'🇳🇿'}],
  H:[{name:'España',flag:'🇪🇸'},{name:'Cabo Verde',flag:'🇨🇻'},{name:'Arabia Saudita',flag:'🇸🇦'},{name:'Uruguay',flag:'🇺🇾'}],
  I:[{name:'Francia',flag:'🇫🇷'},{name:'Senegal',flag:'🇸🇳'},{name:'Noruega',flag:'🇳🇴'},{name:'Irak',flag:'🇮🇶'}],
  J:[{name:'Argentina',flag:'🇦🇷'},{name:'Argelia',flag:'🇩🇿'},{name:'Austria',flag:'🇦🇹'},{name:'Jordania',flag:'🇯🇴'}],
  K:[{name:'Portugal',flag:'🇵🇹'},{name:'Colombia',flag:'🇨🇴'},{name:'Uzbekistán',flag:'🇺🇿'},{name:'RD Congo',flag:'🇨🇩'}],
  L:[{name:'Inglaterra',flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿'},{name:'Croacia',flag:'🇭🇷'},{name:'Ghana',flag:'🇬🇭'},{name:'Panamá',flag:'🇵🇦'}],
}

const tl = t => `${t.flag} ${t.name}`
const short = s => { if(!s||s==='Por definir') return 'TBD'; const p=s.split(' '); return p.length>1?p.slice(1).join(' ').split(' ')[0]:p[0] }
const isTBD = s => !s||s==='Por definir'
const secKey = m => m.phase==='Fase de Grupos'?`GRP-${m.group}`:KO_KEYS[m.phase]||m.phase

function genMatches() {
  const ms=[]; const mdP=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]]
  GROUPS.forEach(g=>{const t=WC2026[g]; mdP.forEach((pairs,md)=>{ pairs.forEach(([i,j])=>{ ms.push({id:`G${g}${i}${j}`,phase:'Fase de Grupos',group:g,matchday:md+1,home:tl(t[i]),away:tl(t[j]),allowDraw:true}) }) })})
  [['Ronda de 32',16,'R32'],['Octavos de Final',8,'R16'],['Cuartos de Final',4,'QF'],['Semifinales',2,'SF'],['Tercer Puesto',1,'3RD'],['Gran Final',1,'FIN']].forEach(([phase,count,px])=>{ for(let i=1;i<=count;i++) ms.push({id:`${px}${count>1?i:''}`,phase,home:'Por definir',away:'Por definir',allowDraw:false}) })
  return ms
}
const ALL_MATCHES = genMatches()

function calcBoard(participants,predictions,results) {
  return [...participants].map(p=>{
    const pp=predictions[p.id]||{}; let pts=0,correct=0,played=0
    ALL_MATCHES.forEach(m=>{ if(pp[m.id]&&results[m.id]){played++;if(pp[m.id]===results[m.id]){pts+=PHASE_POINTS[m.phase]||3;correct++}} })
    return{...p,pts,correct,played,predCount:Object.keys(pp).length}
  }).sort((a,b)=>b.pts-a.pts||b.correct-a.correct)
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  app:{background:'#07111f',minHeight:'100vh',color:'#d8eaf7',fontFamily:"'Rajdhani',system-ui,sans-serif",display:'flex',flexDirection:'column'},
  header:{background:'linear-gradient(135deg,#0a1628,#0e2040,#0a1628)',borderBottom:'2px solid #f0c040',padding:'13px 16px',display:'flex',alignItems:'center',gap:12,flexShrink:0},
  content:{flex:1,overflowY:'auto',padding:14,paddingBottom:84},
  tabbar:{position:'fixed',bottom:0,left:0,right:0,background:'#0a1628',borderTop:'1px solid #1c3352',display:'flex',zIndex:50},
  card:{background:'#0c1a2e',border:'1px solid #1c3352',borderRadius:10,padding:14,marginBottom:12},
  cardDark:{background:'#0a1528',border:'1px solid #1c3352',borderRadius:10,padding:14,marginBottom:12},
  ct:{fontSize:11,letterSpacing:2,color:'#6d9bbf',marginBottom:10,textTransform:'uppercase',fontWeight:700},
  input:{background:'#111d30',border:'1px solid #1c3352',borderRadius:6,color:'#d8eaf7',padding:'9px 12px',fontSize:14,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,width:'100%',outline:'none',boxSizing:'border-box'},
  select:{background:'#111d30',border:'1px solid #1c3352',borderRadius:6,color:'#d8eaf7',padding:'9px 12px',fontSize:14,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,width:'100%',outline:'none',boxSizing:'border-box'},
  btn:{background:'#f0c040',color:'#050d10',border:'none',borderRadius:6,padding:'10px 18px',fontWeight:700,fontFamily:"'Rajdhani',sans-serif",fontSize:13,letterSpacing:1,cursor:'pointer'},
  btnRed:{background:'#e63946',color:'#fff',border:'none',borderRadius:6,padding:'8px 14px',fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:12,cursor:'pointer'},
  btnOut:{background:'transparent',color:'#4d7a9e',border:'1px solid #1c3352',borderRadius:6,padding:'8px 14px',fontFamily:"'Rajdhani',sans-serif",fontWeight:600,fontSize:12,cursor:'pointer'},
  btnLock:{background:'#1a1a3a',color:'#c084fc',border:'1px solid #c084fc66',borderRadius:6,padding:'10px 18px',fontFamily:"'Rajdhani',sans-serif",fontWeight:700,fontSize:13,cursor:'pointer'},
  mc:{background:'#0c1a2e',border:'1px solid #1c3352',borderRadius:8,padding:'12px 14px',marginBottom:8},
}

// ─── PHASE + GROUP PILLS ──────────────────────────────────────────────────────
function PhasePills({current,onChange}){
  return <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8,marginBottom:10,scrollbarWidth:'none'}}>
    {PHASES.map(p=><button key={p} onClick={()=>onChange(p)} style={{whiteSpace:'nowrap',padding:'5px 11px',borderRadius:20,border:'1px solid',borderColor:p===current?'#f0c040':'#1c3352',background:p===current?'#f0c040':'transparent',color:p===current?'#050d10':'#4d7a9e',fontSize:11,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center'}}>
      <span>{PHASE_LABELS[p]||p}</span><span style={{fontSize:9,opacity:.8}}>{PHASE_POINTS[p]}pts</span>
    </button>)}
  </div>
}

function GroupPills({current,onChange}){
  return <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:6,marginBottom:10,scrollbarWidth:'none'}}>
    {GROUPS.map(g=><button key={g} onClick={()=>onChange(g)} style={{width:34,height:34,borderRadius:6,border:'1px solid',flexShrink:0,borderColor:g===current?'#4a9eff':'#1c3352',background:g===current?'#1e3a5f':'transparent',color:g===current?'#4a9eff':'#4d7a9e',fontSize:13,fontWeight:700,fontFamily:"'Rajdhani',sans-serif",cursor:'pointer'}}>{g}</button>)}
  </div>
}

// ─── PIN MODAL ────────────────────────────────────────────────────────────────
function PinModal({title,subtitle,onSuccess,onCancel,storedPin}){
  const [pin,setPin]=useState(''); const [err,setErr]=useState(false)
  const check=()=>{ if(pin===storedPin){setErr(false);onSuccess()}else{setErr(true);setPin('')} }
  return <div style={{position:'fixed',inset:0,background:'#000000cc',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
    <div style={{background:'#0c1a2e',border:'1px solid #1c3352',borderRadius:14,padding:28,width:'100%',maxWidth:320,textAlign:'center'}}>
      <div style={{fontSize:36,marginBottom:12}}>🔐</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,color:'#f0c040',marginBottom:6}}>{title}</div>
      <div style={{fontSize:13,color:'#4d7a9e',marginBottom:20,lineHeight:1.5}}>{subtitle}</div>
      <input style={{...S.input,textAlign:'center',fontSize:22,letterSpacing:8,marginBottom:10,border:`1px solid ${err?'#e63946':'#1c3352'}`}} type="password" inputMode="numeric" maxLength={8} placeholder="••••" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} autoFocus/>
      {err&&<div style={{color:'#e63946',fontSize:12,marginBottom:10}}>PIN incorrecto. Inténtalo de nuevo.</div>}
      <div style={{display:'flex',gap:8,marginTop:8}}>
        {onCancel&&<button style={{...S.btnOut,flex:1}} onClick={onCancel}>Cancelar</button>}
        <button style={{...S.btn,flex:1}} onClick={check}>Entrar</button>
      </div>
    </div>
  </div>
}

// ─── LOCK MODAL ───────────────────────────────────────────────────────────────
function LockModal({sectionLabel,onConfirm,onCancel}){
  return <div style={{position:'fixed',inset:0,background:'#000000cc',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
    <div style={{background:'#0c1a2e',border:'1px solid #c084fc66',borderRadius:14,padding:28,width:'100%',maxWidth:340,textAlign:'center'}}>
      <div style={{fontSize:40,marginBottom:12}}>🔒</div>
      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,color:'#c084fc',marginBottom:10}}>Bloquear Pronósticos</div>
      <div style={{fontSize:13,color:'#d8eaf7',marginBottom:6,lineHeight:1.6}}>¿Confirmas tus picks para <b style={{color:'#f0c040'}}>{sectionLabel}</b>?</div>
      <div style={{fontSize:12,color:'#e63946',marginBottom:20,lineHeight:1.6,background:'#e6394610',border:'1px solid #e6394633',borderRadius:8,padding:'10px 14px'}}>
        ⚠️ <b>Esta acción es irreversible.</b><br/>Una vez bloqueados no podrás modificar tus picks.
      </div>
      <div style={{display:'flex',gap:8}}>
        <button style={{...S.btnOut,flex:1}} onClick={onCancel}>Cancelar</button>
        <button style={{...S.btnLock,flex:1}} onClick={onConfirm}>🔒 Confirmar y bloquear</button>
      </div>
    </div>
  </div>
}

// ─── BOARD TAB ────────────────────────────────────────────────────────────────
function BoardTab({board,resultCount}){
  const total=ALL_MATCHES.length; const pct=total>0?Math.round(resultCount/total*100):0; const maxPts=board[0]?.pts||1; const medals=['🥇','🥈','🥉']
  return <div>
    <div style={{...S.cardDark,marginBottom:12}}>
      <div style={S.ct}>Sistema de Puntuación</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {[['Grupos','3pts','#4d7a9e'],['1/32 · Octavos · Cuartos','5pts','#4a9eff'],['Semifinales','7pts','#c084fc'],['Gran Final','10pts','#f0c040']].map(([ph,p,c])=>(
          <div key={ph} style={{padding:'4px 10px',borderRadius:6,background:c+'18',border:`1px solid ${c}33`,fontSize:11,color:c}}><b>{p}</b> · {ph}</div>
        ))}
      </div>
    </div>
    <div style={S.card}>
      <div style={S.ct}>Clasificación General</div>
      {!board.length&&<div style={{textAlign:'center',color:'#4d7a9e',padding:'30px 0',fontSize:13}}>Aún no hay participantes.<br/>Ve a <b>⚙️ Admin</b> para añadirlos.</div>}
      {board.map((p,i)=>(
        <div key={p.id} style={{padding:'11px 0',borderBottom:'1px solid #1c3352'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:5}}>
            <div style={{fontSize:18,width:32,textAlign:'center',fontWeight:700,color:['#f0c040','#c0c0c0','#cd7f32'][i]||'#4d7a9e'}}>{medals[i]||i+1}</div>
            <div style={{width:11,height:11,borderRadius:'50%',background:p.color,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:16,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:i===0?'#f0c040':'#d8eaf7'}}>{p.name}</div>
              <div style={{fontSize:10,color:'#4d7a9e'}}>{p.correct}/{p.played} aciertos · {p.predCount}/{total} pronósticos</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:26,fontWeight:800,lineHeight:1,color:i===0?'#f0c040':'#d8eaf7'}}>{p.pts}</div>
              <div style={{fontSize:9,letterSpacing:1,color:'#4d7a9e'}}>PTS</div>
            </div>
          </div>
          <div style={{paddingLeft:42}}>
            <div style={{background:'#1c3352',borderRadius:3,height:4,overflow:'hidden'}}>
              <div style={{height:'100%',background:p.color,width:`${maxPts>0?Math.round(p.pts/maxPts*100):0}%`,transition:'width .5s'}}/>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div style={S.cardDark}>
      <div style={S.ct}>Progreso del Torneo</div>
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div style={{flex:1}}>
          <div style={{background:'#1c3352',borderRadius:4,height:8,overflow:'hidden'}}>
            <div style={{height:'100%',background:'#f0c040',borderRadius:4,width:`${pct}%`,transition:'width .5s'}}/>
          </div>
          <div style={{fontSize:11,color:'#4d7a9e',marginTop:5}}>{resultCount} de {total} partidos con resultado</div>
        </div>
        <div style={{fontSize:24,fontWeight:800,color:'#f0c040'}}>{pct}%</div>
      </div>
    </div>
  </div>
}

// ─── MATCHES TAB ──────────────────────────────────────────────────────────────
function MatchesTab({results,predictions,participants}){
  const [phase,setPhase]=useState('Fase de Grupos'); const [group,setGroup]=useState('A')
  const filtered=ALL_MATCHES.filter(m=>m.phase===phase&&(phase!=='Fase de Grupos'||m.group===group))
  return <div>
    <PhasePills current={phase} onChange={setPhase}/>
    {phase==='Fase de Grupos'&&<GroupPills current={group} onChange={setGroup}/>}
    {filtered.map(m=>{
      const result=results[m.id]; const counts={'1':0,'X':0,'2':0}
      participants.forEach(p=>{const pr=(predictions[p.id]||{})[m.id];if(pr)counts[pr]++})
      const total=participants.length; const tbd=isTBD(m.home)&&isTBD(m.away)
      const pts=PHASE_POINTS[m.phase]||3; const ptC=pts===10?'#f0c040':pts===7?'#c084fc':pts===5?'#4a9eff':'#4d7a9e'
      return <div key={m.id} style={{...S.mc,opacity:tbd?.5:1}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,minHeight:18}}>
          <span style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700,display:'flex',alignItems:'center',gap:4}}>
            {m.matchday?`JORNADA ${m.matchday}`:m.phase.toUpperCase()}
            <span style={{color:ptC,fontSize:10,fontWeight:800}}>{pts}pts</span>
          </span>
          {result&&<span style={{padding:'2px 9px',borderRadius:4,fontSize:11,fontWeight:700,background:'#1a3a1a',color:'#3ddc84'}}>{result==='X'?'EMPATE':short(result==='1'?m.home:m.away)}</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.home}</span>
          <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 6px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
          <span style={{flex:1,fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.away}</span>
        </div>
        {total>0&&<div style={{display:'flex',gap:4,marginTop:10}}>
          {['1','X','2'].map(opt=>{const cnt=counts[opt];const pct=total>0?Math.round(cnt/total*100):0;return(
            <div key={opt} style={{flex:1,textAlign:'center'}}>
              <div style={{background:'#1c3352',borderRadius:2,height:3,overflow:'hidden',marginBottom:3}}><div style={{height:'100%',background:'#4a9eff',width:`${pct}%`}}/></div>
              <div style={{fontSize:9,color:'#4d7a9e'}}>{opt}: {cnt} ({pct}%)</div>
            </div>
          )})}
        </div>}
      </div>
    })}
  </div>
}

// ─── PICKS TAB ────────────────────────────────────────────────────────────────
function PicksTab({predictions,participants,lockedPicks,onPick,onLockSection}){
  const [pid,setPid]=useState(participants[0]?.id||null)
  const [phase,setPhase]=useState('Fase de Grupos'); const [group,setGroup]=useState('A')
  const [onlyUndone,setOnlyUndone]=useState(false); const [lockModal,setLockModal]=useState(null)
  const selP=participants.find(p=>p.id===pid)||participants[0]
  const pp=pid?(predictions[pid]||{}):{};const predCount=Object.keys(pp).length
  const secMatches=ALL_MATCHES.filter(m=>m.phase===phase&&(phase!=='Fase de Grupos'||m.group===group))
  const curSec=phase==='Fase de Grupos'?`GRP-${group}`:KO_KEYS[phase]||phase
  const isLocked=pid&&lockedPicks[pid]&&lockedPicks[pid][curSec]
  const secPicks=secMatches.filter(m=>pp[m.id]).length
  const secLabel=phase==='Fase de Grupos'?`Grupo ${group}`:PHASE_LABELS[phase]||phase
  const filtered=ALL_MATCHES.filter(m=>{if(m.phase!==phase)return false;if(phase==='Fase de Grupos'&&m.group!==group)return false;if(onlyUndone&&pp[m.id])return false;return true})
  if(!participants.length) return <div style={{textAlign:'center',color:'#4d7a9e',padding:50,fontSize:13}}>Primero añade participantes en <b>⚙️ Admin</b></div>
  return <div>
    {lockModal&&<LockModal sectionLabel={secLabel} onConfirm={()=>{onLockSection(pid,lockModal);setLockModal(null)}} onCancel={()=>setLockModal(null)}/>}
    <div style={S.card}>
      <div style={S.ct}>¿Quién pronostica?</div>
      <select style={S.select} value={pid||''} onChange={e=>setPid(e.target.value)}>
        {participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      {selP&&<><div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
        <div style={{width:10,height:10,borderRadius:'50%',background:selP.color}}/>
        <div style={{flex:1,fontSize:12,color:'#4d7a9e'}}>{predCount}/{ALL_MATCHES.length} pronósticos totales</div>
        <div style={{fontSize:13,fontWeight:700,color:'#f0c040'}}>{Math.round(predCount/ALL_MATCHES.length*100)}%</div>
      </div>
      <div style={{background:'#1c3352',borderRadius:3,height:5,overflow:'hidden',marginTop:6}}>
        <div style={{height:'100%',background:selP.color,width:`${Math.round(predCount/ALL_MATCHES.length*100)}%`,transition:'width .4s'}}/>
      </div></>}
    </div>
    <PhasePills current={phase} onChange={setPhase}/>
    {phase==='Fase de Grupos'&&<GroupPills current={group} onChange={setGroup}/>}
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,padding:'8px 12px',background:'#0c1a2e',borderRadius:8,border:`1px solid ${isLocked?'#c084fc44':'#1c3352'}`}}>
      <div style={{fontSize:12,color:'#4d7a9e'}}>{secPicks}/{secMatches.length} picks en esta sección {isLocked&&<span style={{marginLeft:8,color:'#c084fc',fontWeight:700}}>🔒 BLOQUEADO</span>}</div>
      {!isLocked&&<label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:'#4d7a9e'}}><input type="checkbox" checked={onlyUndone} onChange={e=>setOnlyUndone(e.target.checked)}/> Sin pick</label>}
    </div>
    {isLocked&&<div style={{...S.cardDark,border:'1px solid #c084fc44',textAlign:'center',padding:'20px 14px',marginBottom:12}}>
      <div style={{fontSize:32,marginBottom:8}}>🔒</div>
      <div style={{fontSize:14,fontWeight:700,color:'#c084fc',marginBottom:4}}>Pronósticos Bloqueados</div>
      <div style={{fontSize:12,color:'#4d7a9e'}}>Tus picks para <b style={{color:'#d8eaf7'}}>{secLabel}</b> están confirmados.</div>
    </div>}
    {filtered.map(m=>{
      const pred=pp[m.id]; const opts=m.allowDraw?['1','X','2']:['1','2']
      const labels={'1':m.home,'X':'Empate','2':m.away}; const tbd=isTBD(m.home)||isTBD(m.away)
      const pts=PHASE_POINTS[m.phase]||3; const ptC=pts===10?'#f0c040':pts===7?'#c084fc':pts===5?'#4a9eff':'#4d7a9e'
      const locked=isLocked
      return <div key={m.id} style={{...S.mc,opacity:tbd?.4:1,borderColor:locked?'#c084fc22':pred?'#f0c04033':'#1c3352'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <span style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700,display:'flex',alignItems:'center',gap:4}}>{m.matchday?`JORNADA ${m.matchday}`:m.phase.toUpperCase()}<span style={{color:ptC,fontSize:10,fontWeight:800}}>{pts}pts</span></span>
          {pred&&<span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:locked?'#c084fc22':'#f0c04022',color:locked?'#c084fc':'#f0c040',border:`1px solid ${locked?'#c084fc44':'#f0c04044'}`}}>{locked?'🔒 ':''}{pred==='X'?'EMPATE':short(labels[pred])}</span>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
          <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700}}>{m.home}</span>
          <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 6px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
          <span style={{flex:1,fontSize:14,fontWeight:700}}>{m.away}</span>
        </div>
        {!locked&&<div style={{display:'flex',gap:6}}>
          {opts.map(opt=><button key={opt} disabled={tbd} onClick={()=>onPick(pid,m.id,pred===opt?null:opt)} style={{flex:1,padding:'8px 4px',borderRadius:7,border:'1px solid',borderColor:pred===opt?'#f0c040':'#1c3352',background:pred===opt?'#f0c040':'#111d30',color:pred===opt?'#050d10':'#4d7a9e',fontFamily:"'Rajdhani',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
            <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
            <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{opt==='X'?'Empate':short(labels[opt])}</span>
          </button>)}
        </div>}
        {locked&&<div style={{display:'flex',gap:6}}>
          {opts.map(opt=><div key={opt} style={{flex:1,padding:'8px 4px',borderRadius:7,border:'1px solid',borderColor:pred===opt?'#c084fc':'#1c3352',background:pred===opt?'#1a1a3a':'#0a0f1a',color:pred===opt?'#c084fc':'#2a4a6e',display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
            <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
            <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{opt==='X'?'Empate':short(labels[opt])}</span>
          </div>)}
        </div>}
      </div>
    })}
    {pid&&!isLocked&&secPicks>0&&<div style={{padding:'4px 0 16px'}}>
      <button style={{...S.btnLock,width:'100%',fontSize:14}} onClick={()=>setLockModal(curSec)}>🔒 Confirmar y bloquear picks — {secLabel}</button>
    </div>}
  </div>
}

// ─── ADMIN TAB ────────────────────────────────────────────────────────────────
function AdminTab({participants,results,predictions,lockedPicks,adminPin,updParticipants,updResults,updLockedPicks,updAdminPin,onReset}){
  const [sec,setSec]=useState('participants'); const [newName,setNewName]=useState('')
  const [adminUnlocked,setAdminUnlocked]=useState(false); const [showPin,setShowPin]=useState(false)
  const [resPhase,setResPhase]=useState('Fase de Grupos'); const [resGroup,setResGroup]=useState('A')
  const [newPin,setNewPin]=useState(''); const [confirmPin,setConfirmPin]=useState(''); const [pinMsg,setPinMsg]=useState(null)

  function addP(){if(!newName.trim())return;const np={id:Date.now().toString(),name:newName.trim(),color:COLORS[participants.length%COLORS.length]};updParticipants([...participants,np]);setNewName('')}
  function setResult(mid,val){const nr={...results};if(nr[mid]===val)delete nr[mid];else nr[mid]=val;updResults(nr)}
  function changePin(){if(newPin.length<4){setPinMsg({err:true,msg:'El PIN debe tener al menos 4 dígitos.'});return}if(newPin!==confirmPin){setPinMsg({err:true,msg:'Los PINs no coinciden.'});return}updAdminPin(newPin);setNewPin('');setConfirmPin('');setPinMsg({err:false,msg:'✅ PIN cambiado correctamente.'});setTimeout(()=>setPinMsg(null),3000)}
  function unlockSec(pid,sk){const nl={...lockedPicks};if(nl[pid])delete nl[pid][sk];updLockedPicks(nl)}

  const resFiltered=ALL_MATCHES.filter(m=>m.phase===resPhase&&(resPhase!=='Fase de Grupos'||m.group===resGroup))
  const doneInPhase=resFiltered.filter(m=>results[m.id]).length

  return <div>
    {showPin&&<PinModal title="ACCESO ADMIN" subtitle={`Solo el administrador puede registrar resultados.\nPIN por defecto: ${DEFAULT_PIN}`} storedPin={adminPin} onSuccess={()=>{setAdminUnlocked(true);setShowPin(false);setSec('results')}} onCancel={()=>setShowPin(false)}/>}
    <div style={{display:'flex',gap:8,marginBottom:14}}>
      {[['participants','👥 Jugadores'],['results','📊 Resultados'],['settings','⚙️ Config']].map(([id,label])=>(
        <button key={id} onClick={()=>{if(id==='results'&&!adminUnlocked)setShowPin(true);else setSec(id)}} style={{flex:1,padding:'9px 4px',borderRadius:8,border:'1px solid',borderColor:sec===id?'#f0c040':'#1c3352',background:sec===id?'#1a2a0a':'transparent',color:sec===id?'#f0c040':'#4d7a9e',fontFamily:"'Rajdhani',sans-serif",fontSize:11,fontWeight:700,cursor:'pointer'}}>
          {label}{id==='results'&&!adminUnlocked?' 🔐':''}
        </button>
      ))}
    </div>

    {sec==='participants'&&<>
      <div style={S.card}><div style={S.ct}>Añadir Participante</div>
        <div style={{display:'flex',gap:8}}>
          <input style={{...S.input,flex:1}} placeholder="Nombre del jugador" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addP()}/>
          <button style={S.btn} onClick={addP}>+</button>
        </div>
      </div>
      <div style={S.card}><div style={S.ct}>Participantes ({participants.length})</div>
        {!participants.length&&<div style={{textAlign:'center',color:'#4d7a9e',padding:'20px 0',fontSize:13}}>No hay participantes aún</div>}
        {participants.map(p=>{const ls=Object.keys(lockedPicks[p.id]||{}).filter(k=>lockedPicks[p.id][k]);return(
          <div key={p.id} style={{padding:'10px 0',borderBottom:'1px solid #1c3352'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:12,height:12,borderRadius:'50%',background:p.color,flexShrink:0}}/>
              <span style={{flex:1,fontSize:15,fontWeight:600}}>{p.name}</span>
              <span style={{fontSize:11,color:'#4d7a9e'}}>{Object.keys(predictions[p.id]||{}).length} picks</span>
              {ls.length>0&&<span style={{fontSize:11,color:'#c084fc'}}>🔒{ls.length}</span>}
              <button style={S.btnRed} onClick={()=>updParticipants(participants.filter(x=>x.id!==p.id))}>✕</button>
            </div>
            {ls.length>0&&adminUnlocked&&<div style={{paddingLeft:22,marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
              {ls.map(sk=><button key={sk} onClick={()=>unlockSec(p.id,sk)} style={{fontSize:10,padding:'3px 8px',borderRadius:4,border:'1px solid #c084fc44',background:'transparent',color:'#c084fc',cursor:'pointer',fontFamily:"'Rajdhani',sans-serif"}}>🔓 {sk}</button>)}
            </div>}
          </div>
        )})}
      </div>
      <div style={{textAlign:'center'}}><button style={{background:'transparent',color:'#e63946',border:'1px solid #e63946',borderRadius:6,padding:'8px 14px',fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,cursor:'pointer'}} onClick={onReset}>🗑️ Reiniciar todos los datos</button></div>
    </>}

    {sec==='results'&&adminUnlocked&&<>
      <div style={{...S.cardDark,border:'1px solid #3ddc8433'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}><span style={{fontSize:16}}>🔓</span><span style={{fontSize:13,color:'#3ddc84',fontWeight:700}}>Acceso de administrador activo</span></div>
        <div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.8}}><b style={{color:'#d8eaf7'}}>1</b> = gana local · <b style={{color:'#d8eaf7'}}>X</b> = empate · <b style={{color:'#d8eaf7'}}>2</b> = gana visitante<br/><span style={{fontSize:11}}>En eliminatorias: registra al equipo que avanza.</span></div>
      </div>
      <PhasePills current={resPhase} onChange={setResPhase}/>
      {resPhase==='Fase de Grupos'&&<GroupPills current={resGroup} onChange={setResGroup}/>}
      <div style={{fontSize:11,color:'#4d7a9e',marginBottom:10,textAlign:'right'}}>{doneInPhase}/{resFiltered.length} registrados</div>
      {resFiltered.map(m=>{
        const result=results[m.id]; const opts=m.allowDraw?['1','X','2']:['1','2']
        const labels={'1':m.home,'X':'Empate','2':m.away}; const tbd=isTBD(m.home)&&isTBD(m.away)
        const pts=PHASE_POINTS[m.phase]||3; const ptC=pts===10?'#f0c040':pts===7?'#c084fc':pts===5?'#4a9eff':'#4d7a9e'
        return <div key={m.id} style={{...S.mc,opacity:tbd?.4:1,borderColor:result?'#3ddc8433':'#1c3352'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <span style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700,display:'flex',alignItems:'center',gap:4}}>{m.matchday?`J${m.matchday}`:m.phase.toUpperCase()}<span style={{color:ptC,fontSize:10,fontWeight:800}}>{pts}pts</span></span>
            {result&&<span style={{padding:'2px 9px',borderRadius:4,fontSize:11,fontWeight:700,background:'#1a3a1a',color:'#3ddc84'}}>✓ {result==='X'?'EMPATE':short(labels[result])}</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
            <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700}}>{m.home}</span>
            <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 5px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
            <span style={{flex:1,fontSize:14,fontWeight:700}}>{m.away}</span>
          </div>
          <div style={{display:'flex',gap:6}}>
            {opts.map(opt=><button key={opt} disabled={tbd} onClick={()=>setResult(m.id,opt)} style={{flex:1,padding:'9px 4px',borderRadius:7,border:'1px solid',borderColor:result===opt?'#3ddc84':'#1c3352',background:result===opt?'#1a3a1a':'#111d30',color:result===opt?'#3ddc84':'#4d7a9e',fontFamily:"'Rajdhani',sans-serif",fontSize:12,fontWeight:700,cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
              <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
              <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{opt==='X'?'Empate':short(labels[opt])}</span>
            </button>)}
          </div>
        </div>
      })}
    </>}

    {sec==='settings'&&<>
      <div style={S.card}>
        <div style={S.ct}>🔐 PIN del Administrador</div>
        <div style={{fontSize:12,color:'#4d7a9e',marginBottom:12,lineHeight:1.6}}>Este PIN protege la sección de resultados. Solo tú debes conocerlo.<br/><b style={{color:'#f0c040'}}>PIN por defecto: {DEFAULT_PIN}</b> — ¡Cámbialo ya!</div>
        <div style={{marginBottom:8}}><div style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700,marginBottom:4}}>NUEVO PIN (mín. 4 dígitos)</div><input style={S.input} type="password" inputMode="numeric" placeholder="Nuevo PIN" value={newPin} onChange={e=>setNewPin(e.target.value)}/></div>
        <div style={{marginBottom:12}}><div style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700,marginBottom:4}}>CONFIRMAR NUEVO PIN</div><input style={S.input} type="password" inputMode="numeric" placeholder="Repite el PIN" value={confirmPin} onChange={e=>setConfirmPin(e.target.value)}/></div>
        {pinMsg&&<div style={{fontSize:12,color:pinMsg.err?'#e63946':'#3ddc84',marginBottom:10,fontWeight:600}}>{pinMsg.msg}</div>}
        <button style={{...S.btn,width:'100%'}} onClick={changePin}>Guardar nuevo PIN</button>
      </div>
      <div style={S.cardDark}>
        <div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.9}}>
          <b style={{color:'#d8eaf7'}}>💡 Cómo funciona:</b><br/>
          • Solo el admin (tú) puede registrar resultados con el PIN<br/>
          • Cada amigo elige su nombre y pone sus picks<br/>
          • Al confirmar, sus picks se bloquean para siempre<br/>
          • Puedes desbloquear secciones desde 👥 Jugadores (si estás autenticado)<br/>
          • Todos ven la tabla y los partidos en tiempo real
        </div>
      </div>
    </>}
  </div>
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [loading,setLoading]=useState(true)
  const [participants,setParticipants]=useState([])
  const [results,setResults]=useState({})
  const [predictions,setPredictions]=useState({})
  const [lockedPicks,setLockedPicks]=useState({})
  const [adminPin,setAdminPin]=useState(DEFAULT_PIN)
  const [tab,setTab]=useState('board')

  const board=useMemo(()=>calcBoard(participants,predictions,results),[participants,predictions,results])
  const resultCount=Object.keys(results).length

  // 🔥 Firebase real-time listener — todos ven los mismos datos al instante
  useEffect(()=>{
    const dbRef=ref(db,DB_PATH)
    const unsub=onValue(dbRef,(snapshot)=>{
      const data=snapshot.val()
      if(data){
        if(data.participants) setParticipants(data.participants)
        if(data.results)      setResults(data.results)
        if(data.predictions)  setPredictions(data.predictions)
        if(data.lockedPicks)  setLockedPicks(data.lockedPicks)
        if(data.adminPin)     setAdminPin(data.adminPin)
      }
      setLoading(false)
    },(err)=>{console.error('Firebase error:',err);setLoading(false)})
    return ()=>unsub()
  },[])

  // 🔥 Guarda en Firebase — todos ven el cambio inmediatamente
  function save(data){ set(ref(db,DB_PATH),data).catch(e=>console.error('Save error:',e)) }
  function bundle(o={}){ return{participants,results,predictions,lockedPicks,adminPin,...o} }

  function updP(v){setParticipants(v);save(bundle({participants:v}))}
  function updR(v){setResults(v);save(bundle({results:v}))}
  function updPreds(v){setPredictions(v);save(bundle({predictions:v}))}
  function updLocked(v){setLockedPicks(v);save(bundle({lockedPicks:v}))}
  function updPin(v){setAdminPin(v);save(bundle({adminPin:v}))}

  function handlePick(pid,mid,val){
    const m=ALL_MATCHES.find(x=>x.id===mid); if(!m)return
    const sk=secKey(m); if(lockedPicks[pid]&&lockedPicks[pid][sk])return
    const pp={...(predictions[pid]||{})}; if(val===null)delete pp[mid];else pp[mid]=val
    updPreds({...predictions,[pid]:pp})
  }

  function handleLock(pid,sk){
    const nl={...lockedPicks,[pid]:{...(lockedPicks[pid]||{}),[sk]:true}}
    updLocked(nl)
  }

  function handleReset(){
    if(!window.confirm('¿Seguro que quieres borrar todos los datos?'))return
    const clean={participants:[],results:{},predictions:{},lockedPicks:{},adminPin:DEFAULT_PIN}
    setParticipants([]);setResults({});setPredictions({});setLockedPicks({});setAdminPin(DEFAULT_PIN)
    save(clean)
  }

  if(loading) return(
    <div style={{...S.app,alignItems:'center',justifyContent:'center',fontSize:18,color:'#f0c040'}}>
      ⚽ Cargando…
    </div>
  )

  const tabs=[{id:'board',icon:'🏆',label:'TABLA'},{id:'matches',icon:'⚽',label:'PARTIDOS'},{id:'picks',icon:'🎯',label:'MIS PICKS'},{id:'admin',icon:'⚙️',label:'ADMIN'}]

  return(
    <div style={S.app}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:#07111f}::-webkit-scrollbar-thumb{background:#1c3352;border-radius:2px}button:active{transform:scale(.97)}input[type=checkbox]{accent-color:#f0c040}`}</style>
      <div style={S.header}>
        <div style={{fontSize:32}}>🏆</div>
        <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:3,color:'#f0c040',lineHeight:1}}>POLLA MUNDIALISTA</div>
          <div style={{fontSize:10,letterSpacing:2,color:'#4d7a9e',marginTop:2}}>🇲🇽 🇨🇦 🇺🇸 FIFA WORLD CUP 2026</div>
        </div>
        <div style={{marginLeft:'auto',textAlign:'right'}}>
          <div style={{fontSize:20,fontWeight:700,lineHeight:1}}>{resultCount}<span style={{fontSize:12,color:'#4d7a9e'}}>/{ALL_MATCHES.length}</span></div>
          <div style={{fontSize:9,letterSpacing:1,color:'#4d7a9e'}}>JUGADOS</div>
        </div>
      </div>
      <div style={S.content}>
        {tab==='board'  &&<BoardTab board={board} resultCount={resultCount}/>}
        {tab==='matches'&&<MatchesTab results={results} predictions={predictions} participants={participants}/>}
        {tab==='picks'  &&<PicksTab predictions={predictions} participants={participants} lockedPicks={lockedPicks} onPick={handlePick} onLockSection={handleLock}/>}
        {tab==='admin'  &&<AdminTab participants={participants} results={results} predictions={predictions} lockedPicks={lockedPicks} adminPin={adminPin} updParticipants={updP} updResults={updR} updLockedPicks={updLocked} updAdminPin={updPin} onReset={handleReset}/>}
      </div>
      <div style={S.tabbar}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:'10px 4px 8px',display:'flex',flexDirection:'column',alignItems:'center',gap:2,border:'none',borderTop:`2px solid ${tab===t.id?'#f0c040':'transparent'}`,background:'transparent',color:tab===t.id?'#f0c040':'#4d7a9e',cursor:'pointer',transition:'color .15s'}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
