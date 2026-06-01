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
try {
  const fbApp = initializeApp(firebaseConfig)
  db = getDatabase(fbApp)
} catch(e) {
  console.error('Firebase init error:', e.message)
}

const DEFAULT_PIN  = '1234'
const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const PHASES = ['Fase de Grupos','Ronda de 32','Octavos de Final','Cuartos de Final','Semifinales','Tercer Puesto','Gran Final']
const PHASE_LABELS = {
  'Fase de Grupos':'Grupos','Ronda de 32':'1/32','Octavos de Final':'Octavos',
  'Cuartos de Final':'Cuartos','Semifinales':'Semis','Tercer Puesto':'3er P.','Gran Final':'Final'
}
const PHASE_POINTS = {
  'Fase de Grupos':3,'Ronda de 32':5,'Octavos de Final':5,'Cuartos de Final':5,
  'Semifinales':7,'Tercer Puesto':7,'Gran Final':10
}
const COLORS = ['#f0c040','#4ade80','#60a5fa','#f87171','#c084fc','#fb923c','#34d399','#a78bfa','#f472b6','#facc15','#38bdf8','#e879f9']
const KO_KEYS = {'Ronda de 32':'R32','Octavos de Final':'R16','Cuartos de Final':'QF','Semifinales':'SF','Tercer Puesto':'3RD','Gran Final':'FIN'}

// Team data: [name, flag_unicode_escape]
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

function tl(code, name){ return code + ' ' + name }

function genMatches(){
  const ms = []
  const mdP = [[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]]
  GROUPS.forEach(g => {
    const t = TEAMS[g]
    mdP.forEach((pairs, md) => {
      pairs.forEach(([i,j]) => {
        ms.push({ id:'G'+g+i+j, phase:'Fase de Grupos', group:g, matchday:md+1,
          home:tl(t[i][1],t[i][0]), away:tl(t[j][1],t[j][0]), allowDraw:true })
      })
    })
  })
  const ko = [['Ronda de 32',16,'R32'],['Octavos de Final',8,'R16'],['Cuartos de Final',4,'QF'],
    ['Semifinales',2,'SF'],['Tercer Puesto',1,'3RD'],['Gran Final',1,'FIN']]
  ko.forEach(([phase,count,px]) => {
    for(let i=1;i<=count;i++) ms.push({id:px+(count>1?i:''),phase,home:'Por definir',away:'Por definir',allowDraw:false})
  })
  return ms
}

const ALL_MATCHES = genMatches()

function calcBoard(participants, predictions, results){
  return [...participants].map(p => {
    const pp = predictions[p.id]||{}
    let pts=0, correct=0, played=0
    ALL_MATCHES.forEach(m => {
      if(pp[m.id] && results[m.id]){
        played++
        if(pp[m.id]===results[m.id]){ pts += PHASE_POINTS[m.phase]||3; correct++ }
      }
    })
    return {...p, pts, correct, played, predCount:Object.keys(pp).length}
  }).sort((a,b) => b.pts-a.pts || b.correct-a.correct)
}

const isTBD = s => !s || s==='Por definir'
function shortTeam(s){
  if(!s||s==='Por definir') return 'TBD'
  const parts = s.trim().split(' ')
  return parts.length > 1 ? parts[parts.length-1] : parts[0]
}
function secKey(m){ return m.phase==='Fase de Grupos' ? 'GRP-'+m.group : (KO_KEYS[m.phase]||m.phase) }

// ── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  app:     { background:'#07111f', minHeight:'100vh', color:'#d8eaf7', fontFamily:"'Rajdhani',system-ui,sans-serif", display:'flex', flexDirection:'column' },
  header:  { background:'linear-gradient(135deg,#0a1628,#0e2040,#0a1628)', borderBottom:'2px solid #f0c040', padding:'13px 16px', display:'flex', alignItems:'center', gap:12, flexShrink:0 },
  content: { flex:1, overflowY:'auto', padding:14, paddingBottom:84 },
  tabbar:  { position:'fixed', bottom:0, left:0, right:0, background:'#0a1628', borderTop:'1px solid #1c3352', display:'flex', zIndex:50 },
  card:    { background:'#0c1a2e', border:'1px solid #1c3352', borderRadius:10, padding:14, marginBottom:12 },
  cardD:   { background:'#0a1528', border:'1px solid #1c3352', borderRadius:10, padding:14, marginBottom:12 },
  ct:      { fontSize:11, letterSpacing:2, color:'#6d9bbf', marginBottom:10, textTransform:'uppercase', fontWeight:700 },
  input:   { background:'#111d30', border:'1px solid #1c3352', borderRadius:6, color:'#d8eaf7', padding:'9px 12px', fontSize:14, fontFamily:"'Rajdhani',sans-serif", fontWeight:600, width:'100%', outline:'none', boxSizing:'border-box' },
  select:  { background:'#111d30', border:'1px solid #1c3352', borderRadius:6, color:'#d8eaf7', padding:'9px 12px', fontSize:14, fontFamily:"'Rajdhani',sans-serif", fontWeight:600, width:'100%', outline:'none', boxSizing:'border-box' },
  btn:     { background:'#f0c040', color:'#050d10', border:'none', borderRadius:6, padding:'10px 18px', fontWeight:700, fontFamily:"'Rajdhani',sans-serif", fontSize:13, letterSpacing:1, cursor:'pointer' },
  btnRed:  { background:'#e63946', color:'#fff', border:'none', borderRadius:6, padding:'8px 14px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:12, cursor:'pointer' },
  btnOut:  { background:'transparent', color:'#4d7a9e', border:'1px solid #1c3352', borderRadius:6, padding:'8px 14px', fontFamily:"'Rajdhani',sans-serif", fontWeight:600, fontSize:12, cursor:'pointer' },
  btnLock: { background:'#1a1a3a', color:'#c084fc', border:'1px solid #c084fc66', borderRadius:6, padding:'10px 18px', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer' },
  mc:      { background:'#0c1a2e', border:'1px solid #1c3352', borderRadius:8, padding:'12px 14px', marginBottom:8 },
}

// ── SHARED COMPONENTS ───────────────────────────────────────────────────────
function PhasePills({current, onChange}){
  return (
    <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:8,marginBottom:10,scrollbarWidth:'none'}}>
      {PHASES.map(p => (
        <button key={p} onClick={()=>onChange(p)} style={{
          whiteSpace:'nowrap', padding:'5px 11px', borderRadius:20, border:'1px solid',
          borderColor: p===current?'#f0c040':'#1c3352',
          background: p===current?'#f0c040':'transparent',
          color: p===current?'#050d10':'#4d7a9e',
          fontSize:11, fontWeight:700, fontFamily:"'Rajdhani',sans-serif", cursor:'pointer',
          display:'flex', flexDirection:'column', alignItems:'center'
        }}>
          <span>{PHASE_LABELS[p]}</span>
          <span style={{fontSize:9,opacity:.8}}>{PHASE_POINTS[p]}pts</span>
        </button>
      ))}
    </div>
  )
}

function GroupPills({current, onChange}){
  return (
    <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:6,marginBottom:10,scrollbarWidth:'none'}}>
      {GROUPS.map(g => (
        <button key={g} onClick={()=>onChange(g)} style={{
          width:34, height:34, borderRadius:6, border:'1px solid', flexShrink:0,
          borderColor: g===current?'#4a9eff':'#1c3352',
          background: g===current?'#1e3a5f':'transparent',
          color: g===current?'#4a9eff':'#4d7a9e',
          fontSize:13, fontWeight:700, fontFamily:"'Rajdhani',sans-serif", cursor:'pointer'
        }}>{g}</button>
      ))}
    </div>
  )
}

function PinModal({title, subtitle, onSuccess, onCancel, storedPin}){
  const [pin,setPin] = useState('')
  const [err,setErr] = useState(false)
  function check(){ if(pin===storedPin){setErr(false);onSuccess()}else{setErr(true);setPin('')} }
  return (
    <div style={{position:'fixed',inset:0,background:'#000000cc',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
      <div style={{background:'#0c1a2e',border:'1px solid #1c3352',borderRadius:14,padding:28,width:'100%',maxWidth:320,textAlign:'center'}}>
        <div style={{fontSize:36,marginBottom:12}}>{'\uD83D\uDD10'}</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:2,color:'#f0c040',marginBottom:6}}>{title}</div>
        <div style={{fontSize:13,color:'#4d7a9e',marginBottom:20,lineHeight:1.5}}>{subtitle}</div>
        <input
          style={{...S.input,textAlign:'center',fontSize:22,letterSpacing:8,marginBottom:10,border:'1px solid '+(err?'#e63946':'#1c3352')}}
          type="password" inputMode="numeric" maxLength={8} placeholder="****"
          value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&check()} autoFocus
        />
        {err && <div style={{color:'#e63946',fontSize:12,marginBottom:10}}>PIN incorrecto. Intentalo de nuevo.</div>}
        <div style={{display:'flex',gap:8,marginTop:8}}>
          {onCancel && <button style={{...S.btnOut,flex:1}} onClick={onCancel}>Cancelar</button>}
          <button style={{...S.btn,flex:1}} onClick={check}>Entrar</button>
        </div>
      </div>
    </div>
  )
}

function LockModal({sectionLabel, onConfirm, onCancel}){
  return (
    <div style={{position:'fixed',inset:0,background:'#000000cc',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:20}}>
      <div style={{background:'#0c1a2e',border:'1px solid #c084fc66',borderRadius:14,padding:28,width:'100%',maxWidth:340,textAlign:'center'}}>
        <div style={{fontSize:40,marginBottom:12}}>{'\uD83D\uDD12'}</div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:2,color:'#c084fc',marginBottom:10}}>Bloquear Pronosticos</div>
        <div style={{fontSize:13,color:'#d8eaf7',marginBottom:6,lineHeight:1.6}}>
          Confirmas tus picks para <b style={{color:'#f0c040'}}>{sectionLabel}</b>?
        </div>
        <div style={{fontSize:12,color:'#e63946',marginBottom:20,lineHeight:1.6,background:'#e6394610',border:'1px solid #e6394633',borderRadius:8,padding:'10px 14px'}}>
          Esta accion es irreversible. Una vez bloqueados no podras modificar tus picks.
        </div>
        <div style={{display:'flex',gap:8}}>
          <button style={{...S.btnOut,flex:1}} onClick={onCancel}>Cancelar</button>
          <button style={{...S.btnLock,flex:1}} onClick={onConfirm}>{'\uD83D\uDD12'} Confirmar</button>
        </div>
      </div>
    </div>
  )
}

// ── BOARD TAB ───────────────────────────────────────────────────────────────
function BoardTab({board, resultCount}){
  const total = ALL_MATCHES.length
  const pct   = total>0 ? Math.round(resultCount/total*100) : 0
  const maxPts = board[0]?.pts || 1
  const medals = ['\uD83E\uDD47','\uD83E\uDD48','\uD83E\uDD49']
  return (
    <div>
      <div style={{...S.cardD,marginBottom:12}}>
        <div style={S.ct}>Sistema de Puntuacion</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {[['Grupos','3pts','#4d7a9e'],['1/32 - Octavos - Cuartos','5pts','#4a9eff'],['Semifinales','7pts','#c084fc'],['Gran Final','10pts','#f0c040']].map(([ph,p,c])=>(
            <div key={ph} style={{padding:'4px 10px',borderRadius:6,background:c+'18',border:'1px solid '+c+'33',fontSize:11,color:c}}><b>{p}</b> - {ph}</div>
          ))}
        </div>
      </div>
      <div style={S.card}>
        <div style={S.ct}>Clasificacion General</div>
        {!board.length && (
          <div style={{textAlign:'center',color:'#4d7a9e',padding:'30px 0',fontSize:13}}>
            Aun no hay participantes. Ve a Admin para anadirlos.
          </div>
        )}
        {board.map((p,i) => (
          <div key={p.id} style={{padding:'11px 0',borderBottom:'1px solid #1c3352'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:5}}>
              <div style={{fontSize:18,width:32,textAlign:'center',fontWeight:700,color:['#f0c040','#c0c0c0','#cd7f32'][i]||'#4d7a9e'}}>{medals[i]||i+1}</div>
              <div style={{width:11,height:11,borderRadius:'50%',background:p.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:16,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:i===0?'#f0c040':'#d8eaf7'}}>{p.name}</div>
                <div style={{fontSize:10,color:'#4d7a9e'}}>{p.correct}/{p.played} aciertos - {p.predCount}/{total} pronosticos</div>
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
            <div style={{fontSize:11,color:'#4d7a9e',marginTop:5}}>{resultCount} de {total} partidos con resultado</div>
          </div>
          <div style={{fontSize:24,fontWeight:800,color:'#f0c040'}}>{pct}%</div>
        </div>
      </div>
    </div>
  )
}

// ── MATCHES TAB ─────────────────────────────────────────────────────────────
function MatchesTab({results, predictions, participants}){
  const [phase,setPhase] = useState('Fase de Grupos')
  const [group,setGroup] = useState('A')
  const filtered = ALL_MATCHES.filter(m => m.phase===phase && (phase!=='Fase de Grupos'||m.group===group))
  return (
    <div>
      <PhasePills current={phase} onChange={setPhase}/>
      {phase==='Fase de Grupos' && <GroupPills current={group} onChange={setGroup}/>}
      {filtered.map(m => {
        const result = results[m.id]
        const counts = {'1':0,'X':0,'2':0}
        participants.forEach(p => { const pr=(predictions[p.id]||{})[m.id]; if(pr) counts[pr]++ })
        const total = participants.length
        const tbd = isTBD(m.home) && isTBD(m.away)
        const pts  = PHASE_POINTS[m.phase]||3
        const ptC  = pts===10?'#f0c040':pts===7?'#c084fc':pts===5?'#4a9eff':'#4d7a9e'
        return (
          <div key={m.id} style={{...S.mc, opacity:tbd?.5:1}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8,minHeight:18}}>
              <span style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700}}>
                {m.matchday ? 'JORNADA '+m.matchday : m.phase.toUpperCase()}
                <span style={{color:ptC,fontSize:10,fontWeight:800,marginLeft:6}}>{pts}pts</span>
              </span>
              {result && (
                <span style={{padding:'2px 9px',borderRadius:4,fontSize:11,fontWeight:700,background:'#1a3a1a',color:'#3ddc84'}}>
                  {result==='X'?'EMPATE':shortTeam(result==='1'?m.home:m.away)}
                </span>
              )}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.home}</span>
              <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 6px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
              <span style={{flex:1,fontSize:14,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.away}</span>
            </div>
            {total>0 && (
              <div style={{display:'flex',gap:4,marginTop:10}}>
                {['1','X','2'].map(opt => {
                  const cnt = counts[opt]; const pct2 = total>0?Math.round(cnt/total*100):0
                  return (
                    <div key={opt} style={{flex:1,textAlign:'center'}}>
                      <div style={{background:'#1c3352',borderRadius:2,height:3,overflow:'hidden',marginBottom:3}}>
                        <div style={{height:'100%',background:'#4a9eff',width:pct2+'%'}}/>
                      </div>
                      <div style={{fontSize:9,color:'#4d7a9e'}}>{opt}: {cnt} ({pct2}%)</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── PICKS TAB ───────────────────────────────────────────────────────────────
function PicksTab({predictions, participants, lockedPicks, onPick, onLockSection}){
  const [pid,setPid]           = useState(participants[0]?.id||null)
  const [phase,setPhase]       = useState('Fase de Grupos')
  const [group,setGroup]       = useState('A')
  const [onlyUndone,setOnly]   = useState(false)
  const [lockModal,setLockModal]= useState(null)

  const selP = participants.find(p=>p.id===pid)||participants[0]
  const pp   = pid ? (predictions[pid]||{}) : {}
  const predCount = Object.keys(pp).length
  const secMatches = ALL_MATCHES.filter(m => m.phase===phase && (phase!=='Fase de Grupos'||m.group===group))
  const curSec  = phase==='Fase de Grupos' ? 'GRP-'+group : (KO_KEYS[phase]||phase)
  const isLocked = !!(pid && lockedPicks[pid] && lockedPicks[pid][curSec])
  const secPicks = secMatches.filter(m=>pp[m.id]).length
  const secLabel = phase==='Fase de Grupos' ? 'Grupo '+group : (PHASE_LABELS[phase]||phase)
  const filtered = ALL_MATCHES.filter(m => {
    if(m.phase!==phase) return false
    if(phase==='Fase de Grupos'&&m.group!==group) return false
    if(onlyUndone&&pp[m.id]) return false
    return true
  })

  if(!participants.length) return (
    <div style={{textAlign:'center',color:'#4d7a9e',padding:50,fontSize:13}}>
      Primero anade participantes en <b>Admin</b>
    </div>
  )

  return (
    <div>
      {lockModal && (
        <LockModal
          sectionLabel={secLabel}
          onConfirm={()=>{ onLockSection(pid,lockModal); setLockModal(null) }}
          onCancel={()=>setLockModal(null)}
        />
      )}

      <div style={S.card}>
        <div style={S.ct}>Quien pronostica?</div>
        <select style={S.select} value={pid||''} onChange={e=>setPid(e.target.value)}>
          {participants.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {selP && (
          <>
            <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
              <div style={{width:10,height:10,borderRadius:'50%',background:selP.color}}/>
              <div style={{flex:1,fontSize:12,color:'#4d7a9e'}}>{predCount}/{ALL_MATCHES.length} pronosticos totales</div>
              <div style={{fontSize:13,fontWeight:700,color:'#f0c040'}}>{Math.round(predCount/ALL_MATCHES.length*100)}%</div>
            </div>
            <div style={{background:'#1c3352',borderRadius:3,height:5,overflow:'hidden',marginTop:6}}>
              <div style={{height:'100%',background:selP.color,width:Math.round(predCount/ALL_MATCHES.length*100)+'%',transition:'width .4s'}}/>
            </div>
          </>
        )}
      </div>

      <PhasePills current={phase} onChange={setPhase}/>
      {phase==='Fase de Grupos' && <GroupPills current={group} onChange={setGroup}/>}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,padding:'8px 12px',background:'#0c1a2e',borderRadius:8,border:'1px solid '+(isLocked?'#c084fc44':'#1c3352')}}>
        <div style={{fontSize:12,color:'#4d7a9e'}}>
          {secPicks}/{secMatches.length} picks en esta seccion
          {isLocked && <span style={{marginLeft:8,color:'#c084fc',fontWeight:700}}>{'\uD83D\uDD12'} BLOQUEADO</span>}
        </div>
        {!isLocked && (
          <label style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:12,color:'#4d7a9e'}}>
            <input type="checkbox" checked={onlyUndone} onChange={e=>setOnly(e.target.checked)}/> Sin pick
          </label>
        )}
      </div>

      {isLocked && (
        <div style={{...S.cardD,border:'1px solid #c084fc44',textAlign:'center',padding:'20px 14px',marginBottom:12}}>
          <div style={{fontSize:32,marginBottom:8}}>{'\uD83D\uDD12'}</div>
          <div style={{fontSize:14,fontWeight:700,color:'#c084fc',marginBottom:4}}>Pronosticos Bloqueados</div>
          <div style={{fontSize:12,color:'#4d7a9e'}}>Tus picks para <b style={{color:'#d8eaf7'}}>{secLabel}</b> estan confirmados.</div>
        </div>
      )}

      {filtered.map(m => {
        const pred   = pp[m.id]
        const opts   = m.allowDraw ? ['1','X','2'] : ['1','2']
        const labels = {'1':m.home,'X':'Empate','2':m.away}
        const tbd    = isTBD(m.home)||isTBD(m.away)
        const pts    = PHASE_POINTS[m.phase]||3
        const ptC    = pts===10?'#f0c040':pts===7?'#c084fc':pts===5?'#4a9eff':'#4d7a9e'
        const locked = isLocked
        return (
          <div key={m.id} style={{...S.mc, opacity:tbd?.4:1, borderColor:locked?'#c084fc22':pred?'#f0c04033':'#1c3352'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <span style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700}}>
                {m.matchday ? 'JORNADA '+m.matchday : m.phase.toUpperCase()}
                <span style={{color:ptC,fontSize:10,fontWeight:800,marginLeft:6}}>{pts}pts</span>
              </span>
              {pred && (
                <span style={{padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:700,background:locked?'#c084fc22':'#f0c04022',color:locked?'#c084fc':'#f0c040',border:'1px solid '+(locked?'#c084fc44':'#f0c04044')}}>
                  {locked?'\uD83D\uDD12 ':''}{pred==='X'?'EMPATE':shortTeam(labels[pred])}
                </span>
              )}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
              <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700}}>{m.home}</span>
              <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 6px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
              <span style={{flex:1,fontSize:14,fontWeight:700}}>{m.away}</span>
            </div>
            {!locked && (
              <div style={{display:'flex',gap:6}}>
                {opts.map(opt => (
                  <button key={opt} disabled={tbd} onClick={()=>onPick(pid,m.id,pred===opt?null:opt)} style={{
                    flex:1, padding:'8px 4px', borderRadius:7, border:'1px solid',
                    borderColor: pred===opt?'#f0c040':'#1c3352',
                    background:  pred===opt?'#f0c040':'#111d30',
                    color:       pred===opt?'#050d10':'#4d7a9e',
                    fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, cursor:'pointer',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:1
                  }}>
                    <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
                    <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {opt==='X'?'Empate':shortTeam(labels[opt])}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {locked && (
              <div style={{display:'flex',gap:6}}>
                {opts.map(opt => (
                  <div key={opt} style={{
                    flex:1, padding:'8px 4px', borderRadius:7, border:'1px solid',
                    borderColor: pred===opt?'#c084fc':'#1c3352',
                    background:  pred===opt?'#1a1a3a':'#0a0f1a',
                    color:       pred===opt?'#c084fc':'#2a4a6e',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:1
                  }}>
                    <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
                    <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {opt==='X'?'Empate':shortTeam(labels[opt])}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {pid && !isLocked && secPicks>0 && (
        <div style={{padding:'4px 0 16px'}}>
          <button style={{...S.btnLock,width:'100%',fontSize:14}} onClick={()=>setLockModal(curSec)}>
            {'\uD83D\uDD12'} Confirmar y bloquear picks de {secLabel}
          </button>
        </div>
      )}
    </div>
  )
}

// ── ADMIN TAB ───────────────────────────────────────────────────────────────
function AdminTab({participants, results, predictions, lockedPicks, adminPin, updParticipants, updResults, updLockedPicks, updAdminPin, onReset}){
  const [sec,setSec]             = useState('participants')
  const [newName,setNewName]     = useState('')
  const [adminUnlocked,setAdminU]= useState(false)
  const [showPin,setShowPin]     = useState(false)
  const [resPhase,setResPhase]   = useState('Fase de Grupos')
  const [resGroup,setResGroup]   = useState('A')
  const [newPin,setNewPin]       = useState('')
  const [confirmPin,setConfirmPin]=useState('')
  const [pinMsg,setPinMsg]       = useState(null)

  function addP(){
    if(!newName.trim()) return
    const np = {id:Date.now().toString(), name:newName.trim(), color:COLORS[participants.length%COLORS.length]}
    updParticipants([...participants, np])
    setNewName('')
  }

  function setResult(mid, val){
    const nr = {...results}
    if(nr[mid]===val) delete nr[mid]; else nr[mid]=val
    updResults(nr)
  }

  function changePin(){
    if(newPin.length<4){ setPinMsg({err:true,msg:'El PIN debe tener al menos 4 digitos.'}); return }
    if(newPin!==confirmPin){ setPinMsg({err:true,msg:'Los PINs no coinciden.'}); return }
    updAdminPin(newPin); setNewPin(''); setConfirmPin('')
    setPinMsg({err:false,msg:'PIN cambiado correctamente.'})
    setTimeout(()=>setPinMsg(null), 3000)
  }

  function unlockSec(pid, sk){
    const nl = {...lockedPicks}
    if(nl[pid]) delete nl[pid][sk]
    updLockedPicks(nl)
  }

  const resFiltered  = ALL_MATCHES.filter(m => m.phase===resPhase && (resPhase!=='Fase de Grupos'||m.group===resGroup))
  const doneInPhase  = resFiltered.filter(m=>results[m.id]).length

  return (
    <div>
      {showPin && (
        <PinModal
          title="ACCESO ADMIN"
          subtitle={'Solo el administrador puede registrar resultados.\nPIN por defecto: '+DEFAULT_PIN}
          storedPin={adminPin}
          onSuccess={()=>{ setAdminU(true); setShowPin(false); setSec('results') }}
          onCancel={()=>setShowPin(false)}
        />
      )}

      <div style={{display:'flex',gap:8,marginBottom:14}}>
        {[['participants','\uD83D\uDC65 Jugadores'],['results','\uD83D\uDCCA Resultados'],['settings','\u2699\uFE0F Config']].map(([id,label]) => (
          <button key={id} onClick={()=>{ if(id==='results'&&!adminUnlocked) setShowPin(true); else setSec(id) }} style={{
            flex:1, padding:'9px 4px', borderRadius:8, border:'1px solid',
            borderColor: sec===id?'#f0c040':'#1c3352',
            background:  sec===id?'#1a2a0a':'transparent',
            color:       sec===id?'#f0c040':'#4d7a9e',
            fontFamily:"'Rajdhani',sans-serif", fontSize:11, fontWeight:700, cursor:'pointer'
          }}>
            {label}{id==='results'&&!adminUnlocked?' \uD83D\uDD10':''}
          </button>
        ))}
      </div>

      {/* ── JUGADORES ── */}
      {sec==='participants' && (
        <>
          <div style={S.card}>
            <div style={S.ct}>Anadir Participante</div>
            <div style={{display:'flex',gap:8}}>
              <input style={{...S.input,flex:1}} placeholder="Nombre del jugador" value={newName}
                onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addP()}/>
              <button style={S.btn} onClick={addP}>+</button>
            </div>
          </div>
          <div style={S.card}>
            <div style={S.ct}>Participantes ({participants.length})</div>
            {!participants.length && <div style={{textAlign:'center',color:'#4d7a9e',padding:'20px 0',fontSize:13}}>No hay participantes aun</div>}
            {participants.map(p => {
              const ls = Object.keys(lockedPicks[p.id]||{}).filter(k=>lockedPicks[p.id][k])
              return (
                <div key={p.id} style={{padding:'10px 0',borderBottom:'1px solid #1c3352'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}>
                    <div style={{width:12,height:12,borderRadius:'50%',background:p.color,flexShrink:0}}/>
                    <span style={{flex:1,fontSize:15,fontWeight:600}}>{p.name}</span>
                    <span style={{fontSize:11,color:'#4d7a9e'}}>{Object.keys(predictions[p.id]||{}).length} picks</span>
                    {ls.length>0 && <span style={{fontSize:11,color:'#c084fc'}}>{'\uD83D\uDD12'}{ls.length}</span>}
                    <button style={S.btnRed} onClick={()=>updParticipants(participants.filter(x=>x.id!==p.id))}>X</button>
                  </div>
                  {ls.length>0 && adminUnlocked && (
                    <div style={{paddingLeft:22,marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
                      {ls.map(sk => (
                        <button key={sk} onClick={()=>unlockSec(p.id,sk)} style={{fontSize:10,padding:'3px 8px',borderRadius:4,border:'1px solid #c084fc44',background:'transparent',color:'#c084fc',cursor:'pointer',fontFamily:"'Rajdhani',sans-serif"}}>
                          Desbloquear {sk}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{textAlign:'center'}}>
            <button style={{background:'transparent',color:'#e63946',border:'1px solid #e63946',borderRadius:6,padding:'8px 14px',fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,cursor:'pointer'}} onClick={onReset}>
              Reiniciar todos los datos
            </button>
          </div>
        </>
      )}

      {/* ── RESULTADOS ── */}
      {sec==='results' && adminUnlocked && (
        <>
          <div style={{...S.cardD,border:'1px solid #3ddc8433'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
              <span style={{fontSize:13,color:'#3ddc84',fontWeight:700}}>{'\u2705'} Acceso de administrador activo</span>
            </div>
            <div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.8}}>
              <b style={{color:'#d8eaf7'}}>1</b> = gana local &nbsp;&middot;&nbsp;
              <b style={{color:'#d8eaf7'}}>X</b> = empate &nbsp;&middot;&nbsp;
              <b style={{color:'#d8eaf7'}}>2</b> = gana visitante
            </div>
          </div>
          <PhasePills current={resPhase} onChange={setResPhase}/>
          {resPhase==='Fase de Grupos' && <GroupPills current={resGroup} onChange={setResGroup}/>}
          <div style={{fontSize:11,color:'#4d7a9e',marginBottom:10,textAlign:'right'}}>{doneInPhase}/{resFiltered.length} registrados</div>
          {resFiltered.map(m => {
            const result = results[m.id]
            const opts   = m.allowDraw?['1','X','2']:['1','2']
            const labels = {'1':m.home,'X':'Empate','2':m.away}
            const tbd    = isTBD(m.home)&&isTBD(m.away)
            const pts    = PHASE_POINTS[m.phase]||3
            const ptC    = pts===10?'#f0c040':pts===7?'#c084fc':pts===5?'#4a9eff':'#4d7a9e'
            return (
              <div key={m.id} style={{...S.mc, opacity:tbd?.4:1, borderColor:result?'#3ddc8433':'#1c3352'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700}}>
                    {m.matchday?'J'+m.matchday:m.phase.toUpperCase()}
                    <span style={{color:ptC,fontSize:10,fontWeight:800,marginLeft:6}}>{pts}pts</span>
                  </span>
                  {result && (
                    <span style={{padding:'2px 9px',borderRadius:4,fontSize:11,fontWeight:700,background:'#1a3a1a',color:'#3ddc84'}}>
                      {'\u2713'} {result==='X'?'EMPATE':shortTeam(labels[result])}
                    </span>
                  )}
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                  <span style={{flex:1,textAlign:'right',fontSize:14,fontWeight:700}}>{m.home}</span>
                  <span style={{color:'#4d7a9e',fontSize:10,fontWeight:700,padding:'2px 5px',border:'1px solid #1c3352',borderRadius:4}}>VS</span>
                  <span style={{flex:1,fontSize:14,fontWeight:700}}>{m.away}</span>
                </div>
                <div style={{display:'flex',gap:6}}>
                  {opts.map(opt => (
                    <button key={opt} disabled={tbd} onClick={()=>setResult(m.id,opt)} style={{
                      flex:1, padding:'9px 4px', borderRadius:7, border:'1px solid',
                      borderColor: result===opt?'#3ddc84':'#1c3352',
                      background:  result===opt?'#1a3a1a':'#111d30',
                      color:       result===opt?'#3ddc84':'#4d7a9e',
                      fontFamily:"'Rajdhani',sans-serif", fontSize:12, fontWeight:700, cursor:'pointer',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:1
                    }}>
                      <span style={{fontSize:15,fontWeight:800}}>{opt}</span>
                      <span style={{fontSize:9,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {opt==='X'?'Empate':shortTeam(labels[opt])}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* ── CONFIG ── */}
      {sec==='settings' && (
        <>
          <div style={S.card}>
            <div style={S.ct}>PIN del Administrador</div>
            <div style={{fontSize:12,color:'#4d7a9e',marginBottom:12,lineHeight:1.6}}>
              Este PIN protege los resultados. Solo tu debes conocerlo.<br/>
              <b style={{color:'#f0c040'}}>PIN por defecto: {DEFAULT_PIN} — Cambialo ya!</b>
            </div>
            <div style={{marginBottom:8}}>
              <div style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700,marginBottom:4}}>NUEVO PIN (min. 4 digitos)</div>
              <input style={S.input} type="password" inputMode="numeric" placeholder="Nuevo PIN" value={newPin} onChange={e=>setNewPin(e.target.value)}/>
            </div>
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,color:'#4d7a9e',letterSpacing:1,fontWeight:700,marginBottom:4}}>CONFIRMAR NUEVO PIN</div>
              <input style={S.input} type="password" inputMode="numeric" placeholder="Repite el PIN" value={confirmPin} onChange={e=>setConfirmPin(e.target.value)}/>
            </div>
            {pinMsg && <div style={{fontSize:12,color:pinMsg.err?'#e63946':'#3ddc84',marginBottom:10,fontWeight:600}}>{pinMsg.msg}</div>}
            <button style={{...S.btn,width:'100%'}} onClick={changePin}>Guardar nuevo PIN</button>
          </div>
          <div style={S.cardD}>
            <div style={{fontSize:12,color:'#4d7a9e',lineHeight:1.9}}>
              <b style={{color:'#d8eaf7'}}>Como funciona:</b><br/>
              - Solo el admin (tu) puede registrar resultados con el PIN<br/>
              - Cada amigo elige su nombre y pone sus picks<br/>
              - Al confirmar, sus picks se bloquean para siempre<br/>
              - Puedes desbloquear secciones desde Jugadores (si estas autenticado)
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  const [loading,setLoading]       = useState(true)
  const [fatalError,setFatalError] = useState(null)
  const [participants,setP]        = useState([])
  const [results,setR]             = useState({})
  const [predictions,setPreds]     = useState({})
  const [lockedPicks,setLocked]    = useState({})
  const [adminPin,setPin]          = useState(DEFAULT_PIN)
  const [tab,setTab]               = useState('board')

  const board       = useMemo(()=>calcBoard(participants,predictions,results),[participants,predictions,results])
  const resultCount = Object.keys(results).length

  useEffect(()=>{
    if(!db){
      setFatalError('Firebase no se pudo inicializar. Verifica que el firebaseConfig en App.jsx tenga los datos reales de tu proyecto.')
      setLoading(false); return
    }
    const toArr = v => !v ? [] : Array.isArray(v) ? v : Object.values(v)
    try{
      const dbRef = ref(db, DB_PATH)
      const unsub = onValue(dbRef, snapshot=>{
        try{
          const data = snapshot.val()
          if(data){
            if(data.participants) setP(toArr(data.participants))
            if(data.results)      setR(data.results||{})
            if(data.predictions)  setPreds(data.predictions||{})
            if(data.lockedPicks)  setLocked(data.lockedPicks||{})
            if(data.adminPin)     setPin(data.adminPin)
          }
        }catch(e){ console.error('Parse error:',e) }
        setLoading(false)
      }, err=>{
        setFatalError('Error conectando a Firebase: '+err.message+'. Ve a Firebase Console > Realtime Database > Rules y pon .read y .write en true.')
        setLoading(false)
      })
      return ()=>unsub()
    }catch(e){
      setFatalError('Error en Firebase: '+e.message)
      setLoading(false)
    }
  },[])

  function save(data){ if(db) set(ref(db,DB_PATH),data).catch(e=>console.error('Save:',e)) }
  function bun(o={}){ return {participants,results,predictions,lockedPicks,adminPin,...o} }

  function updP(v){  setP(v);      save(bun({participants:v})) }
  function updR(v){  setR(v);      save(bun({results:v})) }
  function updPr(v){ setPreds(v);  save(bun({predictions:v})) }
  function updLk(v){ setLocked(v); save(bun({lockedPicks:v})) }
  function updPin(v){ setPin(v);   save(bun({adminPin:v})) }

  function handlePick(pid, mid, val){
    const m = ALL_MATCHES.find(x=>x.id===mid); if(!m) return
    const sk = secKey(m)
    if(lockedPicks[pid]&&lockedPicks[pid][sk]) return
    const pp = {...(predictions[pid]||{})}
    if(val===null) delete pp[mid]; else pp[mid]=val
    updPr({...predictions,[pid]:pp})
  }

  function handleLock(pid, sk){
    updLk({...lockedPicks,[pid]:{...(lockedPicks[pid]||{}),[sk]:true}})
  }

  function handleReset(){
    if(!window.confirm('Seguro que quieres borrar todos los datos? Esta accion no se puede deshacer.')) return
    setP([]); setR({}); setPreds({}); setLocked({}); setPin(DEFAULT_PIN)
    save({participants:[],results:{},predictions:{},lockedPicks:{},adminPin:DEFAULT_PIN})
  }

  // ── Error screen ──
  if(fatalError) return (
    <div style={{background:'#07111f',minHeight:'100vh',padding:30,fontFamily:'sans-serif'}}>
      <div style={{background:'#1a0a0a',border:'2px solid #e63946',borderRadius:12,padding:24,maxWidth:500,margin:'40px auto'}}>
        <div style={{fontSize:40,textAlign:'center',marginBottom:12}}>{'\u26A0\uFE0F'}</div>
        <div style={{color:'#f0c040',fontSize:20,fontWeight:'bold',marginBottom:12,textAlign:'center'}}>Error de Configuracion</div>
        <div style={{color:'#d8eaf7',fontSize:14,lineHeight:1.8,marginBottom:16}}>{fatalError}</div>
        <div style={{color:'#4d7a9e',fontSize:12,borderTop:'1px solid #1c3352',paddingTop:12,lineHeight:1.8}}>
          <b style={{color:'#d8eaf7'}}>Como resolverlo:</b><br/>
          1. Ve a console.firebase.google.com<br/>
          2. Entra a tu proyecto<br/>
          3. Realtime Database &gt; Rules<br/>
          4. Cambia .read y .write a true y publica
        </div>
      </div>
    </div>
  )

  // ── Loading screen ──
  if(loading) return (
    <div style={{...S.app,alignItems:'center',justifyContent:'center',fontSize:18,color:'#f0c040'}}>
      {'\u26BD'} Cargando...
    </div>
  )

  const tabs = [
    {id:'board',   icon:'\uD83C\uDFC6', label:'TABLA'},
    {id:'matches', icon:'\u26BD',        label:'PARTIDOS'},
    {id:'picks',   icon:'\uD83C\uDFAF', label:'MIS PICKS'},
    {id:'admin',   icon:'\u2699\uFE0F', label:'ADMIN'},
  ]

  return (
    <div style={S.app}>
      <style>{'@import url(\'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;500;600;700&display=swap\');*{box-sizing:border-box}::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:#07111f}::-webkit-scrollbar-thumb{background:#1c3352;border-radius:2px}button:active{transform:scale(.97)}input[type=checkbox]{accent-color:#f0c040}'}</style>

      {/* Header */}
      <div style={S.header}>
        <div style={{fontSize:32}}>{'\u26BD'}</div>
        <div>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:3,color:'#f0c040',lineHeight:1}}>POLLA MUNDIALISTA</div>
          <div style={{fontSize:10,letterSpacing:2,color:'#4d7a9e',marginTop:2}}>FIFA WORLD CUP 2026</div>
        </div>
        <div style={{marginLeft:'auto',textAlign:'right'}}>
          <div style={{fontSize:20,fontWeight:700,lineHeight:1}}>{resultCount}<span style={{fontSize:12,color:'#4d7a9e'}}>/{ALL_MATCHES.length}</span></div>
          <div style={{fontSize:9,letterSpacing:1,color:'#4d7a9e'}}>JUGADOS</div>
        </div>
      </div>

      {/* Content */}
      <div style={S.content}>
        {tab==='board'   && <BoardTab   board={board} resultCount={resultCount}/>}
        {tab==='matches' && <MatchesTab results={results} predictions={predictions} participants={participants}/>}
        {tab==='picks'   && <PicksTab   predictions={predictions} participants={participants} lockedPicks={lockedPicks} onPick={handlePick} onLockSection={handleLock}/>}
        {tab==='admin'   && <AdminTab   participants={participants} results={results} predictions={predictions} lockedPicks={lockedPicks} adminPin={adminPin} updParticipants={updP} updResults={updR} updLockedPicks={updLk} updAdminPin={updPin} onReset={handleReset}/>}
      </div>

      {/* Tab bar */}
      <div style={S.tabbar}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1, padding:'10px 4px 8px', display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            border:'none', borderTop:'2px solid '+(tab===t.id?'#f0c040':'transparent'),
            background:'transparent', color:tab===t.id?'#f0c040':'#4d7a9e', cursor:'pointer', transition:'color .15s'
          }}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <span style={{fontSize:8,fontWeight:700,letterSpacing:1,fontFamily:"'Rajdhani',sans-serif"}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
