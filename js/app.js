const cfg = window.BJERKING_CONFIG || {};
const configured = cfg.supabaseUrl?.startsWith("https://") && !cfg.supabaseAnonKey?.startsWith("DIN_");
const db = configured ? supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
const state = { players: [], matches: [] };
const $ = (id) => document.getElementById(id);

const demoPlayers = [
  {id:1,name:"Jonas Samuelsson",active:true}, {id:2,name:"Saku Heikkilä",active:true},
  {id:3,name:"Karl Nittve",active:true}, {id:4,name:"Michel Ehn",active:true},
  {id:5,name:"David Bidros",active:true}, {id:6,name:"Mia Borgström-Moa",active:true}
];
const demoMatches = [
  {id:1,player1_id:1,player2_id:2,player1_score:3,player2_score:1,played_at:"2026-10-06"},
  {id:2,player1_id:3,player2_id:4,player1_score:3,player2_score:2,played_at:"2026-10-05"},
  {id:3,player1_id:5,player2_id:3,player1_score:0,player2_score:3,played_at:"2026-10-03"}
];

function showStatus(message, error=false){ const el=$("statusMessage"); el.hidden=false; el.textContent=message; el.className=`status${error?" error":""}`; }
function playerName(id){ return state.players.find(p=>Number(p.id)===Number(id))?.name || "Okänd spelare"; }
function calculateStats(){
  const map = new Map(state.players.map(p=>[Number(p.id),{...p,wins:0,losses:0,played:0,recent:[]} ]));
  [...state.matches].sort((a,b)=>new Date(b.played_at)-new Date(a.played_at)).forEach(m=>{
    const p1=map.get(Number(m.player1_id)), p2=map.get(Number(m.player2_id)); if(!p1||!p2)return;
    p1.played++; p2.played++; const p1Won=Number(m.player1_score)>Number(m.player2_score);
    (p1Won?p1:p2).wins++; (p1Won?p2:p1).losses++; p1.recent.push(p1Won); p2.recent.push(!p1Won);
  });
  return [...map.values()].map(p=>({...p,rate:p.played?Math.round(p.wins/p.played*100):0,form:p.recent.slice(0,5).filter(Boolean).length}))
    .sort((a,b)=>b.wins-a.wins || b.rate-a.rate || a.name.localeCompare(b.name,"sv"));
}
function render(){
  const stats=calculateStats(), leader=stats[0], form=[...stats].sort((a,b)=>b.form-a.form||b.wins-a.wins)[0];
  $("playerCount").textContent=state.players.filter(p=>p.active!==false).length; $("matchCount").textContent=state.matches.length;
  $("leaderName").textContent=leader?.name||"Ingen ännu"; $("leaderStats").textContent=leader?`${leader.wins} vinster · ${leader.rate}%`:"Ranking";
  $("formPlayer").textContent=form?.name||"-"; $("mostWins").textContent=leader?`${leader.name} (${leader.wins})`:"-";
  const best=[...stats].filter(p=>p.played).sort((a,b)=>b.rate-a.rate||b.played-a.played)[0]; $("bestRate").textContent=best?`${best.name} (${best.rate}%)`:"-";
  $("rankingList").innerHTML=stats.length?stats.map((p,i)=>`<div class="ranking-row"><div class="player-cell"><span class="rank-number">${i+1}</span><span class="player-name">${escapeHtml(p.name)}</span></div><span>${p.wins}</span><span>${p.losses}</span><span>${p.rate}%</span></div>`).join(""):'<p class="empty">Inga spelare ännu.</p>';
  const latest=[...state.matches].sort((a,b)=>new Date(b.played_at)-new Date(a.played_at)).slice(0,5);
  $("latestMatches").innerHTML=latest.length?latest.map(m=>`<div class="match-row"><span>${escapeHtml(playerName(m.player1_id))}</span><strong class="score">${m.player1_score}–${m.player2_score}</strong><span>${escapeHtml(playerName(m.player2_id))}</span></div>`).join(""):'<p class="empty">Inga matcher ännu.</p>';
  const options=state.players.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join(""); $("player1").innerHTML=options; $("player2").innerHTML=options;
  if(state.players.length>1) $("player2").selectedIndex=1;
}
function escapeHtml(value){ const d=document.createElement("div"); d.textContent=value??""; return d.innerHTML; }
async function loadData(){
  if(!db){ state.players=demoPlayers; state.matches=demoMatches; showStatus("Demoläge: lägg in Supabase URL och anon key i js/config.js för att använda din databas."); render(); return; }
  const [{data:players,error:pe},{data:matches,error:me}] = await Promise.all([
    db.from("players").select("id,name,email,active").order("name"),
    db.from("matches").select("id,player1_id,player2_id,player1_score,player2_score,winner_id,played_at").order("played_at",{ascending:false})
  ]);
  if(pe||me){ showStatus(`Kunde inte läsa Supabase: ${(pe||me).message}. Kontrollera tabellnamn och RLS-policy.`,true); state.players=demoPlayers; state.matches=demoMatches; }
  else { state.players=players||[]; state.matches=matches||[]; }
  render();
}
async function saveMatch(e){
  e.preventDefault(); const p1=Number($("player1").value),p2=Number($("player2").value),s1=Number($("score1").value),s2=Number($("score2").value);
  if(p1===p2){showStatus("Välj två olika spelare.",true);return} if(s1===s2){showStatus("En match kan inte sluta oavgjort.",true);return}
  const match={player1_id:p1,player2_id:p2,player1_score:s1,player2_score:s2,winner_id:s1>s2?p1:p2,played_at:$("playedAt").value};
  if(db){ const {data,error}=await db.from("matches").insert(match).select().single(); if(error){showStatus(`Matchen kunde inte sparas: ${error.message}`,true);return} state.matches.unshift(data); }
  else { match.id=Date.now(); state.matches.unshift(match); showStatus("Matchen lades till lokalt i demoläget och sparas inte efter omladdning."); }
  $("matchDialog").close(); render();
}
$("menuButton").addEventListener("click",()=>{const nav=$("mainNav");nav.classList.toggle("open");$("menuButton").setAttribute("aria-expanded",nav.classList.contains("open"))});
document.querySelectorAll("[data-open-match]").forEach(b=>b.addEventListener("click",()=>$("matchDialog").showModal()));
document.querySelector("[data-close-match]").addEventListener("click",()=>$("matchDialog").close());
$("matchForm").addEventListener("submit",saveMatch); $("playedAt").value=new Date().toISOString().slice(0,10); loadData();
