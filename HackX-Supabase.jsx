import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// ═══════════════════════════════════════════════════════════════════════════════
const SUPABASE_URL  = "https://gawevaqejpchgmvioufr.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdhd2V2YXFlanBjaGdtdmlvdWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5OTIxNTYsImV4cCI6MjA4NzU2ODE1Nn0.x6WlcXG-moJCr-dXP6VsQnb2CVI58AI-fZfM9HH3W-U";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE SECRETS  (used when setting role after first login)
// ═══════════════════════════════════════════════════════════════════════════════
const ROLE_SECRETS = { admin: "", sir: "" };

// ═══════════════════════════════════════════════════════════════════════════════
// SCORE ENGINE
// Sir mark /100 × 50  +  avg student mark /100 × 50  =  Final (0–100)
// ═══════════════════════════════════════════════════════════════════════════════
function calcTeamScores(teams, studentMarks) {
  // studentMarks: [{ team_id, score, student_id }]
  return teams.map(team => {
    const sirScore   = team.sir_score !== null && team.sir_score !== undefined ? Number(team.sir_score) : null;
    const sirContrib = sirScore !== null ? (sirScore / 100) * 50 : 0;

    const forTeam = studentMarks.filter(m => m.team_id === team.id);
    const avgStudent = forTeam.length > 0
      ? forTeam.reduce((a, m) => a + Number(m.score), 0) / forTeam.length : 0;
    const studentContrib = (avgStudent / 100) * 50;

    return {
      ...team,
      sirScore, sirContrib,
      avgStudent, studentContrib,
      studentCount: forTeam.length,
      finalScore: sirContrib + studentContrib,
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

// ═══════════════════════════════════════════════════════════════════════════════
// QR
// ═══════════════════════════════════════════════════════════════════════════════
function QRImage({ url, size = 140 }) {
  return (
    <img
      src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=02040e&color=00f5ff&margin=1`}
      alt="QR" width={size} height={size}
      style={{ borderRadius: 8, display: "block" }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════════
function useToast() {
  const [list, setList] = useState([]);
  const push = useCallback((msg, type = "info") => {
    const id = Date.now() + Math.random();
    setList(l => [...l, { id, msg, type }]);
    setTimeout(() => setList(l => l.filter(x => x.id !== id)), 4000);
  }, []);
  return { list, push };
}
function Toasts({ list }) {
  const col = { success: "#00ff88", error: "#ff006e", info: "#00f5ff", warn: "#ffee00" };
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      {list.map(t => (
        <div key={t.id} style={{ padding:"11px 18px", borderRadius:8, maxWidth:320, background:`${col[t.type]}14`, border:`1px solid ${col[t.type]}55`, color:col[t.type], fontFamily:"'Share Tech Mono',monospace", fontSize:13, backdropFilter:"blur(12px)", animation:"toastIn .3s ease" }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════════════════════════════════════════════
function Particles() {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); let raf;
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random()-.5)*.35, vy: (Math.random()-.5)*.35,
      r: Math.random()*1.4+.3,
      col: ["#00f5ff","#bf00ff","#ff006e","#00ff88"][Math.floor(Math.random()*4)],
    }));
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0,0,c.width,c.height);
      pts.forEach(p => {
        p.x=(p.x+p.vx+c.width)%c.width; p.y=(p.y+p.vy+c.height)%c.height;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=p.col; ctx.globalAlpha=.5; ctx.fill(); ctx.globalAlpha=1;
      });
      for(let i=0;i<pts.length;i++) for(let j=i+1;j<pts.length;j++){
        const dx=pts[i].x-pts[j].x,dy=pts[i].y-pts[j].y,d=Math.hypot(dx,dy);
        if(d<90){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle="#00f5ff";ctx.globalAlpha=(1-d/90)*.1;ctx.lineWidth=.5;ctx.stroke();ctx.globalAlpha=1;}
      }
      raf=requestAnimationFrame(draw);
    };
    draw();
    return ()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}/>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI ATOMS
// ═══════════════════════════════════════════════════════════════════════════════
function Btn({ children, onClick, variant="primary", small, full, disabled, color="#00f5ff", style={} }) {
  const [h,sH]=useState(false);
  const c = variant==="danger"?"#ff006e":color;
  return (
    <button onClick={disabled?undefined:onClick} disabled={disabled}
      onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)}
      style={{ fontFamily:"'Orbitron',sans-serif", fontSize:small?9:11, fontWeight:700, letterSpacing:2,
        padding:small?"7px 14px":"12px 30px", borderRadius:5, cursor:disabled?"not-allowed":"pointer",
        opacity:disabled?.4:1, textTransform:"uppercase",
        border:variant!=="primary"?`1px solid ${c}`:"none",
        background:variant==="primary"?`linear-gradient(135deg,${c},${variant==="danger"?"#8b0026":"#6600bb"})`
          :h?`${c}1a`:"transparent",
        color:variant==="primary"?(variant==="danger"?"#fff":"#000"):c,
        boxShadow:h&&!disabled?`0 0 22px ${c}77`:`0 0 8px ${c}22`,
        transition:"all .25s", transform:h&&!disabled?"translateY(-2px)":"none",
        width:full?"100%":"auto", ...style }}>
      {children}
    </button>
  );
}

function Panel({ children, style={}, accent="#00f5ff" }) {
  return (
    <div style={{ background:"rgba(4,12,36,.93)", border:"1px solid rgba(0,245,255,.18)", borderRadius:13,
      padding:30, backdropFilter:"blur(22px)", position:"relative", overflow:"hidden", ...style }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:`linear-gradient(90deg,transparent,${accent},#bf00ff,transparent)` }}/>
      {children}
    </div>
  );
}

function Tag({ children, color="#00ff88" }) {
  return <span style={{ background:`${color}18`, border:`1px solid ${color}44`, color, fontSize:11,
    fontFamily:"'Share Tech Mono',monospace", padding:"3px 11px", borderRadius:20, letterSpacing:1 }}>{children}</span>;
}

function SectionLabel({ children, color="#00f5ff" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
      <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:10, color, letterSpacing:3,
        textTransform:"uppercase", whiteSpace:"nowrap" }}>{children}</span>
      <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${color}44,transparent)` }}/>
    </div>
  );
}

function Bar({ pct, color, height=5 }) {
  const [w,sW]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>sW(Math.min(pct||0,100)),80);return()=>clearTimeout(t);},[pct]);
  return (
    <div style={{ height, background:"rgba(255,255,255,.07)", borderRadius:3, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${w}%`, background:`linear-gradient(90deg,${color},${color}88)`,
        borderRadius:3, transition:"width 1.1s cubic-bezier(.4,0,.2,1)" }}/>
    </div>
  );
}

function StatBox({ val, label, color }) {
  return (
    <div>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:26, fontWeight:900, color, textShadow:`0 0 20px ${color}55` }}>{val}</div>
      <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#506880", marginTop:3, letterSpacing:1 }}>{label}</div>
    </div>
  );
}

// Score input card — local state, never reset by parent re-render
function ScoreCard({ team, initVal, color, disabled, onChange }) {
  const [val,setVal] = useState(String(initVal??"")); 
  const prev = useRef(initVal);
  useEffect(()=>{
    if(prev.current!==initVal){ setVal(String(initVal??"")); prev.current=initVal; }
  },[initVal]);
  const n=Number(val), ok=val!==""&&!isNaN(n)&&n>=0&&n<=100;
  function handle(e){ setVal(e.target.value); onChange(team.id,e.target.value); }
  return (
    <div style={{ background:"rgba(0,0,0,.35)", border:`1px solid ${ok?`${color}55`:"rgba(255,255,255,.08)"}`,
      borderRadius:10, padding:"16px 18px", transition:"border-color .2s" }}>
      <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:17, color:"#dff0ff", fontWeight:600, marginBottom:12 }}>{team.name}</div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <input type="number" min={0} max={100} placeholder="0–100" value={val} onChange={handle} disabled={disabled}
          style={{ width:100, background:"rgba(0,0,0,.6)", border:`1px solid ${ok?color:`${color}44`}`,
            borderRadius:8, color, fontFamily:"'Orbitron',monospace", fontSize:22, fontWeight:700,
            padding:"9px 12px", outline:"none", textAlign:"center",
            boxShadow:ok?`0 0 12px ${color}33`:"none", transition:"all .2s", appearance:"textfield" }}/>
        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:13, color:"#506880" }}>/ 100</span>
        {ok&&<span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color }}>= {(n/2).toFixed(1)} pts</span>}
      </div>
      {ok&&<div style={{ marginTop:10 }}><Bar pct={n} color={color} height={4}/></div>}
    </div>
  );
}

function SiteHeader({ profile, onLogout }) {
  const roleColor = { admin:"#bf00ff", sir:"#ffee00", student:"#00f5ff" }[profile?.role] || "#00f5ff";
  const roleLabel = { admin:"⬡ ADMIN", sir:"★ SIR", student:"⬤" }[profile?.role] || "⬤";
  return (
    <div style={{ position:"sticky", top:0, background:"rgba(2,4,14,.95)", backdropFilter:"blur(22px)",
      borderBottom:"1px solid rgba(0,245,255,.13)", padding:"13px 30px",
      display:"flex", alignItems:"center", justifyContent:"space-between", zIndex:100 }}>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontWeight:900, fontSize:19, letterSpacing:5,
        background:"linear-gradient(135deg,#00f5ff,#bf00ff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
        HACKX
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
        {profile?.avatar_url && (
          <img src={profile.avatar_url} alt="" width={32} height={32}
            style={{ borderRadius:"50%", border:`2px solid ${roleColor}`, objectFit:"cover" }}/>
        )}
        <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:roleColor,
          border:`1px solid ${roleColor}44`, padding:"4px 14px", borderRadius:20 }}>
          {roleLabel} {profile?.name}
        </div>
        <Btn small variant="ghost" onClick={onLogout}>Logout</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE SETUP SCREEN — shown after first Google login to pick role
// ═══════════════════════════════════════════════════════════════════════════════
function RoleSetupScreen({ user, onDone, toast }) {
  const [role,    setRole]   = useState("student");
  const [secret,  setSecret] = useState("");
  const [loading, setLoading]= useState(false);
  const [err,     setErr]    = useState("");

  async function confirm() {
    setErr(""); setLoading(true);
    if ((role==="admin"||role==="sir") && secret!==ROLE_SECRETS[role]) {
      setErr(`Wrong ${role} secret key`); setLoading(false); return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", user.id);
    if (error) { setErr(error.message); setLoading(false); return; }
    toast(`Welcome! You're registered as ${role}.`, "success");
    onDone(role);
    setLoading(false);
  }

  const meta = {
    student:{ label:"Student",  icon:"⬤", color:"#00f5ff", desc:"Score teams out of 100" },
    sir:    { label:"Sir",      icon:"★", color:"#ffee00", desc:"Give official marks (50% weight)" },
    admin:  { label:"Admin",    icon:"⬡", color:"#bf00ff", desc:"Create & manage polls" },
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:20, position:"relative", zIndex:1 }}>
      <div style={{ textAlign:"center", marginBottom:36 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:"clamp(2.5rem,8vw,5rem)", fontWeight:900,
          letterSpacing:8, background:"linear-gradient(135deg,#00f5ff,#bf00ff,#ff006e)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          filter:"drop-shadow(0 0 30px rgba(0,245,255,.35))", lineHeight:1 }}>HACKX</div>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", color:"#506880", letterSpacing:4, fontSize:12, marginTop:10 }}>
          Welcome! Choose your role to continue.
        </div>
      </div>

      <Panel style={{ width:"100%", maxWidth:480 }} accent="#00f5ff">
        <SectionLabel>Select Your Role</SectionLabel>
        <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
          {Object.entries(meta).map(([k,m])=>(
            <button key={k} onClick={()=>setRole(k)}
              style={{ flex:1, minWidth:120, background:role===k?`${m.color}18`:"rgba(0,0,0,.4)",
                border:`2px solid ${role===k?m.color:"rgba(255,255,255,.1)"}`,
                borderRadius:10, padding:"14px 12px", cursor:"pointer",
                transition:"all .25s", textAlign:"center",
                boxShadow:role===k?`0 0 20px ${m.color}44`:"none",
                transform:role===k?"translateY(-2px)":"none" }}>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:18, color:m.color, marginBottom:4,
                textShadow:role===k?`0 0 14px ${m.color}`:""  }}>{m.icon}</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:10, fontWeight:700,
                color:role===k?m.color:"#506880", letterSpacing:2 }}>{m.label}</div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#506880", marginTop:3, lineHeight:1.4 }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {(role==="admin"||role==="sir") && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:meta[role].color,
              letterSpacing:2, marginBottom:8, textTransform:"uppercase" }}>{meta[role].label} Secret Key</div>
            <input type="password" value={secret} onChange={e=>setSecret(e.target.value)}
              placeholder={`Enter ${role} secret key`}
              style={{ width:"100%", background:"rgba(0,0,0,.55)", border:`1px solid ${meta[role].color}44`,
                borderRadius:7, color:"#dff0ff", fontFamily:"'Rajdhani',sans-serif", fontSize:16,
                padding:"11px 14px", outline:"none", boxSizing:"border-box" }}/>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#506880", marginTop:6 }}>
              {role==="sir"?"Sir key: HACKsir2025":"Admin key: HACKADMIN2025"}
            </div>
          </div>
        )}

        {err && (
          <div style={{ background:"rgba(255,0,110,.09)", border:"1px solid rgba(255,0,110,.38)",
            color:"#ff006e", padding:"10px 14px", borderRadius:7, fontSize:13, marginBottom:16,
            fontFamily:"'Share Tech Mono',monospace" }}>⚠ {err}</div>
        )}

        <Btn full color={meta[role].color} onClick={confirm} disabled={loading}>
          {loading?"Setting up…":`Continue as ${meta[role].label}`}
        </Btn>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN — Google OAuth only
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ toast }) {
  const [loading, setLoading] = useState(false);

  async function signInGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
        queryParams: { access_type:"offline", prompt:"consent" },
      },
    });
    if (error) { toast(error.message, "error"); setLoading(false); }
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:20, position:"relative", zIndex:1 }}>

      {/* Hero */}
      <div style={{ textAlign:"center", marginBottom:50 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:"clamp(3.5rem,12vw,7rem)", fontWeight:900,
          letterSpacing:10, background:"linear-gradient(135deg,#00f5ff 0%,#bf00ff 50%,#ff006e 100%)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          filter:"drop-shadow(0 0 40px rgba(0,245,255,.4))", lineHeight:1 }}>
          HACKX
        </div>
        <div style={{ fontFamily:"'Share Tech Mono',monospace", color:"#506880", letterSpacing:5,
          fontSize:13, marginTop:14, textTransform:"uppercase" }}>
          ⚡ Hackathon Voting Platform ⚡
        </div>
      </div>

      <Panel style={{ width:"100%", maxWidth:400, textAlign:"center" }} accent="#00f5ff">
        {/* What each role does */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:32 }}>
          {[
            { icon:"⬡", label:"Admin", desc:"Create polls", color:"#bf00ff" },
            { icon:"★", label:"Sir",   desc:"Give marks",   color:"#ffee00" },
            { icon:"⬤", label:"Student",desc:"Score teams", color:"#00f5ff" },
          ].map(r=>(
            <div key={r.label} style={{ background:`${r.color}0a`, border:`1px solid ${r.color}22`,
              borderRadius:10, padding:"14px 8px", textAlign:"center" }}>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, color:r.color,
                textShadow:`0 0 12px ${r.color}88`, marginBottom:6 }}>{r.icon}</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, color:r.color,
                letterSpacing:2, fontWeight:700 }}>{r.label}</div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:"#506880",
                marginTop:4, lineHeight:1.4 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        {/* Google Sign In Button */}
        <button onClick={signInGoogle} disabled={loading}
          style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:14,
            background:loading?"rgba(255,255,255,.05)":"rgba(255,255,255,.07)",
            border:"1px solid rgba(255,255,255,.18)", borderRadius:10, padding:"15px 24px",
            cursor:loading?"not-allowed":"pointer", transition:"all .25s",
            boxShadow:loading?"none":"0 0 20px rgba(255,255,255,.06)" }}>
          {/* Google G icon */}
          <svg width="22" height="22" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          <span style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:17, fontWeight:700,
            color:loading?"#506880":"#dff0ff", letterSpacing:1 }}>
            {loading ? "Redirecting…" : "Continue with Google"}
          </span>
        </button>

        <div style={{ marginTop:18, fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#506880", lineHeight:1.7 }}>
          First login? You'll be asked to choose your role.<br/>
          Sir key: <span style={{ color:"#ffee00" }}>HACKsir2025</span> &nbsp;|&nbsp; Admin key: <span style={{ color:"#bf00ff" }}>HACKADMIN2025</span>
        </div>
      </Panel>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLL CARD
// ═══════════════════════════════════════════════════════════════════════════════
function PollCard({ poll, onOpen, onClose, isAdmin, marked, sirScored }) {
  const [h,sH]=useState(false);
  return (
    <div onClick={onOpen} onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)}
      style={{ background:"rgba(0,18,55,.7)", border:`1px solid ${h?"#00f5ff":"rgba(0,245,255,.18)"}`,
        borderRadius:11, padding:22, cursor:"pointer", transition:"all .25s",
        transform:h?"translateY(-4px)":"none", boxShadow:h?"0 10px 32px rgba(0,245,255,.14)":"none",
        position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
        background:poll.closed?"linear-gradient(90deg,transparent,#ff006e,transparent)"
          :"linear-gradient(90deg,transparent,#00ff88,transparent)" }}/>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        <Tag color={poll.closed?"#ff006e":"#00ff88"}>{poll.closed?"⬤ CLOSED":"⬤ LIVE"}</Tag>
        {marked    && <Tag color="#00f5ff">✓ Marked</Tag>}
        {sirScored && <Tag color="#ffee00">★ Scored</Tag>}
      </div>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, fontWeight:700,
        color:"#dff0ff", marginBottom:6, letterSpacing:1 }}>{poll.name}</div>
      {poll.description&&<div style={{ fontSize:13, color:"#506880", marginBottom:14 }}>{poll.description}</div>}
      <div style={{ display:"flex", gap:22, marginBottom:isAdmin&&!poll.closed?16:0 }}>
        <StatBox val={poll.team_count||0} label="Teams"   color="#00f5ff"/>
        <StatBox val={poll.marker_count||0} label="Markers" color="#bf00ff"/>
      </div>
      {isAdmin&&!poll.closed&&(
        <div style={{ marginTop:14 }} onClick={e=>{e.stopPropagation();onClose?.();}}>
          <Btn small variant="danger" onClick={()=>{}}>🔒 Close Poll</Btn>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function AdminDashboard({ profile, onPoll, onLogout, toast }) {
  const [polls,   setPolls]  = useState([]);
  const [creating,setCreate] = useState(false);
  const [pName,   setPName]  = useState("");
  const [pDesc,   setPDesc]  = useState("");
  const [teams,   setTeams]  = useState(["",""]);
  const [loading, setLoad]   = useState(false);

  const loadPolls = useCallback(async () => {
    const { data } = await supabase.from("polls").select("*").order("created_at",{ascending:false});
    if (!data) return;
    // count teams and markers per poll
    const enriched = await Promise.all(data.map(async p => {
      const [{ count: tc }, { count: mc }] = await Promise.all([
        supabase.from("teams").select("*",{count:"exact",head:true}).eq("poll_id",p.id),
        supabase.from("student_marks").select("student_id",{count:"exact",head:true}).eq("poll_id",p.id),
      ]);
      // unique markers
      const { data: uMarkers } = await supabase.from("student_marks").select("student_id").eq("poll_id",p.id);
      const unique = new Set(uMarkers?.map(m=>m.student_id)||[]).size;
      return { ...p, team_count:tc||0, marker_count:unique };
    }));
    setPolls(enriched);
  }, []);

  useEffect(() => { loadPolls(); }, [loadPolls]);

  async function launchPoll() {
    if (!pName.trim()) return toast("Poll name required","error");
    const valid = teams.map(t=>t.trim()).filter(Boolean);
    if (valid.length<2) return toast("Add at least 2 teams","error");
    setLoad(true);
    const pollId = "poll_"+Date.now();
    const { error:pe } = await supabase.from("polls").insert({ id:pollId, name:pName.trim(), description:pDesc.trim(), created_by:profile.id });
    if (pe) { toast(pe.message,"error"); setLoad(false); return; }
    const teamRows = valid.map((n,i)=>({ id:`t${i}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, poll_id:pollId, name:n, position:i }));
    await supabase.from("teams").insert(teamRows);
    toast("🚀 Poll launched!","success");
    setPName(""); setPDesc(""); setTeams(["",""]); setCreate(false); setLoad(false); loadPolls();
  }

  async function closePoll(id) {
    await supabase.from("polls").update({ closed:true }).eq("id",id);
    toast("Poll closed.","info"); loadPolls();
  }

  const active = polls.filter(p=>!p.closed), closed = polls.filter(p=>p.closed);

  return (
    <div style={{ minHeight:"100vh", position:"relative", zIndex:1 }}>
      <SiteHeader profile={profile} onLogout={onLogout}/>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"32px 20px" }}>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:14, marginBottom:36 }}>
          {[
            { label:"Total Polls",  val:polls.length,  col:"#00f5ff" },
            { label:"Live",         val:active.length, col:"#00ff88" },
            { label:"Completed",    val:closed.length, col:"#ff006e" },
            { label:"Total Markers",val:polls.reduce((a,p)=>a+(p.marker_count||0),0), col:"#bf00ff" },
          ].map(s=>(
            <Panel key={s.label} style={{ padding:20, textAlign:"center" }} accent={s.col}>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:34, fontWeight:900, color:s.col, textShadow:`0 0 22px ${s.col}55` }}>{s.val}</div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#506880", marginTop:4, letterSpacing:2 }}>{s.label}</div>
            </Panel>
          ))}
        </div>

        {/* Keys card */}
        <Panel accent="#506880" style={{ marginBottom:32, padding:20 }}>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#00f5ff", letterSpacing:2, marginBottom:12, textTransform:"uppercase" }}>🔑 Secret Keys to Share</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
            {[{role:"Sir / Faculty",key:"HACKsir2025",color:"#ffee00",note:"Share with faculty for marking"},{role:"Admin",key:"HACKADMIN2025",color:"#bf00ff",note:"Keep private"}].map(k=>(
              <div key={k.role} style={{ background:`${k.color}08`, border:`1px solid ${k.color}22`, borderRadius:8, padding:"12px 16px" }}>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:k.color, letterSpacing:2, marginBottom:5 }}>{k.role.toUpperCase()}</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:13, color:k.color, letterSpacing:2, marginBottom:5 }}>{k.key}</div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#506880", lineHeight:1.5 }}>{k.note}</div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Create poll */}
        <SectionLabel color="#bf00ff">Create New Poll</SectionLabel>
        {!creating ? (
          <div style={{ marginBottom:36 }}><Btn color="#bf00ff" onClick={()=>setCreate(true)}>⚡ New Poll</Btn></div>
        ) : (
          <Panel accent="#bf00ff" style={{ marginBottom:36 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:4 }}>
              {[["Poll Name",pName,setPName,"e.g. Best Project 2025"],["Description (optional)",pDesc,setPDesc,"Short description…"]].map(([lbl,val,set,ph])=>(
                <div key={lbl} style={{ marginBottom:18 }}>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#bf00ff", letterSpacing:2, marginBottom:6, textTransform:"uppercase" }}>{lbl}</div>
                  <input value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                    style={{ width:"100%", background:"rgba(0,0,0,.55)", border:"1px solid rgba(191,0,255,.3)", borderRadius:7, color:"#dff0ff", fontFamily:"'Rajdhani',sans-serif", fontSize:15, padding:"11px 14px", outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:"#bf00ff", letterSpacing:2, marginBottom:10, textTransform:"uppercase" }}>Teams</div>
            {teams.map((t,i)=>(
              <div key={i} style={{ display:"flex", gap:8, marginBottom:8 }}>
                <input value={t} onChange={e=>{const c=[...teams];c[i]=e.target.value;setTeams(c);}} placeholder={`Team ${i+1} name`}
                  style={{ flex:1, background:"rgba(0,0,0,.55)", border:"1px solid rgba(191,0,255,.3)", borderRadius:7, color:"#dff0ff", fontFamily:"'Rajdhani',sans-serif", fontSize:15, padding:"10px 14px", outline:"none", boxSizing:"border-box" }}/>
                <button onClick={()=>{if(teams.length<=2){toast("Need at least 2 teams","error");return;}setTeams(teams.filter((_,idx)=>idx!==i));}}
                  style={{ background:"rgba(255,0,110,.15)", border:"1px solid rgba(255,0,110,.35)", color:"#ff006e", borderRadius:7, width:38, cursor:"pointer", fontSize:20, flexShrink:0 }}>×</button>
              </div>
            ))}
            <button onClick={()=>setTeams([...teams,""])} style={{ width:"100%", background:"rgba(191,0,255,.07)", border:"1px dashed rgba(191,0,255,.35)", color:"#bf00ff", borderRadius:7, padding:10, cursor:"pointer", fontFamily:"'Share Tech Mono',monospace", fontSize:12, marginTop:4, marginBottom:20 }}>+ Add Team</button>
            <div style={{ display:"flex", gap:12 }}>
              <Btn color="#bf00ff" onClick={launchPoll} disabled={loading}>{loading?"Launching…":"🚀 Launch Poll"}</Btn>
              <Btn variant="ghost" onClick={()=>setCreate(false)}>Cancel</Btn>
            </div>
          </Panel>
        )}

        {active.length>0&&<><SectionLabel color="#00ff88">Live Polls ({active.length})</SectionLabel>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16, marginBottom:36 }}>
            {active.map(p=><PollCard key={p.id} poll={p} isAdmin onOpen={()=>onPoll(p.id)} onClose={()=>closePoll(p.id)}/>)}
          </div></>}
        {closed.length>0&&<><SectionLabel color="#ff006e">Completed ({closed.length})</SectionLabel>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
            {closed.map(p=><PollCard key={p.id} poll={p} isAdmin onOpen={()=>onPoll(p.id)}/>)}
          </div></>}
        {polls.length===0&&<div style={{ textAlign:"center", padding:"80px 0", color:"#506880", fontFamily:"'Share Tech Mono',monospace" }}>No polls yet. Create your first poll ☝️</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIR DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function SirDashboard({ profile, onPoll, onLogout }) {
  const [polls, setPolls] = useState([]);
  useEffect(()=>{
    (async()=>{
      const { data } = await supabase.from("polls").select("*").order("created_at",{ascending:false});
      if(!data) return;
      const enriched = await Promise.all(data.map(async p=>{
        const { data:teams } = await supabase.from("teams").select("sir_score").eq("poll_id",p.id);
        const sirScored = teams?.every(t=>t.sir_score!==null&&t.sir_score!==undefined)&&(teams?.length>0);
        return {...p,sirScored};
      }));
      setPolls(enriched);
    })();
  },[]);
  const scored = polls.filter(p=>p.sirScored).length;
  return (
    <div style={{ minHeight:"100vh", position:"relative", zIndex:1 }}>
      <SiteHeader profile={profile} onLogout={onLogout}/>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))", gap:14, marginBottom:36 }}>
          {[{label:"Total Polls",val:polls.length,col:"#00f5ff"},{label:"Scored",val:scored,col:"#00ff88"},{label:"Pending",val:polls.length-scored,col:"#ffee00"}].map(s=>(
            <Panel key={s.label} style={{ padding:20, textAlign:"center" }} accent={s.col}>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:34, fontWeight:900, color:s.col, textShadow:`0 0 20px ${s.col}55` }}>{s.val}</div>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:"#506880", marginTop:4, letterSpacing:2 }}>{s.label}</div>
            </Panel>
          ))}
        </div>
        <SectionLabel color="#ffee00">★ Polls to Score</SectionLabel>
        {polls.length===0?<div style={{ textAlign:"center",padding:80,color:"#506880",fontFamily:"'Share Tech Mono',monospace" }}>No polls yet.</div>:(
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
            {polls.map(p=><PollCard key={p.id} poll={p} sirScored={p.sirScored} onOpen={()=>onPoll(p.id)}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function StudentDashboard({ profile, onPoll, onLogout }) {
  const [polls, setPolls] = useState([]);
  useEffect(()=>{
    (async()=>{
      const { data } = await supabase.from("polls").select("*").order("created_at",{ascending:false});
      if(!data) return;
      const enriched = await Promise.all(data.map(async p=>{
        const { data:m } = await supabase.from("student_marks").select("id").eq("poll_id",p.id).eq("student_id",profile.id).limit(1);
        return {...p,marked:(m&&m.length>0)};
      }));
      setPolls(enriched);
    })();
  },[profile.id]);
  return (
    <div style={{ minHeight:"100vh", position:"relative", zIndex:1 }}>
      <SiteHeader profile={profile} onLogout={onLogout}/>
      <div style={{ maxWidth:900, margin:"0 auto", padding:"32px 20px" }}>
        <SectionLabel>Open Polls — Give Your Marks</SectionLabel>
        {polls.length===0?<div style={{ textAlign:"center",padding:80,color:"#506880",fontFamily:"'Share Tech Mono',monospace" }}>No polls available.</div>:(
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:16 }}>
            {polls.map(p=><PollCard key={p.id} poll={p} marked={p.marked} onOpen={()=>onPoll(p.id)}/>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// POLL SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function PollScreen({ pollId, profile, onBack, toast }) {
  const [poll,       setPoll]     = useState(null);
  const [teams,      setTeams]    = useState([]);
  const [scores,     setScores]   = useState([]);
  const [sirInputs,  setSirIn]    = useState({});
  const [studInputs, setStudIn]   = useState({});
  const [sirSaved,   setSirSaved] = useState(false);
  const [studDone,   setStudDone] = useState(false);
  const [totalMark,  setTotalMk]  = useState(0);

  const sirInitDone  = useRef(false);
  const studInitDone = useRef(false);

  const isAdmin   = profile.role==="admin";
  const isSir     = profile.role==="sir";
  const isStudent = profile.role==="student";

  // ── Refresh scores only (never resets inputs) ───────────────────────────────
  const refreshScores = useCallback(async () => {
    const [{ data:p },{ data:t },{ data:m }] = await Promise.all([
      supabase.from("polls").select("*").eq("id",pollId).single(),
      supabase.from("teams").select("*").eq("poll_id",pollId).order("position"),
      supabase.from("student_marks").select("*").eq("poll_id",pollId),
    ]);
    if (!p||!t) return;
    setPoll(p); setTeams(t);
    setScores(calcTeamScores(t, m||[]));
    setSirSaved(t.every(tm=>tm.sir_score!==null&&tm.sir_score!==undefined));
    // unique student count
    const unique = new Set((m||[]).map(x=>x.student_id)).size;
    setTotalMk(unique);
    if (isStudent) {
      const myMarks = (m||[]).filter(x=>x.student_id===profile.id);
      setStudDone(myMarks.length===t.length&&myMarks.length>0);
    }
  }, [pollId, isStudent, profile.id]);

  // ── Initial load — also pre-fills inputs ───────────────────────────────────
  const initialLoad = useCallback(async () => {
    const [{ data:p },{ data:t },{ data:m }] = await Promise.all([
      supabase.from("polls").select("*").eq("id",pollId).single(),
      supabase.from("teams").select("*").eq("poll_id",pollId).order("position"),
      supabase.from("student_marks").select("*").eq("poll_id",pollId),
    ]);
    if (!p||!t) return;
    setPoll(p); setTeams(t);
    setScores(calcTeamScores(t,m||[]));
    setSirSaved(t.every(tm=>tm.sir_score!==null&&tm.sir_score!==undefined));
    const unique = new Set((m||[]).map(x=>x.student_id)).size;
    setTotalMk(unique);

    if ((isSir||isAdmin)&&!sirInitDone.current) {
      const init={};
      t.forEach(tm=>{ init[tm.id]=tm.sir_score!==null&&tm.sir_score!==undefined?String(tm.sir_score):""; });
      setSirIn(init); sirInitDone.current=true;
    }
    if (isStudent&&!studInitDone.current) {
      const myM=(m||[]).filter(x=>x.student_id===profile.id);
      const init={}; t.forEach(tm=>{ const f=myM.find(x=>x.team_id===tm.id); init[tm.id]=f?String(f.score):""; });
      setStudIn(init);
      setStudDone(myM.length===t.length&&myM.length>0);
      studInitDone.current=true;
    }
  }, [pollId,isSir,isAdmin,isStudent,profile.id]);

  useEffect(()=>{ initialLoad(); const iv=setInterval(refreshScores,6000); return()=>clearInterval(iv); },[initialLoad,refreshScores]);

  if (!poll) return <div style={{ color:"#506880",padding:60,textAlign:"center",fontFamily:"monospace",position:"relative",zIndex:1 }}>Loading…</div>;

  const canSirMark  = (isSir||isAdmin)&&!poll.closed;
  const canStudMark = isStudent&&!poll.closed&&!studDone;
  const showBoard   = isAdmin||isSir||poll.closed||studDone;
  const pollUrl     = `${window.location.origin}${window.location.pathname}?poll=${pollId}`;
  const rankEmoji   = ["🥇","🥈","🥉"];

  async function submitSirMarks() {
    for(const t of teams){
      const v=sirInputs[t.id]; if(v===""||v===undefined) return toast(`Enter mark for "${t.name}"`,"error");
      const n=Number(v); if(isNaN(n)||n<0||n>100) return toast(`"${t.name}" must be 0–100`,"error");
    }
    for(const t of teams){
      await supabase.from("teams").update({sir_score:Number(sirInputs[t.id])}).eq("id",t.id);
    }
    toast("✓ Sir's marks saved!","success"); refreshScores();
  }

  async function submitStudentMarks() {
    for(const t of teams){
      const v=studInputs[t.id]; if(v===""||v===undefined) return toast(`Enter mark for "${t.name}"`,"error");
      const n=Number(v); if(isNaN(n)||n<0||n>100) return toast(`"${t.name}" must be 0–100`,"error");
    }
    const rows = teams.map(t=>({ poll_id:pollId, team_id:t.id, student_id:profile.id, score:Number(studInputs[t.id]) }));
    const { error } = await supabase.from("student_marks").upsert(rows,{onConflict:"poll_id,team_id,student_id"});
    if(error) return toast(error.message,"error");
    toast("✓ Marks submitted! Locked permanently.","success");
    setStudDone(true); refreshScores();
  }

  async function closePoll() {
    await supabase.from("polls").update({closed:true}).eq("id",pollId);
    toast("Poll closed!","info"); refreshScores();
  }

  const winner = scores[0];

  return (
    <div style={{ minHeight:"100vh", position:"relative", zIndex:1 }}>
      <div style={{ position:"sticky",top:0,background:"rgba(2,4,14,.95)",backdropFilter:"blur(22px)",borderBottom:"1px solid rgba(0,245,255,.13)",padding:"12px 28px",display:"flex",alignItems:"center",gap:18,zIndex:100 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:"#506880",cursor:"pointer",fontFamily:"'Share Tech Mono',monospace",fontSize:13 }}>← Dashboard</button>
        <div style={{ flex:1,fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:"#00f5ff",letterSpacing:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{poll.name}</div>
        <Tag color={poll.closed?"#ff006e":"#00ff88"}>{poll.closed?"⬤ CLOSED":"⬤ LIVE"}</Tag>
      </div>

      <div style={{ maxWidth:900,margin:"0 auto",padding:"28px 20px" }}>

        {/* Top info + QR */}
        <div style={{ display:"flex",gap:24,marginBottom:28,flexWrap:"wrap",alignItems:"flex-start" }}>
          <div style={{ flex:1,minWidth:240 }}>
            {poll.description&&<div style={{ color:"#506880",fontSize:14,marginBottom:14 }}>{poll.description}</div>}
            <div style={{ display:"flex",gap:28,marginBottom:20 }}>
              <StatBox val={totalMark} label="Students Marked" color="#00f5ff"/>
              <StatBox val={teams.length} label="Teams" color="#bf00ff"/>
            </div>
            {isAdmin&&!poll.closed&&<Btn variant="danger" small onClick={closePoll}>🔒 Close Poll</Btn>}
          </div>
          {(isAdmin||isSir)&&(
            <div style={{ background:"rgba(0,8,28,.92)",border:"1px solid rgba(191,0,255,.35)",borderRadius:12,padding:18,textAlign:"center",boxShadow:"0 0 24px rgba(191,0,255,.13)",flexShrink:0 }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:"#bf00ff",letterSpacing:2,marginBottom:10,textTransform:"uppercase" }}>📲 Share With Students</div>
              <QRImage url={pollUrl} size={140}/>
              <button onClick={()=>{try{navigator.clipboard.writeText(pollUrl);}catch{}toast("Link copied!","success");}}
                style={{ marginTop:12,background:"rgba(191,0,255,.15)",border:"1px solid rgba(191,0,255,.4)",color:"#bf00ff",borderRadius:6,padding:"7px 16px",cursor:"pointer",fontFamily:"'Share Tech Mono',monospace",fontSize:11,width:"100%" }}>
                📋 Copy Link
              </button>
            </div>
          )}
        </div>

        {/* Winner */}
        {poll.closed&&winner&&(
          <div style={{ background:"linear-gradient(135deg,rgba(255,215,0,.08),rgba(191,0,255,.1))",border:"1px solid rgba(255,215,0,.32)",borderRadius:14,padding:"26px 28px",marginBottom:28,textAlign:"center",boxShadow:"0 0 44px rgba(255,215,0,.08)" }}>
            <div style={{ fontSize:50,marginBottom:4 }}>🏆</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,color:"#ffd700",letterSpacing:5,marginBottom:6 }}>WINNER</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:28,fontWeight:900,color:"#fff",letterSpacing:3,textShadow:"0 0 32px rgba(255,215,0,.55)" }}>{winner.name}</div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:14,color:"#ffd700",marginTop:10 }}>Final Score: {winner.finalScore.toFixed(1)} / 100</div>
          </div>
        )}

        {/* Submitted notice */}
        {studDone&&isStudent&&(
          <div style={{ background:"rgba(0,255,136,.07)",border:"1px solid rgba(0,255,136,.28)",borderRadius:8,padding:"12px 18px",marginBottom:20,color:"#00ff88",fontFamily:"'Share Tech Mono',monospace",fontSize:13 }}>
            ✓ Your marks have been submitted and locked.
          </div>
        )}

        {/* Leaderboard */}
        {showBoard&&scores.length>0&&(
          <>
            <SectionLabel color="#bf00ff">Leaderboard</SectionLabel>
            <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:28 }}>
              {scores.map((team,idx)=>{
                const rank=idx+1, rankCol=rank===1?"#ffd700":rank===2?"#c0c0c0":rank===3?"#cd7f32":"#506880";
                const hasSir=team.sirScore!==null&&team.sirScore!==undefined;
                return (
                  <div key={team.id} style={{ background:"rgba(0,16,50,.65)",border:"1px solid rgba(0,245,255,.17)",borderRadius:11,padding:"18px 22px",display:"flex",alignItems:"center",gap:18,flexWrap:"wrap" }}>
                    <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:22,fontWeight:900,minWidth:44,textAlign:"center",color:rankCol,textShadow:rank<=3?`0 0 16px ${rankCol}88`:"none" }}>
                      {rank<=3?rankEmoji[rank-1]:`#${rank}`}
                    </div>
                    <div style={{ minWidth:130,flex:"0 0 auto" }}>
                      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,color:"#dff0ff",letterSpacing:1 }}>{team.name}</div>
                    </div>
                    <div style={{ flex:1,minWidth:220 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",fontFamily:"'Share Tech Mono',monospace",fontSize:11,marginBottom:3 }}>
                        <span style={{ color:"#506880" }}>★ Sir's Mark (50%)</span>
                        <span style={{ color:"#ffee00" }}>{hasSir?`${team.sirScore}/100`:"—"}</span>
                      </div>
                      <Bar pct={hasSir?team.sirScore:0} color="#ffee00"/>
                      <div style={{ display:"flex",justifyContent:"space-between",fontFamily:"'Share Tech Mono',monospace",fontSize:11,marginBottom:3,marginTop:8 }}>
                        <span style={{ color:"#506880" }}>⬤ Students avg (50%) — {team.studentCount} submitted</span>
                        <span style={{ color:"#00f5ff" }}>{team.avgStudent.toFixed(1)}/100</span>
                      </div>
                      <Bar pct={team.avgStudent} color="#00f5ff"/>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10 }}>
                        <span style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#506880" }}>FINAL SCORE</span>
                        <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:900,color:"#00ff88",textShadow:"0 0 12px rgba(0,255,136,.55)" }}>
                          {hasSir?team.finalScore.toFixed(1):"—"}
                        </span>
                      </div>
                      <Bar pct={hasSir?team.finalScore:0} color="#00ff88" height={7}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Student marks panel */}
        {isStudent&&(
          <Panel accent="#00f5ff" style={{ marginBottom:20 }}>
            <SectionLabel color="#00f5ff">
              {canStudMark?"⬤ Your Marks — Score Each Team Out of 100":"⬤ Your Submitted Marks"}
            </SectionLabel>
            <div style={{ background:"rgba(0,245,255,.05)",border:"1px solid rgba(0,245,255,.15)",borderRadius:8,padding:"11px 16px",marginBottom:22,fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#00f5ff",lineHeight:1.8 }}>
              Your marks = <strong>50%</strong> of final score (averaged with all students). Sir's marks = <strong>50%</strong>.
              {studDone&&<><br/><span style={{ color:"#00ff88" }}>✓ Submitted and locked permanently.</span></>}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14,marginBottom:22 }}>
              {teams.map(t=>(
                <ScoreCard key={t.id} team={t} initVal={studInputs[t.id]} color="#00f5ff" disabled={!canStudMark}
                  onChange={(id,v)=>setStudIn(s=>({...s,[id]:v}))}/>
              ))}
            </div>
            {canStudMark&&(
              <>
                <Btn color="#00f5ff" onClick={submitStudentMarks}>⚡ Submit My Marks</Btn>
                <div style={{ marginTop:8,fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"#506880" }}>Marks are locked after submission.</div>
              </>
            )}
          </Panel>
        )}

        {/* Sir marks panel */}
        {(isSir||isAdmin)&&(
          <Panel accent="#ffee00">
            <SectionLabel color="#ffee00">★ Sir's Marks — Score Each Team Out of 100</SectionLabel>
            <div style={{ background:"rgba(255,238,0,.06)",border:"1px solid rgba(255,238,0,.18)",borderRadius:8,padding:"11px 16px",marginBottom:22,fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#ffee00",lineHeight:1.8 }}>
              Sir's marks = <strong>50%</strong> of final score. Student average = <strong>50%</strong>.
            </div>
            {sirSaved&&<div style={{ background:"rgba(0,255,136,.07)",border:"1px solid rgba(0,255,136,.28)",borderRadius:8,padding:"10px 16px",marginBottom:20,color:"#00ff88",fontFamily:"'Share Tech Mono',monospace",fontSize:12 }}>✓ Marks saved! Update anytime before closing.</div>}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14,marginBottom:22 }}>
              {teams.map(t=>(
                <ScoreCard key={t.id} team={t} initVal={sirInputs[t.id]} color="#ffee00" disabled={poll.closed}
                  onChange={(id,v)=>setSirIn(s=>({...s,[id]:v}))}/>
              ))}
            </div>
            {!poll.closed
              ?<Btn color="#ffee00" onClick={submitSirMarks}>★ Save All Marks</Btn>
              :<div style={{ fontFamily:"'Share Tech Mono',monospace",fontSize:12,color:"#506880" }}>Poll closed — marks are final.</div>}
          </Panel>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [authState, setAuthState] = useState("loading"); // loading|login|role_setup|app
  const [supaUser,  setSupaUser]  = useState(null);
  const [profile,   setProfile]  = useState(null);
  const [screen,    setScreen]   = useState("dashboard");
  const [pollId,    setPollId]   = useState(null);
  const { list:toasts, push:toast } = useToast();

  // Load profile from DB
  async function loadProfile(uid) {
    const { data } = await supabase.from("profiles").select("*").eq("id",uid).single();
    return data;
  }

  useEffect(() => {
    // Handle OAuth redirect
    supabase.auth.getSession().then(async ({ data:{ session } }) => {
      if (!session) { setAuthState("login"); return; }
      setSupaUser(session.user);
      const prof = await loadProfile(session.user.id);
      if (!prof) { setAuthState("login"); return; }
      if (!prof.role || prof.role==="student" && !prof.name) {
        // Check if this is truly first time (no role set yet beyond default)
        setAuthState("role_setup");
      } else {
        setProfile(prof); setAuthState("app");
      }
    });

    // Listen for auth changes
    const { data:{ subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event==="SIGNED_IN"&&session) {
        setSupaUser(session.user);
        // Wait a moment for trigger to create profile
        setTimeout(async () => {
          const prof = await loadProfile(session.user.id);
          if (prof && prof.role) {
            // Check if role was set (not just defaulted)
            const { data:meta } = await supabase.auth.getUser();
            const isNew = !meta?.user?.user_metadata?.role_chosen;
            if (isNew) { setAuthState("role_setup"); }
            else { setProfile(prof); setAuthState("app"); }
          } else {
            setAuthState("role_setup");
          }
        }, 800);
      }
      if (event==="SIGNED_OUT") { setAuthState("login"); setProfile(null); setSupaUser(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check for QR deep link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("poll")) sessionStorage.setItem("hx_qr", params.get("poll"));
  }, []);

  async function onRoleDone(role) {
    // Mark role as chosen in user metadata
    await supabase.auth.updateUser({ data:{ role_chosen:true } });
    const prof = await loadProfile(supaUser.id);
    setProfile(prof);
    // Check QR
    const qr = sessionStorage.getItem("hx_qr");
    if (qr) { sessionStorage.removeItem("hx_qr"); setPollId(qr); setScreen("poll"); }
    setAuthState("app");
  }

  async function logout() {
    await supabase.auth.signOut();
    setAuthState("login"); setProfile(null); setSupaUser(null);
    setScreen("dashboard"); setPollId(null);
  }

  function openPoll(id) { setPollId(id); setScreen("poll"); }
  function goBack()     { setPollId(null); setScreen("dashboard"); }

  // After app loads, check QR
  useEffect(() => {
    if (authState==="app"&&profile) {
      const qr = sessionStorage.getItem("hx_qr");
      if (qr) { sessionStorage.removeItem("hx_qr"); setPollId(qr); setScreen("poll"); }
    }
  }, [authState, profile]);

  return (
    <div style={{ background:"#02040e", minHeight:"100vh", color:"#dff0ff", fontFamily:"'Rajdhani',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600;700&family=Share+Tech+Mono&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}body{background:#02040e;}
        input[type=number]{-moz-appearance:textfield;}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}
        @keyframes toastIn{from{opacity:0;transform:translateX(36px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-track{background:#02040e;}::-webkit-scrollbar-thumb{background:rgba(0,245,255,.28);border-radius:3px;}
        body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(0,245,255,.026) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,.026) 1px,transparent 1px);background-size:52px 52px;animation:gs 24s linear infinite;pointer-events:none;z-index:0;}
        @keyframes gs{from{transform:translateY(0)}to{transform:translateY(52px)}}
        body::after{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.02) 2px,rgba(0,0,0,.02) 4px);pointer-events:none;z-index:9997;}
      `}</style>

      <Particles/>
      <div style={{ position:"fixed",width:520,height:520,borderRadius:"50%",background:"#bf00ff",filter:"blur(110px)",opacity:.06,top:-160,left:-160,pointerEvents:"none",zIndex:0 }}/>
      <div style={{ position:"fixed",width:420,height:420,borderRadius:"50%",background:"#00f5ff",filter:"blur(110px)",opacity:.05,bottom:-120,right:-120,pointerEvents:"none",zIndex:0 }}/>

      {authState==="loading" && (
        <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:1 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:48,height:48,border:"3px solid rgba(0,245,255,.2)",borderTopColor:"#00f5ff",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 16px" }}/>
            <div style={{ fontFamily:"'Share Tech Mono',monospace",color:"#506880",letterSpacing:2 }}>Connecting…</div>
          </div>
        </div>
      )}

      {authState==="login"      && <LoginScreen toast={toast}/>}
      {authState==="role_setup" && supaUser && <RoleSetupScreen user={supaUser} onDone={onRoleDone} toast={toast}/>}

      {authState==="app" && profile && screen==="dashboard" && profile.role==="admin"   && <AdminDashboard   profile={profile} onPoll={openPoll} onLogout={logout} toast={toast}/>}
      {authState==="app" && profile && screen==="dashboard" && profile.role==="sir"     && <SirDashboard     profile={profile} onPoll={openPoll} onLogout={logout}/>}
      {authState==="app" && profile && screen==="dashboard" && profile.role==="student" && <StudentDashboard profile={profile} onPoll={openPoll} onLogout={logout}/>}
      {authState==="app" && profile && screen==="poll"      && <PollScreen pollId={pollId} profile={profile} onBack={goBack} toast={toast}/>}

      <Toasts list={toasts}/>
    </div>
  );
}
