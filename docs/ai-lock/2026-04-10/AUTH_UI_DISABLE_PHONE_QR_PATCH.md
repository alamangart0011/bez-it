# Auth UI disable patch

Цель: убрать пользователя из незавершённых phone/QR сценариев и оставить только стабильный логин по паролю до финальной parity.

Применить к `frontend/src/App.jsx`.

```diff
@@
 function AuthPage({onAuth}){
-  const[tab,setTab]=useState('pass');
+  const ENABLE_PHONE_AUTH = false;
+  const ENABLE_QR_AUTH = false;
+  const[tab,setTab]=useState('pass');
@@
-        <div style={{display:'flex',background:C.bg,borderRadius:10,padding:3,width:'100%',gap:2}}>
-          {[['pass','Пароль'],['phone','Телефон'],['qr','QR-код']].map(([k,l])=>(
+        <div style={{display:'flex',background:C.bg,borderRadius:10,padding:3,width:'100%',gap:2}}>
+          {[
+            ['pass','Пароль'],
+            ...(ENABLE_PHONE_AUTH ? [['phone','Телефон']] : []),
+            ...(ENABLE_QR_AUTH ? [['qr','QR-код']] : []),
+          ].map(([k,l])=>(
             <button key={k} onClick={()=>setTab(k)} style={tabS(k)}>{l}</button>
           ))}
         </div>
@@
-            <div style={{textAlign:'center',fontSize:12,color:C.txt3}}>или <span onClick={()=>setTab('qr')} style={{color:C.acc,cursor:'pointer'}}>войти через QR-код</span></div>
+            {(ENABLE_QR_AUTH || ENABLE_PHONE_AUTH) ? (
+              <div style={{textAlign:'center',fontSize:12,color:C.txt3}}>
+                {ENABLE_QR_AUTH && <span onClick={()=>setTab('qr')} style={{color:C.acc,cursor:'pointer'}}>войти через QR-код</span>}
+              </div>
+            ) : (
+              <div style={{textAlign:'center',fontSize:12,color:C.txt3}}>Активен стабильный вход по логину и паролю</div>
+            )}
           </div>
         )}
-        {tab==='phone'&&(
+        {ENABLE_PHONE_AUTH && tab==='phone'&&(
@@
-        {tab==='qr'&&(
+        {ENABLE_QR_AUTH && tab==='qr'&&(
```

Ожидаемый эффект:
- auth page перестаёт вести в незавершённый phone flow;
- auth page перестаёт обещать QR, если он не закрыт end-to-end;
- уменьшается количество ложных UX-ошибок на входе.
