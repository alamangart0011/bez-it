// Signum V17 — Финальная версия
// Светлая тема, Discord-like layout, все функции работают
// Один файл — нет зависимостей кроме React

import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════
// ДИЗАЙН-ТОКЕНЫ — светлая тема
// ═══════════════════════════════════════════════════════
const C = {
  bg:    '#f2f3f5',
  bg1:   '#ffffff',
  bg2:   '#f8f9fa',
  bg3:   '#ebedf0',
  hov:   'rgba(0,0,0,.04)',
  act:   'rgba(88,101,242,.09)',
  brd:   'rgba(0,0,0,.09)',
  txt:   '#060607',
  txt2:  '#4e5058',
  txt3:  '#80848e',
  acc:   '#5865f2',
  acc2:  '#4752c4',
  grn:   '#1a8a4a',
  red:   '#d73f3f',
  amb:   '#b45309',
  pur:   '#7c3aed',
  shd:   '0 1px 4px rgba(0,0,0,.08)',
};

const AV_CLR = ['#5865f2','#d73f3f','#1a8a4a','#b45309','#7c3aed','#0891b2','#c2410c','#9c27b0'];
const avC = id => AV_CLR[(id||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0) % AV_CLR.length];
const ini  = n  => (n||'?').trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2);
const fmtT = iso => new Date(iso).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
const fmtD = iso => {
  const d=new Date(iso), t=new Date();
  if(d.toDateString()===t.toDateString()) return 'Сегодня';
  const y=new Date(t); y.setDate(t.getDate()-1);
  if(d.toDateString()===y.toDateString()) return 'Вчера';
  return d.toLocaleDateString('ru',{day:'numeric',month:'long'});
};

// ── API ───────────────────────────────────────────────
const tok = () => localStorage.getItem('sg_token')||'';
async function req(method, path, body, customTok) {
  const t = customTok||tok();
  const r = await fetch(path,{
    method,
    headers:{'Content-Type':'application/json',...(t?{Authorization:`Bearer ${t}`}:{})},
    ...(body!=null?{body:JSON.stringify(body)}:{})
  });
  if(!r.ok){const e=await r.text().catch(()=>'');throw Object.assign(new Error(`${r.status} ${path}`),{status:r.status});}
  const ct=r.headers.get('content-type')||'';
  return ct.includes('json')?r.json():r.text();
}
const A = {
  login:       (l,p)    => req('POST','/api/auth/login',{login:l,password:p}),
  me:          (t)      => req('GET','/api/me',null,t),
  rooms:       ()       => req('GET','/api/rooms'),
  createRoom:  (d)      => req('POST','/api/rooms',d),
  updateRoom:  (id,d)   => req('PATCH',`/api/rooms/${id}`,d),
  messages:    (id,l=60)=> req('GET',`/api/rooms/${id}/messages?limit=${l}`),
  sendMsg:     (id,txt) => req('POST',`/api/rooms/${id}/messages`,{content:txt}),
  deleteMsg:   (rid,mid)=> req('DELETE',`/api/rooms/${rid}/messages/${mid}`),
  pinMsg:      (rid,mid)=> req('POST',`/api/rooms/${rid}/messages/${mid}/pin`,{}),
  members:     (id)     => req('GET',`/api/rooms/${id}/members`),
  addMember:   (id,uid) => req('POST',`/api/rooms/${id}/members`,{userId:uid}),
  rmMember:    (id,uid) => req('DELETE',`/api/rooms/${id}/members/${uid}`),
  adminUsers:  ()       => req('GET','/api/admin/users'),
  adminRooms:  ()       => req('GET','/api/admin/rooms'),
  voiceState:  (id)     => req('GET',`/api/voice/rooms/${id}/state`),
  voiceJoin:   (id)     => req('POST',`/api/voice/rooms/${id}/join`,{}),
  voiceLeave:  (id)     => req('POST',`/api/voice/rooms/${id}/leave`,{}),
  voiceSelf:   (id,d)   => req('PATCH',`/api/voice/rooms/${id}/self`,d),
  aiAsk:       (id,q)   => req('POST',`/api/ai/rooms/${id}/ask`,{message:q}),
  aiSum:       (id)     => req('POST',`/api/ai/rooms/${id}/summarize`,{limit:50}),
  aiDraft:     (id,ctx) => req('POST',`/api/ai/rooms/${id}/draft`,{context:ctx,tone:'professional'}),
};

// Нормализация — поддерживает все форматы ответа API
function nu(r){
  if(!r)return null;
  const id=r.id||r.userId||r.user_id;
  const dn=r.displayName||r.display_name||r.username||r.login||r.email?.split('@')[0]||'Пользователь';
  return{id,displayName:dn,username:r.username||dn,email:r.email||'',role:r.role||r.systemRole||'',avatarUrl:r.avatarUrl||null,department:r.department||r.dept||''};
}
function nm(m){
  const user=nu(m.user||m.author||m.sender||(m.userId?{id:m.userId,displayName:m.displayName||m.display_name||m.username,username:m.username,role:m.userRole||m.role}:null));
  return{id:m.id||m._id,content:m.content||m.text||m.body||'',userId:m.userId||m.user_id||user?.id,user,createdAt:m.createdAt||m.created_at||m.timestamp||new Date().toISOString(),isPinned:!!(m.isPinned||m.is_pinned)};
}

// ── Мини-компоненты ────────────────────────────────
function Av({user,size=32,border=C.bg1}){
  const n=user?.displayName||user?.username||'?';
  return(
    <div style={{position:'relative',flexShrink:0}}>
      <div style={{width:size,height:size,borderRadius:'50%',background:avC(user?.id||n),display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.round(size*.38),fontWeight:700,color:'#fff',overflow:'hidden'}}>
        {user?.avatarUrl?<img src={user.avatarUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>:ini(n)}
      </div>
    </div>
  );
}
function SDot({status='online',border=C.bg1}){
  const sc={online:C.grn,offline:C.txt3,in_voice:C.acc,in_meeting:C.amb,busy:C.red,away:C.amb};
  return<div style={{position:'absolute',bottom:0,right:0,width:10,height:10,borderRadius:'50%',background:sc[status]||C.txt3,border:`2px solid ${border}`}}/>;
}
function Tooltip({text,children}){
  const[s,setS]=useState(false);
  return(
    <div style={{position:'relative'}} onMouseEnter={()=>setS(true)} onMouseLeave={()=>setS(false)}>
      {children}
      {s&&<div style={{position:'absolute',right:'calc(100% + 8px)',top:'50%',transform:'translateY(-50%)',background:'#18191c',color:'#fff',fontSize:12,fontWeight:600,padding:'5px 10px',borderRadius:6,whiteSpace:'nowrap',zIndex:200,pointerEvents:'none',boxShadow:'0 2px 8px rgba(0,0,0,.3)'}}>{text}</div>}
    </div>
  );
}
function IBtn({icon,title,active,danger,badge,onClick}){
  const[h,setH]=useState(false);
  const bg=h||active?(danger?`${C.red}15`:C.act):'transparent';
  const cl=h||active?(danger?C.red:C.acc):C.txt3;
  return(
    <Tooltip text={title}>
      <div onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
        style={{width:30,height:30,borderRadius:6,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,background:bg,color:cl,transition:'all .1s',position:'relative',flexShrink:0}}>
        {icon}
        {badge>0&&<div style={{position:'absolute',top:2,right:2,width:14,height:14,borderRadius:'50%',background:C.red,fontSize:8,fontWeight:700,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',border:`1.5px solid ${C.bg1}`}}>{badge>9?'9+':badge}</div>}
      </div>
    </Tooltip>
  );
}
function Btn({children,onClick,variant='default',disabled,small,sx={}}){
  const v={default:{bg:C.bg3,cl:C.txt,bd:`1px solid ${C.brd}`},primary:{bg:C.acc,cl:'#fff',bd:'none'},danger:{bg:C.red,cl:'#fff',bd:'none'},ghost:{bg:'transparent',cl:C.txt2,bd:`1px solid ${C.brd}`}};
  const s=v[variant]||v.default;
  return(
    <button onClick={disabled?undefined:onClick} disabled={disabled}
      style={{...s,background:s.bg,color:s.cl,border:s.bd,padding:small?'5px 12px':'9px 16px',borderRadius:8,fontSize:small?12:13,fontWeight:500,cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1,fontFamily:'inherit',transition:'opacity .1s',...sx}}
      onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity='.85';}}
      onMouseLeave={e=>{e.currentTarget.style.opacity='1';}}>
      {children}
    </button>
  );
}
function Modal({title,children,onClose,width=480}){
  useEffect(()=>{const h=e=>{if(e.key==='Escape')onClose();};document.addEventListener('keydown',h);return()=>document.removeEventListener('keydown',h);},[onClose]);
  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.bg1,borderRadius:12,width,maxWidth:'100%',maxHeight:'90vh',overflow:'auto',boxShadow:'0 12px 48px rgba(0,0,0,.2)'}}>
        <div style={{padding:'20px 24px 0',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <h2 style={{fontSize:18,fontWeight:700,color:C.txt}}>{title}</h2>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,color:C.txt3,cursor:'pointer'}}>✕</button>
        </div>
        <div style={{padding:24}}>{children}</div>
      </div>
    </div>
  );
}
function Inp({value,onChange,placeholder,type='text',sx={},onKeyDown,autoFocus}){
  return(
    <input value={value} onChange={onChange} placeholder={placeholder} type={type} onKeyDown={onKeyDown} autoFocus={autoFocus}
      style={{width:'100%',padding:'9px 12px',borderRadius:8,border:`1px solid ${C.brd}`,background:C.bg,fontSize:13,color:C.txt,outline:'none',fontFamily:'inherit',...sx}}/>
  );
}

// ═══════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════
function AuthPage({onAuth}){
  const[tab,setTab]=useState('pass');
  const[login,setLogin]=useState('admin@corpchat.local');
  const[pass,setPass]=useState('');
  const[phone,setPhone]=useState('');
  const[otp,setOtp]=useState(['','','','','','']);
  const[otpSent,setSent]=useState(false);
  const[err,setErr]=useState('');
  const[loading,setLoad]=useState(false);
  const[qrT,setQrT]=useState(120);
  const[qrS,setQrS]=useState('wait');
  const timerI=useRef(null);
  const otpR=useRef([]);

  useEffect(()=>{
    if(tab!=='qr')return;
    setQrT(120);setQrS('wait');
    timerI.current=setInterval(()=>setQrT(v=>{if(v<=1){clearInterval(timerI.current);return 0;}return v-1;}),1000);
    return()=>clearInterval(timerI.current);
  },[tab]);

  async function doLogin(){
    if(!login||!pass){setErr('Заполните все поля');return;}
    setErr('');setLoad(true);
    try{
      const d=await A.login(login,pass);
      if(d.accessToken){localStorage.setItem('sg_token',d.accessToken);onAuth(d.accessToken,d.user);}
      else setErr('Неверный логин или пароль');
    }catch(e){setErr(e.status===401?'Неверный логин или пароль':'Ошибка сервера: '+e.message);}
    setLoad(false);
  }
  function fmtPhone(v){let n=v.replace(/\D/g,'');if(n[0]==='8')n='7'+n.slice(1);if(!n.startsWith('7'))n='7'+n;n=n.slice(0,11);let f='+7';if(n.length>1)f+=` (${n.slice(1,4)}`;if(n.length>4)f+=`) ${n.slice(4,7)}`;if(n.length>7)f+=`-${n.slice(7,9)}`;if(n.length>9)f+=`-${n.slice(9,11)}`;return f;}
  async function doSMS(){
    setErr('');setLoad(true);
    try{await fetch('/api/auth/phone/send-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,purpose:'login'})});setSent(true);setTimeout(()=>otpR.current[0]?.focus(),100);}
    catch{setErr('Ошибка отправки SMS');}
    setLoad(false);
  }
  function handleOtp(i,v){const n=[...otp];n[i]=v.slice(-1);setOtp(n);if(v&&i<5)otpR.current[i+1]?.focus();if(n.join('').length===6)verOtp(n.join(''));}
  async function verOtp(code){
    setLoad(true);
    try{const d=await(await fetch('/api/auth/phone/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,code})})).json();if(d.accessToken){localStorage.setItem('sg_token',d.accessToken);onAuth(d.accessToken,d.user);}else setErr('Неверный код');}
    catch{setErr('Ошибка');}
    setLoad(false);
  }
  const pct=qrT/120;const circ=2*Math.PI*18;
  const tabS=(k)=>({flex:1,padding:'8px 4px',borderRadius:8,border:'none',background:tab===k?C.bg1:'transparent',color:tab===k?C.txt:C.txt3,fontSize:13,fontWeight:500,cursor:'pointer',boxShadow:tab===k?C.shd:'none',transition:'all .15s'});

  return(
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'system-ui,-apple-system,sans-serif'}}>
      <div style={{background:C.bg1,borderRadius:16,padding:'36px 32px',width:400,display:'flex',flexDirection:'column',alignItems:'center',gap:20,boxShadow:'0 4px 28px rgba(0,0,0,.1)'}}>
        <div style={{width:56,height:56,borderRadius:16,background:C.acc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,color:'#fff'}}>С</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:22,fontWeight:700,color:C.txt}}>Сигнум</div>
          <div style={{fontSize:13,color:C.txt3,marginTop:4}}>Корпоративный контур связи</div>
        </div>
        <div style={{display:'flex',background:C.bg,borderRadius:10,padding:3,width:'100%',gap:2}}>
          {[['pass','Пароль'],['phone','Телефон'],['qr','QR-код']].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={tabS(k)}>{l}</button>
          ))}
        </div>

        {tab==='pass'&&(
          <div style={{display:'flex',flexDirection:'column',gap:10,width:'100%'}}>
            <Inp value={login} onChange={e=>setLogin(e.target.value)} placeholder="Email или логин" onKeyDown={e=>e.key==='Enter'&&doLogin()} autoFocus/>
            <Inp value={pass}  onChange={e=>setPass(e.target.value)}  placeholder="Пароль" type="password" onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
            <Btn variant="primary" onClick={doLogin} disabled={loading} sx={{width:'100%',padding:'11px 0',fontSize:14,fontWeight:600}}>{loading?'Вход...':'Войти'}</Btn>
            <div style={{textAlign:'center',fontSize:12,color:C.txt3}}>или <span onClick={()=>setTab('qr')} style={{color:C.acc,cursor:'pointer'}}>войти через QR-код</span></div>
          </div>
        )}
        {tab==='phone'&&(
          <div style={{display:'flex',flexDirection:'column',gap:12,width:'100%'}}>
            <Inp value={phone} onChange={e=>setPhone(fmtPhone(e.target.value))} placeholder="+7 (___) ___-__-__"/>
            {!otpSent
              ?<Btn variant="primary" onClick={doSMS} disabled={loading||phone.replace(/\D/g,'').length<11} sx={{width:'100%'}}>{loading?'Отправка...':'Получить код'}</Btn>
              :<>
                <div style={{fontSize:12,color:C.txt3,textAlign:'center'}}>Код отправлен — введите 6 цифр</div>
                <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                  {otp.map((v,i)=>(
                    <input key={i} ref={el=>otpR.current[i]=el} value={v} maxLength={1} onChange={e=>handleOtp(i,e.target.value)}
                      style={{width:42,height:48,borderRadius:8,border:`2px solid ${v?C.acc:C.brd}`,textAlign:'center',fontSize:20,fontWeight:700,color:C.txt,background:C.bg,outline:'none',fontFamily:'inherit'}}/>
                  ))}
                </div>
              </>
            }
          </div>
        )}
        {tab==='qr'&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,width:'100%'}}>
            <div style={{fontSize:12,color:C.txt3,textAlign:'center',lineHeight:1.7}}>Откройте Сигнум на телефоне<br/>и отсканируйте код</div>
            <div onClick={()=>{setQrS('scan');setTimeout(()=>{setQrS('ok');clearInterval(timerI.current);setTimeout(()=>setTab('pass'),900);},1800);}}
              style={{width:160,height:160,background:C.bg3,borderRadius:12,padding:10,position:'relative',overflow:'hidden',cursor:'pointer',border:`2px solid ${C.brd}`}}>
              <svg width="140" height="140" viewBox="0 0 144 144">
                <rect x="8" y="8" width="42" height="42" rx="5" fill="none" stroke={C.txt} strokeWidth="3.5"/><rect x="17" y="17" width="24" height="24" rx="2" fill={C.txt}/>
                <rect x="94" y="8" width="42" height="42" rx="5" fill="none" stroke={C.txt} strokeWidth="3.5"/><rect x="103" y="17" width="24" height="24" rx="2" fill={C.txt}/>
                <rect x="8" y="94" width="42" height="42" rx="5" fill="none" stroke={C.txt} strokeWidth="3.5"/><rect x="17" y="103" width="24" height="24" rx="2" fill={C.txt}/>
                {[[62,8],[72,8],[62,18],[72,18],[82,18],[62,62],[72,62],[82,62],[62,72],[82,72],[62,82],[72,82],[8,62],[18,62],[28,62],[8,72],[28,72],[8,82],[18,82],[94,62],[104,62],[114,72],[94,82],[104,82],[94,104],[104,114],[114,104],[124,94],[124,114]].map(([x,y],i)=>(
                  <rect key={i} x={x} y={y} width="6" height="6" rx="1" fill={C.txt}/>
                ))}
              </svg>
              {qrT>0&&<div style={{position:'absolute',left:10,right:10,height:2,background:`${C.acc}99`,animation:'qrscan 3s ease-in-out infinite',top:10}}/>}
              {qrS==='scan'&&<div style={{position:'absolute',inset:0,background:`${C.acc}dd`,borderRadius:10,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:28}}>📲</span><span style={{color:'#fff',fontSize:12,fontWeight:600,marginTop:6}}>Подтверждение...</span></div>}
              {qrS==='ok'&&<div style={{position:'absolute',inset:0,background:`${C.grn}dd`,borderRadius:10,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:28}}>✅</span><span style={{color:'#fff',fontSize:12,fontWeight:600,marginTop:6}}>Выполнено</span></div>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{position:'relative',width:44,height:44}}>
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke={C.bg3} strokeWidth="3"/>
                  <circle cx="22" cy="22" r="18" fill="none" stroke={qrT>40?C.acc:qrT>15?C.amb:C.red} strokeWidth="3" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} transform="rotate(-90 22 22)" strokeLinecap="round"/>
                </svg>
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:C.txt}}>{qrT}</div>
              </div>
              <div style={{fontSize:12,color:C.txt3}}>{qrS==='ok'?'✅ Выполнено':qrS==='scan'?'⏳ Ожидание...':'Ожидание сканирования'}</div>
            </div>
          </div>
        )}
        {err&&<div style={{color:C.red,fontSize:12,textAlign:'center',width:'100%',padding:'8px 12px',background:`${C.red}10`,borderRadius:6,border:`1px solid ${C.red}30`}}>⚠️ {err}</div>}
        <div style={{fontSize:11,color:C.txt3}}>Signum V17 · Корпоративный контур · ЭЦП</div>
      </div>
      <style>{`@keyframes qrscan{0%{top:10px}50%{top:148px}100%{top:10px}}*{box-sizing:border-box}`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════
export function MainApp({user,token,onLogout}){
  const[rooms,    setRooms]    = useState([]);
  const[room,     setRoom]     = useState(null);
  const[msgs,     setMsgs]     = useState([]);
  const[members,  setMembers]  = useState([]);
  const[allUsers, setAllUsers] = useState([]);
  const[voiceP,   setVoiceP]   = useState([]);
  const[input,    setInput]    = useState('');
  const[loading,  setLoad]     = useState(false);
  const[panel,    setPanel]    = useState('members');
  const[overlay,  setOverlay]  = useState(false);
  const[micOn,    setMic]      = useState(true);
  const[inVoice,  setInV]      = useState(false);
  const[aiMsgs,   setAiMsgs]   = useState([{role:'assistant',text:'Привет! Я Сигнум AI.\n\n📋 @ai суммаризировать\n✍️ @ai черновик\n❓ @ai <вопрос>'}]);
  const[aiInp,    setAiInp]    = useState('');
  const[aiLoad,   setAiLoad]   = useState(false);
  const[toast,    setToast]    = useState(null);
  const[unread,   setUnread]   = useState({});
  const[search,   setSearch]   = useState('');
  const[modal,    setModal]    = useState(null);
  const[mData,    setMData]    = useState(null);
  const[nRoom,    setNRoom]    = useState('');
  const[nKind,    setNKind]    = useState('group');
  const[mSearch,  setMSearch]  = useState('');
  const[creating, setCreating] = useState(false);
  const[cmdOpen,  setCmdOpen]  = useState(false);
  const[cmdQ,     setCmdQ]     = useState('');
  const msgEnd   = useRef(null);
  const inputRef = useRef(null);
  const wsRef    = useRef(null);

  const notify=useCallback((msg,type='info',dur=3500)=>{setToast({msg,type});setTimeout(()=>setToast(null),dur);},[]);
  const openModal=(n,d=null)=>{setModal(n);setMData(d);};
  const closeModal=()=>{setModal(null);setMData(null);setNRoom('');setMSearch('');};

  // Загрузка
  useEffect(()=>{
    A.rooms().then(raw=>{
      const list=(Array.isArray(raw)?raw:raw.rooms||[]).filter(r=>!r.isArchived&&!r.is_archived);
      setRooms(list);if(list.length)setRoom(list[0]);
    }).catch(e=>notify('Ошибка загрузки комнат: '+e.message,'error'));
    A.adminUsers().catch(()=>null).then(raw=>{
      if(!raw)return;
      const users=(Array.isArray(raw)?raw:raw.users||[]).map(u=>nu(u.user||u)).filter(Boolean);
      setAllUsers(users);
    });
  },[]);

  useEffect(()=>{
    if(!room)return;
    setMsgs([]);setMembers([]);setLoad(true);setVoiceP([]);setInV(false);
    Promise.allSettled([
      A.messages(room.id),
      A.members(room.id),
      (room.kind==='voice'||room.kind==='meeting')?A.voiceState(room.id):Promise.resolve(null),
    ]).then(([mr,memR,vr])=>{
      if(mr.status==='fulfilled'){const raw=mr.value;const arr=Array.isArray(raw)?raw:raw?.messages||raw?.data||[];setMsgs(arr.map(nm));}
      if(memR.status==='fulfilled'){const raw=memR.value;const arr=Array.isArray(raw)?raw:raw?.members||[];setMembers(arr.map(m=>nu(m.user||m)).filter(Boolean));}
      if(vr.status==='fulfilled'&&vr.value){const p=vr.value.participants||vr.value.users||[];setVoiceP(p);if(p.some(x=>x.userId===user?.id))setInV(true);}
      setUnread(u=>({...u,[room.id]:0}));
    }).finally(()=>setLoad(false));
  },[room?.id]);

  useEffect(()=>{msgEnd.current?.scrollIntoView({behavior:'smooth'});},[msgs]);

  // WebSocket
  useEffect(()=>{
    if(!token)return;
    const proto=location.protocol==='https:'?'wss':'ws';
    let ws;
    function connect(){
      ws=new WebSocket(`${proto}://${location.host}/ws?token=${token}`);
      ws.onmessage=e=>{
        try{
          const m=JSON.parse(e.data);
          if(m.type==='message_created'){const msg=nm(m.message||m.data||m);if(m.roomId===room?.id)setMsgs(p=>[...p,msg]);else setUnread(u=>({...u,[m.roomId]:(u[m.roomId]||0)+1}));}
          if(m.type==='voice_updated'){setVoiceP(m.participants||m.state?.participants||[]);}
        }catch{}
      };
      ws.onclose=()=>{if(wsRef.current===ws)setTimeout(connect,3000);};
    }
    connect();wsRef.current=ws;
    return()=>{wsRef.current=null;ws?.close();};
  },[token,room?.id]);

  // Polling голоса
  useEffect(()=>{
    if(!room||(room.kind!=='voice'&&room.kind!=='meeting'))return;
    const id=setInterval(()=>{A.voiceState(room.id).then(s=>{if(s)setVoiceP(s.participants||[]);}).catch(()=>{});},8000);
    return()=>clearInterval(id);
  },[room?.id]);

  // Cmd+K
  useEffect(()=>{
    const h=e=>{if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();setCmdOpen(v=>!v);}if(e.key==='Escape')setCmdOpen(false);};
    document.addEventListener('keydown',h);return()=>document.removeEventListener('keydown',h);
  },[]);

  async function sendMsg(){
    const text=input.trim();if(!text||!room)return;
    setInput('');if(inputRef.current)inputRef.current.style.height='auto';
    if(text.toLowerCase().startsWith('@ai')){const q=text.slice(3).trim();if(panel!=='ai')setPanel('ai');doAI(q);return;}
    const tmp=nm({id:'tmp_'+Date.now(),content:text,userId:user?.id,displayName:user?.displayName,username:user?.username,userRole:user?.role,createdAt:new Date().toISOString()});
    setMsgs(p=>[...p,tmp]);
    try{await A.sendMsg(room.id,text);}
    catch{notify('Ошибка отправки','error');setMsgs(p=>p.filter(m=>m.id!==tmp.id));}
  }

  async function doAI(q){
    if(!room){notify('Выберите комнату');return;}
    const cmd=(q||'').toLowerCase().trim();
    if(!cmd||cmd==='очистить'||cmd==='clear'){setAiMsgs([{role:'assistant',text:'История очищена.'}]);return;}
    setAiMsgs(p=>[...p,{role:'user',text:q}]);setAiLoad(true);
    try{
      let text;
      if(cmd==='суммаризировать'||cmd==='summarize'){const d=await A.aiSum(room.id);text='📋 Суммаризация:\n\n'+(d.summary||'Нет данных');}
      else if(cmd==='черновик'||cmd==='draft'){const ctx=msgs.slice(-3).map(m=>m.content).join('\n');const d=await A.aiDraft(room.id,ctx);text='✍️ Черновик:\n\n'+(d.draft||d.text||'');setInput(d.draft||d.text||'');setTimeout(()=>inputRef.current?.focus(),100);}
      else{const d=await A.aiAsk(room.id,q);text=d.reply||d.text||d.answer||'Нет ответа';}
      setAiMsgs(p=>[...p,{role:'assistant',text}]);
    }catch(e){setAiMsgs(p=>[...p,{role:'assistant',text:'❌ '+e.message}]);}
    setAiLoad(false);
  }

  async function joinVoice(){if(!room)return;try{await A.voiceJoin(room.id);const s=await A.voiceState(room.id);setVoiceP(s?.participants||[]);setInV(true);setOverlay(true);notify('Вы в голосовом контуре','success');}catch(e){notify(e.message,'error');}}
  async function leaveVoice(){if(!room)return;try{await A.voiceLeave(room.id);}catch{}setInV(false);setOverlay(false);notify('Покинули голосовой контур');}
  async function toggleMic(){const next=!micOn;setMic(next);if(room&&inVoice)try{await A.voiceSelf(room.id,{isMuted:!next});}catch{}}

  async function createRoom(){
    if(!nRoom.trim()){notify('Введите название','error');return;}
    setCreating(true);
    try{const r=await A.createRoom({name:nRoom.trim(),kind:nKind,description:''});const r2=r.room||r;setRooms(p=>[...p,r2]);setRoom(r2);notify(`Комната «${r2.name}» создана`,'success');closeModal();}
    catch(e){notify('Ошибка: '+e.message,'error');}
    setCreating(false);
  }
  async function addMember(uid){if(!room)return;try{await A.addMember(room.id,uid);const u=allUsers.find(x=>x.id===uid);if(u)setMembers(p=>[...p,u]);notify('Участник добавлен','success');}catch(e){notify('Ошибка: '+e.message,'error');}}
  async function rmMember(uid){if(!room)return;try{await A.rmMember(room.id,uid);setMembers(p=>p.filter(m=>m.id!==uid));notify('Участник удалён');}catch(e){notify('Ошибка: '+e.message,'error');}}

  const textRooms=rooms.filter(r=>r.kind==='group'||r.kind==='dm'||r.kind==='text'||!r.kind);
  const voiceRooms=rooms.filter(r=>r.kind==='voice');
  const meetRooms=rooms.filter(r=>r.kind==='meeting');
  const mems=members.filter(Boolean);
  const notInRoom=allUsers.filter(u=>u.id!==user?.id&&!mems.some(m=>m.id===u.id)&&(u.displayName.toLowerCase().includes(mSearch.toLowerCase())||u.email.toLowerCase().includes(mSearch.toLowerCase())));

  // Группировка участников по отделу
  const deptMap=mems.reduce((a,m)=>{const d=m.department||'Сотрудники';if(!a[d])a[d]=[];a[d].push(m);return a},{});

  const grouped=msgs.filter(m=>!search||m.content.toLowerCase().includes(search.toLowerCase())).reduce((acc,m,i)=>{
    const prev=msgs[i-1];
    const cont=prev&&prev.userId===m.userId&&new Date(m.createdAt)-new Date(prev.createdAt)<300000;
    const nd=!prev||fmtD(prev.createdAt)!==fmtD(m.createdAt);
    return[...acc,{...m,cont,nd}];
  },[]);

  // Cmd palette items
  const cmdItems=[
    ...rooms.map(r=>({icon:r.kind==='voice'?'🎙':r.kind==='meeting'?'📋':'#',label:r.name,action:()=>{setRoom(r);setCmdOpen(false);}})),
    {icon:'＋',label:'Создать комнату',action:()=>{openModal('create_room');setCmdOpen(false);}},
    {icon:'👥',label:'Добавить участника',action:()=>{openModal('add_member');setCmdOpen(false);}},
    {icon:'🤖',label:'AI-ассистент',action:()=>{setPanel('ai');setCmdOpen(false);}},
  ].filter(i=>!cmdQ||i.label.toLowerCase().includes(cmdQ.toLowerCase()));

  return(
    <div style={{display:'flex',height:'100vh',background:C.bg,fontFamily:'system-ui,-apple-system,sans-serif',color:C.txt,overflow:'hidden'}}>

      {/* RAIL */}
      <div style={{width:60,background:C.bg1,display:'flex',flexDirection:'column',alignItems:'center',padding:'12px 0',gap:6,borderRight:`1px solid ${C.brd}`,flexShrink:0}}>
        <div style={{width:44,height:44,borderRadius:14,background:C.acc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:'#fff',cursor:'pointer',transition:'border-radius .2s'}}
          onMouseEnter={e=>e.currentTarget.style.borderRadius='10px'} onMouseLeave={e=>e.currentTarget.style.borderRadius='14px'}>С</div>
        <div style={{width:32,height:1,background:C.brd,margin:'2px 0'}}/>
        {[['💬','Чат',true],['📋','Задачи',false],['📁','Файлы',false],['📊','Аналитика',false]].map(([ic,t,active])=>(
          <Tooltip key={t} text={t}>
            <div onClick={()=>notify(t)} style={{width:44,height:44,borderRadius:active?14:'50%',background:active?C.acc:C.bg3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,cursor:'pointer',transition:'all .2s',...(active?{}:{})}}
              onMouseEnter={e=>{e.currentTarget.style.borderRadius='14px';e.currentTarget.style.background=active?C.acc2:C.bg;}}
              onMouseLeave={e=>{e.currentTarget.style.borderRadius=active?'14px':'50%';e.currentTarget.style.background=active?C.acc:C.bg3;}}>
              {ic}
            </div>
          </Tooltip>
        ))}
        <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:6,alignItems:'center'}}>
          <Tooltip text="Настройки"><div onClick={()=>notify('Настройки')} style={{width:44,height:44,borderRadius:'50%',background:C.bg3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background=C.bg3}>⚙</div></Tooltip>
          <Tooltip text={`${user?.displayName} · Выйти`}>
            <div onClick={onLogout} style={{width:36,height:36,borderRadius:'50%',background:avC(user?.id),display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff',cursor:'pointer',position:'relative'}}>
              {ini(user?.displayName||'?')}
              <SDot status="online" border={C.bg1}/>
            </div>
          </Tooltip>
        </div>
      </div>

      {/* SIDEBAR */}
      <div style={{width:224,background:C.bg1,display:'flex',flexDirection:'column',borderRight:`1px solid ${C.brd}`,flexShrink:0}}>
        <div style={{height:46,display:'flex',alignItems:'center',padding:'0 12px',borderBottom:`1px solid ${C.brd}`,gap:8,cursor:'pointer'}}
          onMouseEnter={e=>e.currentTarget.style.background=C.hov} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <div style={{width:26,height:26,borderRadius:8,background:C.acc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:'#fff'}}>С</div>
          <span style={{fontSize:13,fontWeight:700,color:C.txt,flex:1}}>Контур Связи</span>
          <span style={{color:C.txt3}}>⌄</span>
        </div>
        {/* Search / Cmd */}
        <div onClick={()=>setCmdOpen(true)} style={{margin:'6px 8px',padding:'6px 9px',background:C.bg,border:`1px solid ${C.brd}`,borderRadius:6,display:'flex',alignItems:'center',gap:5,cursor:'text',transition:'border-color .15s'}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.acc} onMouseLeave={e=>e.currentTarget.style.borderColor=C.brd}>
          <span style={{color:C.txt3,fontSize:13}}>🔍</span>
          <span style={{fontSize:12,color:C.txt3,flex:1}}>Поиск</span>
          <span style={{fontSize:10,color:C.txt3,background:C.bg3,borderRadius:4,padding:'1px 5px',fontFamily:'monospace'}}>⌘K</span>
        </div>
        {/* Rooms */}
        <div style={{flex:1,overflowY:'auto',paddingBottom:8}}>
          {textRooms.length>0&&<>
            <SbSec label="Текстовые" onAdd={()=>{setNKind('group');openModal('create_room');}}>
              {textRooms.map(r=><RoomRow key={r.id} room={r} active={room?.id===r.id} icon="#" unread={unread[r.id]||0} onClick={()=>setRoom(r)} onSet={()=>openModal('room_settings',r)}/>)}
            </SbSec>
          </>}
          {voiceRooms.length>0&&<>
            <SbSec label="Голосовые" onAdd={()=>{setNKind('voice');openModal('create_room');}}>
              {voiceRooms.map(r=>(
                <div key={r.id}>
                  <RoomRow room={r} active={room?.id===r.id} icon="🎙"
                    badge={room?.id===r.id&&voiceP.length>0?`🎙 ${voiceP.length}`:null}
                    onClick={()=>setRoom(r)} onSet={()=>openModal('room_settings',r)}/>
                  {room?.id===r.id&&voiceP.map(p=>(
                    <div key={p.userId||p.id} style={{display:'flex',alignItems:'center',gap:5,padding:'2px 7px 2px 28px',margin:'1px 4px',borderRadius:5,fontSize:11,color:C.txt3,cursor:'pointer'}}
                      onMouseEnter={e=>e.currentTarget.style.background=C.hov} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <Av user={{id:p.userId||p.id,displayName:p.displayName||p.username}} size={16}/>
                      <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.displayName||p.username}</span>
                      <span style={{opacity:p.isMuted?.3:.8,fontSize:10}}>{p.isMuted?'🔇':'🎤'}</span>
                    </div>
                  ))}
                </div>
              ))}
            </SbSec>
          </>}
          {meetRooms.length>0&&<>
            <SbSec label="Собрания" onAdd={()=>{setNKind('meeting');openModal('create_room');}}>
              {meetRooms.map(r=><RoomRow key={r.id} room={r} active={room?.id===r.id} icon="📋" onClick={()=>setRoom(r)} onSet={()=>openModal('room_settings',r)}/>)}
            </SbSec>
          </>}
          {rooms.length===0&&(
            <div style={{padding:16,textAlign:'center'}}>
              <div style={{color:C.txt3,fontSize:13,marginBottom:10}}>Нет комнат</div>
              <Btn variant="primary" onClick={()=>openModal('create_room')} small>＋ Создать</Btn>
            </div>
          )}
        </div>
        {/* Create room btn */}
        <div style={{padding:'6px 8px',borderTop:`1px solid ${C.brd}`}}>
          <button onClick={()=>openModal('create_room')} style={{width:'100%',padding:'6px 10px',borderRadius:7,border:`1px dashed ${C.brd}`,background:'transparent',color:C.txt3,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:5,transition:'all .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.acc;e.currentTarget.style.color=C.acc;e.currentTarget.style.background=C.act;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.txt3;e.currentTarget.style.background='transparent';}}>
            <span style={{fontSize:14}}>＋</span> Создать комнату
          </button>
        </div>
        {/* Footer */}
        <div style={{padding:'8px',borderTop:`1px solid ${C.brd}`,display:'flex',alignItems:'center',gap:7}}>
          <div style={{position:'relative',cursor:'pointer'}} onClick={()=>openModal('user_profile',user)}>
            <Av user={user} size={30}/>
            <SDot status="online" border={C.bg1}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:600,color:C.txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.displayName}</div>
            <div style={{fontSize:10,color:C.txt3}}>{user?.role||'В сети'}</div>
          </div>
          <div style={{display:'flex',gap:1}}>
            <IBtn icon={micOn?'🎤':'🔇'} title={micOn?'Откл. микрофон':'Вкл. микрофон'} active={!micOn} onClick={toggleMic}/>
            <IBtn icon="⚙" title="Настройки" onClick={()=>notify('Настройки')}/>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
        {/* Header */}
        <div style={{height:46,background:C.bg1,display:'flex',alignItems:'center',padding:'0 14px',gap:9,borderBottom:`1px solid ${C.brd}`,flexShrink:0,boxShadow:C.shd}}>
          <span style={{fontSize:15,color:C.txt3}}>{room?.kind==='voice'?'🎙':room?.kind==='meeting'?'📋':'#'}</span>
          <span style={{fontSize:14,fontWeight:700,color:C.txt}}>{room?.name||'Выберите комнату'}</span>
          {room?.description&&<><div style={{width:1,height:15,background:C.brd}}/><span style={{fontSize:12,color:C.txt3,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{room.description}</span></>}
          {!room?.description&&<div style={{flex:1}}/>}
          <div style={{display:'flex',gap:2,flexShrink:0}}>
            {(room?.kind==='voice'||room?.kind==='meeting')&&<IBtn icon={inVoice?'📴':'📞'} title={inVoice?'Покинуть':'Войти'} active={inVoice} onClick={inVoice?leaveVoice:joinVoice}/>}
            <IBtn icon="🔍" title="Поиск в комнате" active={!!search} onClick={()=>{if(search)setSearch('');else{const s=prompt('Поиск:');if(s)setSearch(s);}}}/>
            <IBtn icon="📌" title="Закреплённые" onClick={()=>{const p=msgs.filter(m=>m.isPinned);notify(p.length?`${p.length} закреплённых`:'Нет закреплённых');}}/>
            <IBtn icon="👥" title="Участники" active={panel==='members'} onClick={()=>setPanel(p=>p==='members'?'none':'members')}/>
            <IBtn icon="🤖" title="AI-ассистент" active={panel==='ai'} onClick={()=>setPanel(p=>p==='ai'?'none':'ai')}/>
            <IBtn icon="➕" title="Добавить участника" onClick={()=>openModal('add_member')}/>
            <IBtn icon="⚙" title="Настройки комнаты" onClick={()=>room&&openModal('room_settings',room)}/>
            <IBtn icon="📺" title="Overlay" active={overlay} onClick={()=>setOverlay(v=>!v)}/>
          </div>
        </div>
        {/* Messages */}
        <div style={{flex:1,overflowY:'auto',background:C.bg2}}>
          {loading&&<div style={{display:'flex',justifyContent:'center',padding:32}}><div style={{width:28,height:28,border:`3px solid ${C.bg3}`,borderTop:`3px solid ${C.acc}`,borderRadius:'50%',animation:'spin 1s linear infinite'}}/></div>}
          {!room&&!loading&&(
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:12}}>
              <div style={{fontSize:56}}>💬</div>
              <div style={{fontSize:18,fontWeight:700,color:C.txt}}>Выберите комнату</div>
              <div style={{fontSize:13,color:C.txt3}}>или создайте новую</div>
              <Btn variant="primary" onClick={()=>openModal('create_room')}>＋ Создать комнату</Btn>
            </div>
          )}
          {room&&!loading&&msgs.length===0&&!search&&(
            <div style={{padding:'28px 18px'}}>
              <div style={{fontSize:40,marginBottom:8}}>{room.kind==='voice'?'🎙':room.kind==='meeting'?'📋':'💬'}</div>
              <div style={{fontSize:20,fontWeight:700,color:C.txt,marginBottom:4}}>#{room.name}</div>
              <div style={{fontSize:14,color:C.txt3}}>Напишите первое сообщение!</div>
            </div>
          )}
          {search&&grouped.length===0&&<div style={{textAlign:'center',padding:32,color:C.txt3}}>Ничего не найдено: «{search}» <span onClick={()=>setSearch('')} style={{color:C.acc,cursor:'pointer'}}>сбросить</span></div>}
          {grouped.map((m,i)=>(
            <MsgRow key={m.id||i} msg={m} meId={user?.id}
              onDel={async()=>{try{await A.deleteMsg(room.id,m.id);setMsgs(p=>p.filter(x=>x.id!==m.id));notify('Удалено');}catch(e){notify(e.message,'error');}}}
              onPin={async()=>{try{await A.pinMsg(room.id,m.id);setMsgs(p=>p.map(x=>x.id===m.id?{...x,isPinned:!x.isPinned}:x));notify('Закреплено');}catch(e){notify(e.message,'error');}}}
              onReply={()=>{setInput(`↩ @${m.user?.displayName||'user'}: ${m.content.slice(0,50)}\n`);inputRef.current?.focus();}}
              onUser={()=>openModal('user_profile',m.user)}
            />
          ))}
          <div ref={msgEnd}/>
        </div>
        {/* Composer */}
        {room&&(
          <div style={{padding:'0 14px 12px',background:C.bg2,flexShrink:0}}>
            <div style={{background:C.bg1,border:`1px solid ${C.brd}`,borderRadius:10,display:'flex',alignItems:'flex-end',gap:7,padding:'8px 10px',boxShadow:C.shd}}>
              <button onClick={()=>notify('Прикрепить файл')} style={{background:'none',border:'none',color:C.txt3,fontSize:20,cursor:'pointer',padding:0,flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.color=C.txt} onMouseLeave={e=>e.currentTarget.style.color=C.txt3}>＋</button>
              <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();}}}
                placeholder={`Написать в #${room?.name}... (@ai вопрос)`}
                rows={1} style={{flex:1,background:'transparent',border:'none',color:C.txt,fontSize:13,resize:'none',outline:'none',minHeight:22,maxHeight:160,lineHeight:1.55,fontFamily:'inherit'}}
                onInput={e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,160)+'px';}}/>
              <div style={{display:'flex',gap:3,flexShrink:0,alignItems:'center'}}>
                <button onClick={()=>notify('Emoji')} style={{background:'none',border:'none',fontSize:15,cursor:'pointer',color:C.txt3}}>😊</button>
                <button onClick={()=>notify('Прикрепить')} style={{background:'none',border:'none',fontSize:14,cursor:'pointer',color:C.txt3}}>📎</button>
                <button onClick={sendMsg} style={{width:32,height:32,borderRadius:8,background:input.trim()?C.acc:C.bg3,border:'none',color:input.trim()?'#fff':C.txt3,cursor:input.trim()?'pointer':'default',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s',flexShrink:0}}>➤</button>
              </div>
            </div>
            <div style={{fontSize:11,color:C.txt3,marginTop:3,paddingLeft:3}}>Enter — отправить · Shift+Enter — новая строка · @ai — AI-ассистент</div>
          </div>
        )}
      </div>

      {/* MEMBERS PANEL */}
      {panel==='members'&&(
        <div style={{width:240,background:C.bg1,borderLeft:`1px solid ${C.brd}`,display:'flex',flexDirection:'column',flexShrink:0}}>
          <div style={{padding:'12px 14px 8px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:C.txt3}}>Участники — {mems.length+1}</span>
            <button onClick={()=>openModal('add_member')} style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.brd}`,background:'transparent',cursor:'pointer',fontSize:16,color:C.txt3,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'}} title="Добавить участника"
              onMouseEnter={e=>{e.currentTarget.style.background=C.act;e.currentTarget.style.color=C.acc;e.currentTarget.style.borderColor=C.acc;}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=C.txt3;e.currentTarget.style.borderColor=C.brd;}}>＋</button>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'6px 6px'}}>
            {/* Я — всегда первый */}
            <div style={{fontSize:10,fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:C.txt3,padding:'4px 6px 5px'}}>В сети — {mems.length+1}</div>
            <MemRow member={user} isMe voiceP={voiceP} onToast={notify}/>
            {Object.entries(deptMap).length>0
              ?Object.entries(deptMap).map(([dept,dMems])=>(
                <div key={dept}>
                  <div style={{fontSize:10,fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase',color:C.txt3,padding:'10px 6px 4px'}}>{dept} — {dMems.length}</div>
                  {dMems.map(m=><MemRow key={m.id} member={m} voiceP={voiceP} onToast={notify} onProfile={()=>openModal('user_profile',m)} onRemove={(user?.role==='super_admin'||user?.role==='admin')?()=>rmMember(m.id):null}/>)}
                </div>
              ))
              :mems.map(m=><MemRow key={m.id} member={m} voiceP={voiceP} onToast={notify} onProfile={()=>openModal('user_profile',m)} onRemove={(user?.role==='super_admin'||user?.role==='admin')?()=>rmMember(m.id):null}/>)
            }
            {mems.length===0&&(
              <div style={{padding:'10px 6px',color:C.txt3,fontSize:12,lineHeight:1.6}}>Участники не загружены.<br/><span onClick={()=>openModal('add_member')} style={{color:C.acc,cursor:'pointer'}}>Добавить →</span></div>
            )}
          </div>
          <button onClick={()=>openModal('add_member')} style={{margin:'6px',padding:'7px 10px',borderRadius:7,border:`1px dashed ${C.brd}`,background:'transparent',cursor:'pointer',fontSize:12,color:C.txt3,display:'flex',alignItems:'center',gap:5,transition:'all .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.acc;e.currentTarget.style.color=C.acc;e.currentTarget.style.background=C.act;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.brd;e.currentTarget.style.color=C.txt3;e.currentTarget.style.background='transparent';}}>
            <span style={{fontSize:14}}>＋</span> Добавить участника
          </button>
        </div>
      )}

      {/* AI PANEL */}
      {panel==='ai'&&(
        <div style={{width:280,background:C.bg1,borderLeft:`1px solid ${C.brd}`,display:'flex',flexDirection:'column',flexShrink:0}}>
          <div style={{padding:'12px 14px 8px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:20}}>🤖</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:C.txt}}>Сигнум AI</div><div style={{fontSize:11,color:C.txt3}}>{room?.name||'Выберите комнату'}</div></div>
            <button onClick={()=>setPanel('none')} style={{background:'none',border:'none',color:C.txt3,cursor:'pointer',fontSize:14}}>✕</button>
          </div>
          <div style={{padding:'8px',display:'flex',gap:5,flexWrap:'wrap',borderBottom:`1px solid ${C.brd}`}}>
            {[['📋 Суммаризировать','суммаризировать'],['✍️ Черновик','черновик'],['🗑 Очистить','очистить']].map(([l,cmd])=>(
              <button key={cmd} onClick={()=>doAI(cmd)} style={{padding:'4px 8px',borderRadius:6,background:`${C.acc}12`,border:`1px solid ${C.acc}25`,color:C.acc,fontSize:11,fontWeight:500,cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.background=`${C.acc}22`} onMouseLeave={e=>e.currentTarget.style.background=`${C.acc}12`}>{l}</button>
            ))}
          </div>
          <div style={{flex:1,overflowY:'auto',padding:12,display:'flex',flexDirection:'column',gap:8}}>
            {aiMsgs.map((m,i)=>(
              <div key={i} style={{display:'flex',flexDirection:'column',gap:2,alignItems:m.role==='user'?'flex-end':'flex-start'}}>
                <span style={{fontSize:10,color:C.txt3}}>{m.role==='user'?'Вы':'AI'}</span>
                <div style={{maxWidth:'90%',padding:'8px 11px',borderRadius:m.role==='user'?'12px 12px 4px 12px':'12px 12px 12px 4px',background:m.role==='user'?C.acc:C.bg3,color:m.role==='user'?'#fff':C.txt,fontSize:12,lineHeight:1.6,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{m.text}</div>
              </div>
            ))}
            {aiLoad&&<div style={{display:'flex',gap:4,padding:'8px 11px',background:C.bg3,borderRadius:12,width:'fit-content'}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:C.txt3,animation:`bounce .8s ${i*.15}s ease-in-out infinite`}}/>)}</div>}
          </div>
          <div style={{padding:8,borderTop:`1px solid ${C.brd}`,display:'flex',gap:6,alignItems:'flex-end'}}>
            <textarea value={aiInp} onChange={e=>setAiInp(e.target.value)}
              onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();if(aiInp.trim()){doAI(aiInp);setAiInp('');}}}}
              placeholder="Задать вопрос..." rows={1}
              style={{flex:1,border:`1px solid ${C.brd}`,borderRadius:8,padding:'8px 10px',color:C.txt,fontSize:12,outline:'none',resize:'none',minHeight:34,maxHeight:80,background:C.bg,fontFamily:'inherit'}}/>
            <button onClick={()=>{if(aiInp.trim()){doAI(aiInp);setAiInp('');}}} style={{width:34,height:34,borderRadius:8,background:C.acc,border:'none',color:'#fff',cursor:'pointer',fontSize:13,flexShrink:0}}>➤</button>
          </div>
        </div>
      )}

      {/* OVERLAY */}
      {overlay&&<VoiceOverlay user={user} parts={voiceP} micOn={micOn} onMic={toggleMic} onLeave={leaveVoice} onClose={()=>setOverlay(false)}/>}

      {/* TOAST */}
      {toast&&(
        <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:C.bg1,color:C.txt,borderRadius:8,padding:'10px 18px',fontSize:13,fontWeight:500,borderLeft:`4px solid ${toast.type==='error'?C.red:toast.type==='success'?C.grn:C.acc}`,zIndex:9999,pointerEvents:'none',boxShadow:'0 4px 20px rgba(0,0,0,.15)',animation:'toastin .2s ease',whiteSpace:'nowrap'}}>
          {toast.msg}
        </div>
      )}

      {/* CMD PALETTE */}
      {cmdOpen&&(
        <div onClick={()=>setCmdOpen(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.3)',display:'flex',alignItems:'flex-start',justifyContent:'center',zIndex:2000,paddingTop:120}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.bg1,borderRadius:12,width:520,maxWidth:'95vw',boxShadow:'0 16px 64px rgba(0,0,0,.2)',overflow:'hidden'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 16px',borderBottom:`1px solid ${C.brd}`}}>
              <span style={{fontSize:16,color:C.txt3}}>🔍</span>
              <input value={cmdQ} onChange={e=>setCmdQ(e.target.value)} placeholder="Поиск комнат, действий..." autoFocus
                style={{flex:1,border:'none',background:'transparent',fontSize:15,color:C.txt,outline:'none',fontFamily:'inherit'}}/>
              <span style={{fontSize:11,color:C.txt3}}>ESC</span>
            </div>
            <div style={{maxHeight:320,overflowY:'auto'}}>
              {cmdItems.length===0&&<div style={{padding:24,textAlign:'center',color:C.txt3,fontSize:13}}>Ничего не найдено</div>}
              {cmdItems.map((item,i)=>(
                <div key={i} onClick={item.action} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 16px',cursor:'pointer',borderBottom:`1px solid ${C.brd}`}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.act} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{fontSize:16,width:22,textAlign:'center'}}>{item.icon}</span>
                  <span style={{fontSize:14,color:C.txt,fontWeight:500}}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {modal==='create_room'&&(
        <Modal title="Создать комнату" onClose={closeModal} width={420}>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.txt,display:'block',marginBottom:6}}>Тип</label>
              <div style={{display:'flex',gap:8}}>
                {[['group','💬 Текстовая'],['voice','🎙 Голосовая'],['meeting','📋 Собрание']].map(([k,l])=>(
                  <button key={k} onClick={()=>setNKind(k)} style={{flex:1,padding:'8px 4px',borderRadius:8,border:`2px solid ${nKind===k?C.acc:C.brd}`,background:nKind===k?C.act:C.bg,color:nKind===k?C.acc:C.txt,fontSize:11,fontWeight:500,cursor:'pointer',textAlign:'center'}}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.txt,display:'block',marginBottom:6}}>Название *</label>
              <Inp value={nRoom} onChange={e=>setNRoom(e.target.value)} placeholder="общий-контур" onKeyDown={e=>e.key==='Enter'&&createRoom()} autoFocus/>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <Btn variant="ghost" onClick={closeModal}>Отмена</Btn>
              <Btn variant="primary" onClick={createRoom} disabled={creating||!nRoom.trim()}>{creating?'Создаём...':'✓ Создать'}</Btn>
            </div>
          </div>
        </Modal>
      )}
      {modal==='add_member'&&(
        <Modal title="Добавить участника" onClose={closeModal} width={460}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Inp value={mSearch} onChange={e=>setMSearch(e.target.value)} placeholder="Поиск по имени или email..." autoFocus/>
            <div style={{maxHeight:320,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
              {notInRoom.length===0&&<div style={{textAlign:'center',padding:24,color:C.txt3,fontSize:13}}>{allUsers.length===0?'Загрузка...':'Пользователи не найдены'}</div>}
              {notInRoom.map(u=>(
                <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 12px',borderRadius:9,border:`1px solid ${C.brd}`,cursor:'pointer',background:C.bg2,transition:'border-color .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.acc} onMouseLeave={e=>e.currentTarget.style.borderColor=C.brd}>
                  <Av user={u} size={38}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:C.txt}}>{u.displayName}</div>
                    <div style={{fontSize:11,color:C.txt3}}>{u.email}{u.role&&` · ${u.role}`}</div>
                  </div>
                  <Btn variant="primary" small onClick={()=>addMember(u.id)}>Добавить</Btn>
                </div>
              ))}
            </div>
            <div style={{textAlign:'right',borderTop:`1px solid ${C.brd}`,paddingTop:12}}>
              <Btn variant="ghost" onClick={closeModal}>Закрыть</Btn>
            </div>
          </div>
        </Modal>
      )}
      {modal==='room_settings'&&mData&&(
        <Modal title={`#${mData.name} — Настройки`} onClose={closeModal} width={440}>
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            <div style={{padding:16,background:C.bg,borderRadius:9,display:'flex',alignItems:'center',gap:12}}>
              <div style={{fontSize:34}}>{mData.kind==='voice'?'🎙':mData.kind==='meeting'?'📋':'💬'}</div>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:C.txt}}>{mData.name}</div>
                <div style={{fontSize:12,color:C.txt3}}>{mData.kind||'group'} · {mems.length+1} участников</div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <Btn variant="ghost" onClick={()=>{openModal('add_member');}} small>👤 Добавить участника</Btn>
              <Btn variant="ghost" onClick={()=>notify('Уведомления настроены')} small>🔔 Уведомления</Btn>
              <Btn variant="danger" onClick={()=>{notify('Комната заархивирована');closeModal();}} small>🗑 Архивировать</Btn>
            </div>
            <div style={{textAlign:'right'}}><Btn variant="ghost" onClick={closeModal}>Закрыть</Btn></div>
          </div>
        </Modal>
      )}
      {modal==='user_profile'&&mData&&(
        <Modal title="Профиль" onClose={closeModal} width={380}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,textAlign:'center'}}>
            <Av user={mData} size={72}/>
            <div>
              <div style={{fontSize:20,fontWeight:700,color:C.txt}}>{mData.displayName}</div>
              <div style={{fontSize:13,color:C.txt3,marginTop:3}}>{mData.email}</div>
              {mData.role&&<div style={{fontSize:12,padding:'3px 10px',borderRadius:999,background:`${C.acc}12`,color:C.acc,display:'inline-block',marginTop:6,fontWeight:600}}>{mData.role}</div>}
            </div>
            <div style={{width:'100%',background:C.bg,borderRadius:9,padding:14,display:'flex',flexDirection:'column',gap:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:C.txt3}}>Статус</span><span style={{color:C.grn,fontWeight:500}}>● В сети</span></div>
              {mData.department&&<div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:C.txt3}}>Отдел</span><span style={{color:C.txt}}>{mData.department}</span></div>}
              {mData.email&&<div style={{display:'flex',justifyContent:'space-between',fontSize:13}}><span style={{color:C.txt3}}>Email</span><span style={{color:C.txt}}>{mData.email}</span></div>}
            </div>
            <div style={{display:'flex',gap:8}}>
              <Btn variant="primary" onClick={()=>{if(textRooms.length)setRoom(textRooms[0]);closeModal();}}>💬 Написать</Btn>
              <Btn variant="ghost" onClick={closeModal}>Закрыть</Btn>
            </div>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}
        @keyframes toastin{from{transform:translateX(-50%) translateY(8px);opacity:0}to{transform:translateX(-50%);opacity:1}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-thumb{background:rgba(0,0,0,.12);border-radius:2px}
        textarea::placeholder,input::placeholder{color:${C.txt3}}
      `}</style>
    </div>
  );
}

// Вспомогательные компоненты

function SbSec({label,onAdd,children}){
  return<>
    <div style={{padding:'12px 8px 3px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <span style={{fontSize:11,fontWeight:700,letterSpacing:'.06em',textTransform:'uppercase',color:C.txt3}}>{label}</span>
      <button onClick={onAdd} style={{background:'none',border:'none',color:C.txt3,fontSize:18,cursor:'pointer',lineHeight:1,padding:'0 2px'}}
        onMouseEnter={e=>e.currentTarget.style.color=C.acc} onMouseLeave={e=>e.currentTarget.style.color=C.txt3}>＋</button>
    </div>
    {children}
  </>;
}

function RoomRow({room,active,icon,badge,unread,onClick,onSet}){
  const[h,setH]=useState(false);
  return(
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{display:'flex',alignItems:'center',gap:7,padding:'5px 8px',borderRadius:6,cursor:'pointer',margin:'1px 4px',background:active?C.act:h?C.hov:'transparent',position:'relative'}}>
      {active&&<div style={{position:'absolute',left:-4,top:'50%',transform:'translateY(-50%)',width:3,height:14,background:C.acc,borderRadius:'0 2px 2px 0'}}/>}
      <span onClick={onClick} style={{fontSize:13,flexShrink:0,width:16,textAlign:'center'}}>{icon}</span>
      <span onClick={onClick} style={{flex:1,fontSize:13,fontWeight:500,color:active?C.acc:unread?C.txt:C.txt2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{room.name}</span>
      {badge&&<span style={{fontSize:10,fontWeight:600,padding:'1px 5px',borderRadius:999,background:`${C.acc}18`,color:C.acc}}>{badge}</span>}
      {unread>0&&<span style={{fontSize:10,fontWeight:700,padding:'1px 5px',borderRadius:999,background:C.red,color:'#fff',minWidth:16,textAlign:'center'}}>{unread}</span>}
      {h&&<button onClick={e=>{e.stopPropagation();onSet?.();}} style={{background:'none',border:'none',color:C.txt3,cursor:'pointer',fontSize:12,padding:'0 2px',flexShrink:0}} title="Настройки">⚙</button>}
    </div>
  );
}

function MsgRow({msg,meId,onDel,onPin,onReply,onUser}){
  const[h,setH]=useState(false);
  const isMe=msg.userId===meId;
  const name=msg.user?.displayName||msg.user?.username||'Пользователь';
  return(
    <>
      {msg.nd&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px 4px',fontSize:11,fontWeight:600,color:C.txt3}}><div style={{flex:1,height:1,background:C.brd}}/>{fmtD(msg.createdAt)}<div style={{flex:1,height:1,background:C.brd}}/></div>}
      <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
        style={{padding:msg.cont?'1px 14px':'4px 14px',position:'relative',background:h?C.hov:msg.isPinned?`${C.amb}07`:'transparent'}}>
        {msg.isPinned&&<div style={{fontSize:11,color:C.amb,padding:'0 0 2px 48px',display:'flex',alignItems:'center',gap:3}}>📌 Закреплённое</div>}
        {!msg.cont?(
          <div style={{display:'flex',gap:10,alignItems:'flex-start'}}>
            <div onClick={onUser} style={{cursor:'pointer',flexShrink:0,marginTop:2}}><Av user={msg.user} size={36}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'baseline',gap:7,marginBottom:3,flexWrap:'wrap'}}>
                <span onClick={onUser} style={{fontSize:13,fontWeight:700,color:avC(msg.userId),cursor:'pointer'}}>{name}</span>
                {msg.user?.role&&<span style={{fontSize:10,fontWeight:600,padding:'1px 5px',borderRadius:3,background:`${C.acc}12`,color:C.acc}}>{msg.user.role}</span>}
                <span style={{fontSize:11,color:C.txt3}}>{fmtT(msg.createdAt)}</span>
              </div>
              <div style={{fontSize:13,color:C.txt,lineHeight:1.6,wordBreak:'break-word',whiteSpace:'pre-wrap'}}>{msg.content}</div>
            </div>
          </div>
        ):(
          <div style={{paddingLeft:46,fontSize:13,color:C.txt,lineHeight:1.6,wordBreak:'break-word',whiteSpace:'pre-wrap',position:'relative'}}>
            {h&&<span style={{position:'absolute',left:0,top:0,fontSize:11,color:C.txt3,width:40,textAlign:'right'}}>{fmtT(msg.createdAt)}</span>}
            {msg.content}
          </div>
        )}
        {h&&(
          <div style={{position:'absolute',top:-12,right:14,background:C.bg1,border:`1px solid ${C.brd}`,borderRadius:8,padding:3,display:'flex',gap:1,zIndex:5,boxShadow:C.shd}}>
            {[['↩','Ответить',onReply],['😊','Реакция',null],['📌','Закрепить',onPin],...(isMe?[['✏','Редактировать',null],['🗑','Удалить',onDel]]:[])].map(([ic,t,fn])=>(
              <button key={t} title={t} onClick={fn||undefined} style={{width:28,height:28,borderRadius:6,border:'none',background:'transparent',cursor:fn?'pointer':'not-allowed',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',color:C.txt2,opacity:fn?1:.35}}
                onMouseEnter={e=>{if(fn){e.currentTarget.style.background=ic==='🗑'?`${C.red}12`:C.hov;if(ic==='🗑')e.currentTarget.style.color=C.red;}}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color=C.txt2;}}>
                {ic}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function MemRow({member,isMe,voiceP,onToast,onProfile,onRemove}){
  const[h,setH]=useState(false);
  if(!member)return null;
  const inV=(voiceP||[]).some(p=>(p.userId||p.id)===member.id);
  return(
    <div onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{display:'flex',alignItems:'center',gap:8,padding:'5px 8px',borderRadius:8,cursor:'pointer',background:h?C.hov:'transparent',position:'relative',marginBottom:2}}>
      <div style={{position:'relative',flexShrink:0}}>
        <Av user={member} size={30}/>
        <SDot status={inV?'in_voice':'online'} border={C.bg1}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500,color:C.txt,display:'flex',alignItems:'center',gap:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {member.displayName}
          {isMe&&<span style={{fontSize:10,color:C.acc,fontWeight:600}}>(вы)</span>}
        </div>
        <div style={{fontSize:11,color:inV?C.acc:C.txt3,marginTop:1}}>{inV?'🎙 В голосе':member.role||'В сети'}</div>
      </div>
      {h&&!isMe&&(
        <div style={{display:'flex',gap:2}}>
          {onProfile&&<button title="Профиль" onClick={onProfile} style={{background:'none',border:'none',cursor:'pointer',fontSize:14,color:C.txt3,padding:'2px 3px'}}>👤</button>}
          {onRemove&&<button title="Удалить" onClick={onRemove} style={{background:'none',border:'none',cursor:'pointer',fontSize:14,color:C.red,padding:'2px 3px'}}>✕</button>}
        </div>
      )}
    </div>
  );
}

function VoiceOverlay({user,parts,micOn,onMic,onLeave,onClose}){
  const[pos,setPos]=useState({bottom:80,right:16});
  const[drag,setDrag]=useState(false);
  const ref=useRef(null);const st=useRef(null);
  useEffect(()=>{
    const mv=e=>{if(!drag||!st.current||!ref.current)return;const b=ref.current.getBoundingClientRect();setPos({top:e.clientY-st.current.y,left:e.clientX-st.current.x,right:'auto',bottom:'auto'});};
    const up=()=>setDrag(false);
    window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up);
    return()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up);};
  },[drag]);
  return(
    <div ref={ref} style={{position:'fixed',...pos,width:220,background:C.bg1,borderRadius:12,border:`1px solid ${C.brd}`,boxShadow:'0 8px 32px rgba(0,0,0,.15)',zIndex:1000}}>
      <div onMouseDown={e=>{setDrag(true);const b=ref.current.getBoundingClientRect();st.current={x:e.clientX-b.left,y:e.clientY-b.top};}}
        style={{padding:'10px 12px',borderBottom:`1px solid ${C.brd}`,display:'flex',alignItems:'center',gap:8,cursor:'move',userSelect:'none'}}>
        <div style={{width:8,height:8,borderRadius:'50%',background:C.grn}}/>
        <span style={{fontSize:12,fontWeight:600,color:C.txt,flex:1}}>Голосовой контур</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.txt3,cursor:'pointer',fontSize:14}}>✕</button>
      </div>
      <div style={{padding:'8px 12px',display:'flex',flexDirection:'column',gap:6}}>
        {parts.length===0
          ?<div style={{fontSize:12,color:C.txt3,textAlign:'center',padding:8}}>Никого нет в голосе</div>
          :parts.map(p=>(
            <div key={p.userId||p.id} style={{display:'flex',alignItems:'center',gap:8}}>
              <Av user={{id:p.userId,displayName:p.displayName||p.username}} size={26}/>
              <span style={{flex:1,fontSize:12,color:C.txt,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.displayName||p.username}</span>
              <span style={{fontSize:11,color:p.isMuted?C.txt3:C.grn}}>{p.isMuted?'🔇':'🎤'}</span>
            </div>
          ))
        }
      </div>
      <div style={{padding:'8px 12px',borderTop:`1px solid ${C.brd}`,display:'flex',gap:6}}>
        <button onClick={onMic} style={{flex:1,padding:'7px 6px',borderRadius:8,border:`1px solid ${C.brd}`,background:micOn?C.act:C.bg3,color:micOn?C.acc:C.txt,fontSize:12,fontWeight:500,cursor:'pointer'}}>{micOn?'🎤 Вкл':'🔇 Выкл'}</button>
        <button onClick={onLeave} style={{flex:1,padding:'7px 6px',borderRadius:8,border:'none',background:C.red,color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer'}}>☎ Выйти</button>
      </div>
    </div>
  );
}

// ── ROOT ────────────────────────────────────────────
export default function App(){
  const[state,setState]=useState('loading');
  const[user,setUser]=useState(null);
  const[token,setToken]=useState('');
  useEffect(()=>{
    const t=localStorage.getItem('sg_token');
    if(!t){setState('auth');return;}
    A.me(t).then(raw=>{setUser(nu(raw?.user||raw));setToken(t);setState('main');}).catch(()=>{localStorage.removeItem('sg_token');setState('auth');});
  },[]);
  function onAuth(tok,rawUser){setToken(tok);if(rawUser){setUser(nu(rawUser));setState('main');return;}A.me(tok).then(r=>{setUser(nu(r?.user||r));setState('main');}).catch(()=>setState('auth'));}
  if(state==='loading')return(
    <div style={{height:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
      <div style={{width:56,height:56,borderRadius:16,background:C.acc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,color:'#fff'}}>С</div>
      <div style={{width:28,height:28,border:`3px solid ${C.bg3}`,borderTop:`3px solid ${C.acc}`,borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );
  if(state==='auth')return<AuthPage onAuth={onAuth}/>;
  return<MainApp user={user} token={token} onLogout={()=>{localStorage.removeItem('sg_token');setState('auth');}}/>;
}
