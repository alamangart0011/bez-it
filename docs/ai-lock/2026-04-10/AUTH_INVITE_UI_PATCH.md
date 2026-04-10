# Auth invite UI patch

Цель: подключить уже готовый backend invite-flow к active frontend `frontend/src/App.jsx`.

## 1. Расширить API-слой

```diff
@@
 const A = {
   login:       (l,p)    => req('POST','/api/auth/login',{login:l,password:p}),
+  inviteInfo:  (token)  => req('GET',`/api/auth/invite/${encodeURIComponent(token)}`),
+  acceptInvite:(d)      => req('POST','/api/auth/accept-invite',d),
+  sessions:    ()       => req('GET','/api/auth/sessions'),
+  revokeSession:(id)    => req('DELETE',`/api/auth/sessions/${id}`),
+  logoutAll:   (excludeCurrent=true)=>req('POST','/api/auth/logout-all',{excludeCurrent}),
+  changePassword:(currentPassword,newPassword)=>req('POST','/api/auth/change-password',{currentPassword,newPassword}),
   me:          (t)      => req('GET','/api/me',null,t),
 ```

## 2. Добавить страницу принятия приглашения

```diff
+function InviteAcceptPage({token,onAuth}){
+  const[loading,setLoading]=useState(true);
+  const[invite,setInvite]=useState(null);
+  const[err,setErr]=useState('');
+  const[displayName,setDisplayName]=useState('');
+  const[username,setUsername]=useState('');
+  const[password,setPassword]=useState('');
+  const[confirmPassword,setConfirmPassword]=useState('');
+  const[submitting,setSubmitting]=useState(false);
+
+  useEffect(()=>{
+    let mounted=true;
+    A.inviteInfo(token)
+      .then(data=>{if(!mounted)return;setInvite(data);setDisplayName(data.email?.split('@')[0]||'');setUsername(data.email?.split('@')[0]||'');})
+      .catch(e=>setErr('Приглашение недействительно или истекло'))
+      .finally(()=>setLoading(false));
+    return()=>{mounted=false;};
+  },[token]);
+
+  async function submit(){
+    if(!displayName||!username||!password||!confirmPassword){setErr('Заполните все поля');return;}
+    setErr('');setSubmitting(true);
+    try{
+      const d=await A.acceptInvite({token,displayName,username,password,confirmPassword});
+      if(d.accessToken){localStorage.setItem('sg_token',d.accessToken);onAuth(d.accessToken,d.user);return;}
+      setErr('Не удалось принять приглашение');
+    }catch(e){setErr('Ошибка принятия приглашения');}
+    setSubmitting(false);
+  }
+
+  if(loading)return <AuthSplash label="Проверка приглашения..."/>;
+  return (
+    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
+      <div style={{background:C.bg1,borderRadius:16,padding:'36px 32px',width:420,display:'flex',flexDirection:'column',gap:14,boxShadow:'0 4px 28px rgba(0,0,0,.1)'}}>
+        <div style={{fontSize:22,fontWeight:700,color:C.txt}}>Принять приглашение</div>
+        <div style={{fontSize:13,color:C.txt3}}>Почта: {invite?.email || '—'} · Роль: {invite?.role || 'member'}</div>
+        <Inp value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="ФИО" autoFocus/>
+        <Inp value={username} onChange={e=>setUsername(e.target.value)} placeholder="Логин"/>
+        <Inp value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль" type="password"/>
+        <Inp value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Повтор пароля" type="password"/>
+        <Btn variant="primary" onClick={submit} disabled={submitting} sx={{width:'100%'}}>{submitting?'Создание...':'Принять приглашение'}</Btn>
+        {err&&<div style={{color:C.red,fontSize:12}}>{err}</div>}
+      </div>
+    </div>
+  );
+}
```

## 3. Добавить небольшой splash helper

```diff
+function AuthSplash({label='Загрузка...'}){
+  return(
+    <div style={{height:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
+      <div style={{width:56,height:56,borderRadius:16,background:C.acc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,color:'#fff'}}>С</div>
+      <div style={{width:28,height:28,border:`3px solid ${C.bg3}`,borderTop:`3px solid ${C.acc}`,borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
+      <div style={{fontSize:13,color:C.txt3}}>{label}</div>
+    </div>
+  );
+}
```

## 4. Переключать root по pathname

```diff
 export default function App(){
   const[state,setState]=useState('loading');
   const[user,setUser]=useState(null);
   const[token,setToken]=useState('');
+  const pathname=window.location.pathname;
+  const inviteToken=pathname.startsWith('/invite/')?decodeURIComponent(pathname.split('/invite/')[1]||''):'';
   useEffect(()=>{
+    if(inviteToken){setState('invite');return;}
     const t=localStorage.getItem('sg_token');
     if(!t){setState('auth');return;}
@@
-  if(state==='loading')return(
-    <div style={{height:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16}}>
-      <div style={{width:56,height:56,borderRadius:16,background:C.acc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:800,color:'#fff'}}>С</div>
-      <div style={{width:28,height:28,border:`3px solid ${C.bg3}`,borderTop:`3px solid ${C.acc}`,borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
-      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}`}</style>
-    </div>
-  );
+  if(state==='loading')return <AuthSplash label="Загрузка..."/>;
+  if(state==='invite')return <InviteAcceptPage token={inviteToken} onAuth={onAuth}/>;
   if(state==='auth')return<AuthPage onAuth={onAuth}/>;
   return<MainApp user={user} token={token} onLogout={()=>{localStorage.removeItem('sg_token');setState('auth');}}/>;
 }
```

Ожидаемый эффект:
- invite link из admin начинает работать end-to-end;
- новый сотрудник может завершить регистрацию и сразу войти;
- active auth path становится шире без отключения phone/QR.
