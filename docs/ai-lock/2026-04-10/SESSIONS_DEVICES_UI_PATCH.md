# Sessions / devices UI patch

Цель: использовать уже готовый backend `/api/auth/sessions` как trusted devices / session management UI.

## 1. Добавить modal type `account_security`

```diff
+function SessionsModal({user,onClose,onToast}){
+  const[data,setData]=useState({sessions:[],history:[],currentSessionId:null});
+  const[loading,setLoading]=useState(true);
+  const[pwd,setPwd]=useState({current:'',next:'',confirm:''});
+
+  async function load(){
+    setLoading(true);
+    try{setData(await A.sessions());}
+    catch(e){onToast('Ошибка загрузки устройств','error');}
+    setLoading(false);
+  }
+  useEffect(()=>{load();},[]);
+
+  async function revoke(id){
+    try{await A.revokeSession(id);onToast('Устройство отключено');load();}
+    catch(e){onToast('Ошибка отключения','error');}
+  }
+  async function logoutOthers(){
+    try{await A.logoutAll(true);onToast('Остальные устройства отключены');load();}
+    catch(e){onToast('Ошибка logout-all','error');}
+  }
+  async function changePassword(){
+    if(!pwd.current||!pwd.next||!pwd.confirm){onToast('Заполните пароли','error');return;}
+    if(pwd.next!==pwd.confirm){onToast('Пароли не совпадают','error');return;}
+    try{await A.changePassword(pwd.current,pwd.next);onToast('Пароль обновлён','success');setPwd({current:'',next:'',confirm:''});load();}
+    catch(e){onToast('Ошибка смены пароля','error');}
+  }
+
+  return (
+    <Modal title="Безопасность и устройства" onClose={onClose} width={700}>
+      <div style={{display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:18}}>
+        <div style={{display:'flex',flexDirection:'column',gap:12}}>
+          <div style={{fontSize:12,fontWeight:700,color:C.txt3,textTransform:'uppercase'}}>Активные устройства</div>
+          <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:360,overflowY:'auto'}}>
+            {loading&&<div style={{fontSize:13,color:C.txt3}}>Загрузка...</div>}
+            {!loading&&data.sessions.map((s)=>(
+              <div key={s.id} style={{border:`1px solid ${C.brd}`,borderRadius:10,padding:12,display:'flex',alignItems:'center',gap:12}}>
+                <div style={{fontSize:18}}>{s.userAgent?.includes('Mac')?'💻':s.userAgent?.includes('iPhone')?'📱':'🖥️'}</div>
+                <div style={{flex:1,minWidth:0}}>
+                  <div style={{fontSize:13,fontWeight:600,color:C.txt}}>{s.userAgent||'Устройство без подписи'} {s.isCurrent&&<span style={{color:C.acc}}>· текущее</span>}</div>
+                  <div style={{fontSize:11,color:C.txt3}}>IP: {s.ipAddress||'—'} · Создано: {s.createdAt?new Date(s.createdAt).toLocaleString('ru'):'—'} · До: {s.expiresAt?new Date(s.expiresAt).toLocaleString('ru'):'—'}</div>
+                </div>
+                {!s.isCurrent&&<Btn variant="ghost" small onClick={()=>revoke(s.id)}>Отключить</Btn>}
+              </div>
+            ))}
+          </div>
+          <div style={{display:'flex',justifyContent:'flex-end'}}>
+            <Btn variant="danger" small onClick={logoutOthers}>Отключить остальные устройства</Btn>
+          </div>
+        </div>
+        <div style={{display:'flex',flexDirection:'column',gap:12}}>
+          <div style={{fontSize:12,fontWeight:700,color:C.txt3,textTransform:'uppercase'}}>Смена пароля</div>
+          <Inp value={pwd.current} onChange={e=>setPwd(v=>({...v,current:e.target.value}))} placeholder="Текущий пароль" type="password"/>
+          <Inp value={pwd.next} onChange={e=>setPwd(v=>({...v,next:e.target.value}))} placeholder="Новый пароль" type="password"/>
+          <Inp value={pwd.confirm} onChange={e=>setPwd(v=>({...v,confirm:e.target.value}))} placeholder="Повтор нового пароля" type="password"/>
+          <Btn variant="primary" onClick={changePassword}>Обновить пароль</Btn>
+          <div style={{fontSize:12,color:C.txt3,lineHeight:1.6}}>Текущая реализация использует active auth sessions как доверенные устройства. Этого достаточно для управляемого MVP до отдельного phone-device слоя.</div>
+        </div>
+      </div>
+    </Modal>
+  );
+}
```

## 2. Открывать modal из footer/settings

```diff
- <IBtn icon="⚙" title="Настройки" onClick={()=>notify('Настройки')}/>
+ <IBtn icon="⚙" title="Безопасность" onClick={()=>openModal('account_security')}/>
```

## 3. Подключить modal в блок modal-render

```diff
+      {modal==='account_security'&&(
+        <SessionsModal user={user} onClose={closeModal} onToast={notify}/>
+      )}
```

Ожидаемый эффект:
- у пользователя появляется управление устройствами;
- revoke sessions и logout others начинают использоваться из UI;
- trusted devices закрываются как практический UX-слой уже на текущем backend.
