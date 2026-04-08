const express = require("express");
process.env.TZ = "Asia/Jakarta";
require("dotenv").config();
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public")));

const USERS_FILE      = path.join(__dirname, "users.json");
const ABSENSI_FILE    = path.join(__dirname, "absensi.json");
const IZIN_FILE       = path.join(__dirname, "izin.json");
const SETTINGS_FILE   = path.join(__dirname, "settings.json");
const SOP_FILE        = path.join(__dirname, "sop.json");
const KAS_FILE        = path.join(__dirname, "kas.json");
const AKSES_FILE      = path.join(__dirname, "akses.json");
const SERAHTERIMA_FILE= path.join(__dirname, "serahterima.json");
const BROADCAST_FILE  = path.join(__dirname, "broadcast.json");
const JOBDESK_FILE    = path.join(__dirname, "jobdesk.json");

function loadJson(p,fb=[]){try{return JSON.parse(fs.readFileSync(p,"utf-8"));}catch{return fb;}}
function saveJson(p,d){fs.writeFileSync(p,JSON.stringify(d,null,2));}

function loadUsers()    {return loadJson(USERS_FILE,[]);}
function saveUsers(u)   {saveJson(USERS_FILE,u);}
function loadAbsensi()  {return loadJson(ABSENSI_FILE,[]);}
function saveAbsensi(a) {saveJson(ABSENSI_FILE,a);}
function loadIzin()     {return loadJson(IZIN_FILE,[]);}
function saveIzin(d)    {saveJson(IZIN_FILE,d);}
function loadSop()      {return loadJson(SOP_FILE,[]);}
function saveSop(d)     {saveJson(SOP_FILE,d);}
function loadKas()      {return loadJson(KAS_FILE,{saldoAwal:0,transaksi:[]});}
function saveKas(d)     {saveJson(KAS_FILE,d);}
function loadSerahTerima(){return loadJson(SERAHTERIMA_FILE,[]);}
function saveSerahTerima(d){saveJson(SERAHTERIMA_FILE,d);}
function loadBroadcast(){return loadJson(BROADCAST_FILE,{aktif:false,pesan:"",dibuat_oleh:"",timestamp:""});}
function saveBroadcast(d){saveJson(BROADCAST_FILE,d);}
function loadJobDesk(){return loadJson(JOBDESK_FILE,[]);}
function saveJobDesk(d){saveJson(JOBDESK_FILE,d);}

const DEFAULT_AKSES={
  Kapten:{
    // Menu akses (tampil di sidebar)
    menuDataStaff:true, menuDetailStaff:true, menuAbsensi:true, menuIzin:true,
    menuShift:true, menuHistoryAbsensi:true, menuHistoryIzin:true,
    menuKas:true, menuSOP:true, menuJobDesk:true, menuSerahTerima:false,
    // Aksi (edit/hapus) — Kapten boleh edit tapi tidak hapus
    setShift:true, editStaff:true, tambahStaff:true, hapusStaff:false,
    resetAbsen:true, inputTransaksi:true, hapusTransaksiKas:false,
    tambahSOP:true, hapusSOP:false, aksesKirimBroadcast:false,
    bukaJobDesk:true
  },
  "CS LINE":{
    menuDataStaff:true, menuDetailStaff:true, menuAbsensi:true, menuIzin:true,
    menuShift:true, menuHistoryAbsensi:true, menuHistoryIzin:true,
    menuKas:true, menuSOP:true, menuJobDesk:true, menuSerahTerima:true,
    setShift:true, editStaff:true, tambahStaff:true, hapusStaff:false,
    resetAbsen:true, inputTransaksi:true, hapusTransaksiKas:false,
    tambahSOP:false, hapusSOP:false, aksesKirimBroadcast:false,
    bukaJobDesk:true
  },
  Kasir:{
    menuDataStaff:true, menuDetailStaff:true, menuAbsensi:true, menuIzin:true,
    menuShift:true, menuHistoryAbsensi:true, menuHistoryIzin:true,
    menuKas:true, menuSOP:true, menuJobDesk:true, menuSerahTerima:false,
    // View only — tidak ada aksi edit/hapus
    setShift:false, editStaff:false, tambahStaff:false, hapusStaff:false,
    resetAbsen:false, inputTransaksi:false, hapusTransaksiKas:false,
    tambahSOP:false, hapusSOP:false, aksesKirimBroadcast:false,
    bukaJobDesk:false
  },
  CS:{
    menuDataStaff:true, menuDetailStaff:true, menuAbsensi:true, menuIzin:true,
    menuShift:true, menuHistoryAbsensi:true, menuHistoryIzin:true,
    menuKas:true, menuSOP:true, menuJobDesk:true, menuSerahTerima:false,
    setShift:false, editStaff:false, tambahStaff:false, hapusStaff:false,
    resetAbsen:false, inputTransaksi:false, hapusTransaksiKas:false,
    tambahSOP:false, hapusSOP:false, aksesKirimBroadcast:false,
    bukaJobDesk:false
  },
  Staff:{
    menuDataStaff:false, menuDetailStaff:false, menuAbsensi:false, menuIzin:false,
    menuShift:false, menuHistoryAbsensi:false, menuHistoryIzin:false,
    menuKas:false, menuSOP:true, menuJobDesk:false, menuSerahTerima:false,
    setShift:false, editStaff:false, tambahStaff:false, hapusStaff:false,
    resetAbsen:false, inputTransaksi:false, hapusTransaksiKas:false,
    tambahSOP:false, hapusSOP:false, aksesKirimBroadcast:false,
    bukaJobDesk:false
  }
};
function loadAkses(){
  const saved=loadJson(AKSES_FILE,{});
  const merged={};
  Object.keys(DEFAULT_AKSES).forEach(jabatan=>{
    const savedKey=Object.keys(saved).find(k=>k.toLowerCase()===jabatan.toLowerCase());
    merged[jabatan]={...DEFAULT_AKSES[jabatan],...(savedKey?saved[savedKey]:{})};
  });
  return merged;
}
function saveAkses(d){saveJson(AKSES_FILE,d);}

function loadSettings(){return loadJson(SETTINGS_FILE,{theme:"dark-blue",notification:{reminderEnabled:true,reminderMinutes:15,emailEnabled:false,recipients:[]}});}
function saveSettings(d){saveJson(SETTINGS_FILE,d);}

function todayStr(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
// Sesi izin window: aktif sejak absen masuk, berlaku 12 jam (cover shift 10 jam + extend 2 jam).
// Cari absen paling baru yang window-nya masih aktif saat ini.
// Jika semua window sudah expired → kuota reset, perlu absen baru.
function getIzinWindow(userId,absensiList){
  const now=Date.now();
  const WINDOW_MS=12*60*60*1000; // 12 jam
  const absenSaya=absensiList
    .filter(a=>Number(a.userId)===Number(userId))
    .sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  if(!absenSaya.length)return{start:null,end:null,tanggal:todayStr(),absenTimestamp:null,windowExpired:false};
  // Cari absen yang window-nya masih aktif sekarang
  const activeAbsen=absenSaya.find(a=>{
    const t=new Date(a.timestamp).getTime();
    return now>=t&&now<=(t+WINDOW_MS);
  });
  if(activeAbsen){
    const start=new Date(activeAbsen.timestamp);
    const end=new Date(start.getTime()+WINDOW_MS);
    return{start,end,tanggal:activeAbsen.tanggal,absenTimestamp:activeAbsen.timestamp,windowExpired:false};
  }
  // Tidak ada window aktif — semua sudah expired, return info absen terbaru
  const last=absenSaya[0];
  const start=new Date(last.timestamp);
  const end=new Date(start.getTime()+WINDOW_MS);
  return{start,end,tanggal:last.tanggal,absenTimestamp:last.timestamp,windowExpired:true};
}
function currentTimeStr(){return new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit",second:"2-digit"});}
function getCurrentShiftName(){const h=new Date().getHours();if(h>=5&&h<11)return"Pagi";if(h>=11&&h<15)return"Siang";if(h>=15&&h<19)return"Sore";return"Malam";}
function shiftOrder(){return["Pagi","Siang","Sore","Malam"];}
function parseTimeToMinutes(t){if(!t||!t.includes(":"))return null;const[h,m]=t.split(":").map(Number);return h*60+(m||0);}
function minusMinutes(t,sub){const total=parseTimeToMinutes(t);if(total===null)return"-";let r=total-sub;if(r<0)r+=24*60;return`${Math.floor(r/60).toString().padStart(2,"0")}:${(r%60).toString().padStart(2,"0")}`;}
function safeUser(u){return{id:u.id,nama:u.nama,username:u.username,role:u.role,jabatan:u.jabatan,shift:u.shift,shiftStartTime:u.shiftStartTime||"08:00",active:u.active,profile:u.profile||{}};}

// AUTH
app.get("/",(req,res)=>res.sendFile(path.join(__dirname,"public","dashboard.html")));
app.post("/api/login",(req,res)=>{
  const{username,password}=req.body;
  if(!username||!password)return res.status(400).json({status:"error",message:"Username dan password wajib diisi"});
  const user=loadUsers().find(u=>u.username===username&&u.password===password&&u.active===true);
  if(!user)return res.status(401).json({status:"error",message:"Username atau password salah"});
  const akses=loadAkses();
  const jabatanKey=Object.keys(akses).find(k=>k.toLowerCase()===user.jabatan.toLowerCase())||"Staff";
  const hakAkses=user.role==="admin"?null:(akses[jabatanKey]||akses["Staff"]||{});
  res.json({status:"success",message:"Login berhasil",user:safeUser(user),hakAkses});
});

// STAFF
app.get("/api/staff",(req,res)=>res.json({status:"success",data:loadUsers().map(safeUser)}));
app.get("/api/staff/:id",(req,res)=>{const user=loadUsers().find(u=>u.id===Number(req.params.id));if(!user)return res.status(404).json({status:"error",message:"User tidak ditemukan"});res.json({status:"success",data:safeUser(user)});});
app.post("/api/staff",(req,res)=>{
  let users=loadUsers();const{nama,username,password,role,jabatan,shift,shiftStartTime}=req.body;
  if(!nama||!username||!password)return res.status(400).json({status:"error",message:"Nama, username, dan password wajib diisi"});
  if(users.find(u=>u.username===username))return res.status(400).json({status:"error",message:"Username sudah digunakan"});
  const newUser={id:users.length?Math.max(...users.map(u=>u.id))+1:1,nama,username,password,role:role||"staff",jabatan:jabatan||"Staff",shift:shift||"Pagi",shiftStartTime:shiftStartTime||"08:00",active:true,profile:{nickname:nama,phone:"",bio:"",motto:"",avatarText:nama.charAt(0).toUpperCase(),avatarImage:""}};
  users.push(newUser);saveUsers(users);res.json({status:"success",message:"Staff berhasil ditambahkan",data:safeUser(newUser)});
});
app.put("/api/staff/:id",(req,res)=>{
  let users=loadUsers();const idx=users.findIndex(u=>u.id===Number(req.params.id));
  if(idx===-1)return res.status(404).json({status:"error",message:"User tidak ditemukan"});
  const{nama,jabatan,shift,shiftStartTime,role,active}=req.body;
  if(nama)users[idx].nama=nama;if(jabatan)users[idx].jabatan=jabatan;if(shift)users[idx].shift=shift;if(shiftStartTime)users[idx].shiftStartTime=shiftStartTime;if(role)users[idx].role=role;if(typeof active==="boolean")users[idx].active=active;
  saveUsers(users);res.json({status:"success",message:"Data staff berhasil diperbarui",data:safeUser(users[idx])});
});
app.delete("/api/staff/:id",(req,res)=>{let users=loadUsers();const idx=users.findIndex(u=>u.id===Number(req.params.id));if(idx===-1)return res.status(404).json({status:"error",message:"User tidak ditemukan"});users.splice(idx,1);saveUsers(users);res.json({status:"success",message:"Staff berhasil dihapus"});});
app.put("/api/staff/:id/reset-password",(req,res)=>{let users=loadUsers();const idx=users.findIndex(u=>u.id===Number(req.params.id));if(idx===-1)return res.status(404).json({status:"error",message:"User tidak ditemukan"});if(!req.body.newPassword)return res.status(400).json({status:"error",message:"Password baru wajib diisi"});users[idx].password=req.body.newPassword;saveUsers(users);res.json({status:"success",message:"Password berhasil direset"});});
app.put("/api/staff/:id/change-password",(req,res)=>{let users=loadUsers();const idx=users.findIndex(u=>u.id===Number(req.params.id));if(idx===-1)return res.status(404).json({status:"error",message:"User tidak ditemukan"});const{oldPassword,newPassword}=req.body;if(users[idx].password!==oldPassword)return res.status(400).json({status:"error",message:"Password lama tidak sesuai"});if(!newPassword||newPassword.length<4)return res.status(400).json({status:"error",message:"Password baru minimal 4 karakter"});users[idx].password=newPassword;saveUsers(users);res.json({status:"success",message:"Password berhasil diubah"});});
app.put("/api/staff/:id/shift",(req,res)=>{let users=loadUsers();const idx=users.findIndex(u=>u.id===Number(req.params.id));if(idx===-1)return res.status(404).json({status:"error",message:"User tidak ditemukan"});const{shift,shiftStartTime}=req.body;if(!shift||!shiftStartTime)return res.status(400).json({status:"error",message:"Shift dan jam masuk wajib diisi"});users[idx].shift=shift;users[idx].shiftStartTime=shiftStartTime;saveUsers(users);res.json({status:"success",message:"Shift berhasil diperbarui"});});
app.put("/api/staff/:id/profile",(req,res)=>{let users=loadUsers();const idx=users.findIndex(u=>u.id===Number(req.params.id));if(idx===-1)return res.status(404).json({status:"error",message:"User tidak ditemukan"});const{nickname,phone,bio,motto,avatarText,avatarImage}=req.body;users[idx].profile={...(users[idx].profile||{}),nickname:nickname||users[idx].nama,phone:phone||"",bio:bio||"",motto:motto||"",avatarText:avatarText||users[idx].nama.charAt(0).toUpperCase(),avatarImage:avatarImage!==undefined?avatarImage:(users[idx].profile?.avatarImage||"")};saveUsers(users);res.json({status:"success",message:"Profil berhasil diperbarui",data:safeUser(users[idx])});});

// ABSENSI
app.post("/api/absensi",(req,res)=>{
  const{userId}=req.body;if(!userId)return res.status(400).json({status:"error",message:"User ID wajib diisi"});
  const users=loadUsers(),absensi=loadAbsensi();const user=users.find(u=>u.id===Number(userId));
  if(!user)return res.status(404).json({status:"error",message:"User tidak ditemukan"});
  const today=todayStr();if(absensi.find(a=>Number(a.userId)===Number(userId)&&a.tanggal===today))return res.status(400).json({status:"error",message:"Anda sudah absen hari ini"});
  const now=new Date();const shiftStart=parseTimeToMinutes(user.shiftStartTime||"08:00");const nowMin=now.getHours()*60+now.getMinutes();const telat=shiftStart!==null&&nowMin>shiftStart+15;
  const record={id:absensi.length?Math.max(...absensi.map(a=>a.id))+1:1,userId:user.id,nama:user.nama,username:user.username,jabatan:user.jabatan,shiftTerdaftar:user.shift,shiftStartTime:user.shiftStartTime||"08:00",wajibAbsenMulai:minusMinutes(user.shiftStartTime||"08:00",15),shiftAbsensi:getCurrentShiftName(),tanggal:today,jamMasuk:currentTimeStr(),timestamp:now.toISOString(),status:telat?"Terlambat":"Hadir"};
  absensi.push(record);saveAbsensi(absensi);res.json({status:"success",message:"Absensi berhasil",data:record});
});
app.get("/api/absensi",(req,res)=>res.json({status:"success",data:loadAbsensi().sort((a,b)=>b.id-a.id)}));
app.get("/api/absensi/today",(req,res)=>{const today=todayStr();res.json({status:"success",data:loadAbsensi().filter(a=>a.tanggal===today).sort((a,b)=>b.id-a.id)});});

// DASHBOARD SUMMARY
app.get("/api/dashboard-summary",(req,res)=>{
  const users=loadUsers(),absensi=loadAbsensi(),today=todayStr();
  const activeStaff=users.filter(u=>u.active&&u.role==="staff");const todayAbs=absensi.filter(a=>a.tanggal===today);const shiftData={};
  shiftOrder().forEach(shift=>{const ss=activeStaff.filter(u=>u.shift===shift);const hadir=[],belum=[];ss.forEach(s=>{const f=todayAbs.find(a=>Number(a.userId)===Number(s.id));const o={id:s.id,nama:s.nama,username:s.username,jabatan:s.jabatan,shift:s.shift,shiftStartTime:s.shiftStartTime||"08:00",wajibAbsenMulai:minusMinutes(s.shiftStartTime||"08:00",15)};if(f)hadir.push({...o,jamMasuk:f.jamMasuk,shiftAbsensi:f.shiftAbsensi,status:f.status});else belum.push(o);});shiftData[shift]={totalStaff:ss.length,hadir,belum};});
  res.json({status:"success",data:{totalStaffAktif:activeStaff.length,totalAbsenHariIni:todayAbs.length,totalBelumAbsen:activeStaff.length-todayAbs.length,totalTerlambat:todayAbs.filter(a=>a.status==="Terlambat").length,shiftSaatIni:getCurrentShiftName(),shiftData}});
});

// IZIN KELUAR
const ROLE_LIMIT={Kasir:2,Kapten:1,CS:1,"CS LINE":1};const MAX_IZIN=4,MAX_DURASI=15;
app.get("/api/izin/active",(req,res)=>{res.json({status:"success",data:loadIzin().filter(i=>i.status==="Aktif")});});
app.get("/api/izin/window/:userId",(req,res)=>{
  const userId=Number(req.params.userId);
  const absensi=loadAbsensi(),izin=loadIzin();
  const win=getIzinWindow(userId,absensi);
  let myWindow=[];
  if(win.start&&!win.windowExpired){
    myWindow=izin.filter(i=>Number(i.userId)===userId&&new Date(i.timestamp)>=win.start&&new Date(i.timestamp)<=win.end);
  }
  res.json({status:"success",data:{hasAbsen:!!win.start,windowStart:win.start,windowEnd:win.end,windowExpired:win.windowExpired,usedInWindow:myWindow.length,maxIzin:MAX_IZIN}});
});
app.get("/api/izin/history",(req,res)=>res.json({status:"success",data:loadIzin().sort((a,b)=>b.id-a.id)}));
app.get("/api/izin/status/:userId",(req,res)=>{
  const userId=Number(req.params.userId);
  const izin=loadIzin(),absensi=loadAbsensi();
  const win=getIzinWindow(userId,absensi);
  let myWindow=[];
  if(win.start&&!win.windowExpired){
    myWindow=izin.filter(i=>Number(i.userId)===userId&&new Date(i.timestamp)>=win.start&&new Date(i.timestamp)<=win.end);
  } else {
    // Window expired atau belum pernah absen — kuota dianggap 0 (sudah reset)
    myWindow=[];
  }
  const active=myWindow.find(i=>i.status==="Aktif");
  let info=null;
  if(active){const dur=Math.floor((Date.now()-new Date(active.timestamp).getTime())/60000);info={id:active.id,jamKeluar:active.jamKeluar,durasiMenit:dur,remainingMinutes:Math.max(0,MAX_DURASI-dur),nearLimit:dur>=MAX_DURASI-1,overLimit:dur>=MAX_DURASI};}
  res.json({status:"success",data:{active:!!active,used:myWindow.length,izin:info,windowStart:win.start,windowEnd:win.end,windowExpired:win.windowExpired}});
});
app.post("/api/izin/start",(req,res)=>{
  const{userId}=req.body;if(!userId)return res.status(400).json({status:"error",message:"User ID wajib diisi"});
  const users=loadUsers(),absensi=loadAbsensi(),izin=loadIzin();
  const user=users.find(u=>u.id===Number(userId));
  if(!user)return res.status(404).json({status:"error",message:"User tidak ditemukan"});
  // Cek: harus sudah absen dan window sesi masih aktif (belum lewat 12 jam)
  const win=getIzinWindow(userId,absensi);
  if(!win.start)return res.status(400).json({status:"error",message:"Anda harus absen bertugas terlebih dahulu sebelum izin keluar"});
  if(win.windowExpired)return res.status(400).json({status:"error",message:"Sesi kerja Anda sudah berakhir. Silakan absen kembali untuk shift berikutnya."});
  // Hitung kuota dalam window sesi ini
  const myWindow=izin.filter(i=>Number(i.userId)===Number(userId)&&new Date(i.timestamp)>=win.start&&new Date(i.timestamp)<=win.end);
  if(myWindow.find(i=>i.status==="Aktif"))return res.status(400).json({status:"error",message:"Anda masih memiliki izin aktif. Selesaikan terlebih dahulu."});
  if(myWindow.length>=MAX_IZIN)return res.status(400).json({status:"error",message:`Kuota izin sesi ini sudah habis (maks ${MAX_IZIN}x per sesi kerja)`});
  // Cek batas per jabatan (bersamaan keluar)
  const jabatan=user.jabatan,limit=ROLE_LIMIT[jabatan];
  const today=todayStr();
  if(limit!==undefined){const byRole=izin.filter(i=>i.tanggal===today&&i.status==="Aktif"&&i.jabatan===jabatan);if(byRole.length>=limit)return res.json({status:"blocked",detail:`Sudah ada ${jabatan} yang sedang keluar: ${byRole.map(i=>i.nama).join(", ")}`,subdetail:`Maksimal ${limit} ${jabatan} boleh keluar bersamaan.`});}
  const now=new Date();
  const record={id:izin.length?Math.max(...izin.map(i=>i.id))+1:1,userId:user.id,nama:user.nama,username:user.username,jabatan:user.jabatan,tanggal:todayStr(),jamKeluar:currentTimeStr(),jamKembali:null,durasiMenit:0,timestamp:now.toISOString(),status:"Aktif"};
  izin.push(record);saveIzin(izin);res.json({status:"success",message:"Izin keluar dimulai",data:record});
});
app.post("/api/izin/end",(req,res)=>{
  const{userId}=req.body;if(!userId)return res.status(400).json({status:"error",message:"User ID wajib diisi"});
  let izin=loadIzin();
  // Cari izin aktif berdasarkan userId + status saja (tidak pakai tanggal agar lintas tengah malam tetap bisa)
  const idx=izin.findIndex(i=>Number(i.userId)===Number(userId)&&i.status==="Aktif");
  if(idx===-1)return res.status(400).json({status:"error",message:"Tidak ada izin aktif"});
  const dur=Math.round((Date.now()-new Date(izin[idx].timestamp).getTime())/60000);izin[idx].jamKembali=currentTimeStr();izin[idx].durasiMenit=dur;izin[idx].status=dur>MAX_DURASI?"Melewati Batas":"Selesai";
  saveIzin(izin);res.json({status:"success",message:"Izin keluar selesai",data:izin[idx]});
});

// SOP
app.get("/api/sop",(req,res)=>res.json({status:"success",data:loadSop()}));
app.post("/api/sop",(req,res)=>{const sop=loadSop();const{judul,kategori,konten,prioritas,dibuat_oleh}=req.body;if(!judul||!konten)return res.status(400).json({status:"error",message:"Judul dan konten wajib diisi"});const newSop={id:sop.length?Math.max(...sop.map(s=>s.id))+1:1,judul,kategori:kategori||"Umum",konten,prioritas:prioritas||"Normal",dibuat_oleh:dibuat_oleh||"Admin",tanggal:todayStr(),timestamp:new Date().toISOString(),aktif:true};sop.push(newSop);saveSop(sop);res.json({status:"success",message:"SOP berhasil ditambahkan",data:newSop});});
app.put("/api/sop/:id",(req,res)=>{const sop=loadSop();const idx=sop.findIndex(s=>s.id===Number(req.params.id));if(idx===-1)return res.status(404).json({status:"error",message:"SOP tidak ditemukan"});const{judul,kategori,konten,prioritas,aktif}=req.body;if(judul)sop[idx].judul=judul;if(kategori)sop[idx].kategori=kategori;if(konten)sop[idx].konten=konten;if(prioritas)sop[idx].prioritas=prioritas;if(typeof aktif==="boolean")sop[idx].aktif=aktif;sop[idx].diperbarui=new Date().toISOString();saveSop(sop);res.json({status:"success",message:"SOP berhasil diperbarui",data:sop[idx]});});
app.delete("/api/sop/:id",(req,res)=>{const sop=loadSop();const idx=sop.findIndex(s=>s.id===Number(req.params.id));if(idx===-1)return res.status(404).json({status:"error",message:"SOP tidak ditemukan"});sop.splice(idx,1);saveSop(sop);res.json({status:"success",message:"SOP berhasil dihapus"});});

// KAS
app.get("/api/kas",(req,res)=>{const kas=loadKas();const total=kas.transaksi.reduce((acc,t)=>t.tipe==="masuk"?acc+t.jumlah:acc-t.jumlah,kas.saldoAwal);res.json({status:"success",data:{...kas,saldoAkhir:total}});});
app.put("/api/kas/saldo-awal",(req,res)=>{const kas=loadKas();const{saldoAwal}=req.body;if(typeof saldoAwal!=="number")return res.status(400).json({status:"error",message:"Saldo awal harus berupa angka"});kas.saldoAwal=saldoAwal;saveKas(kas);res.json({status:"success",message:"Saldo awal berhasil diperbarui"});});
app.post("/api/kas/transaksi",(req,res)=>{const kas=loadKas();const{tipe,jumlah,keterangan,kategori,dicatat_oleh,bukti}=req.body;if(!tipe||!jumlah||!keterangan)return res.status(400).json({status:"error",message:"Tipe, jumlah, dan keterangan wajib diisi"});if(!["masuk","keluar"].includes(tipe))return res.status(400).json({status:"error",message:"Tipe harus masuk atau keluar"});const newT={id:kas.transaksi.length?Math.max(...kas.transaksi.map(t=>t.id))+1:1,tipe,jumlah:Number(jumlah),keterangan,kategori:kategori||"Operasional",dicatat_oleh:dicatat_oleh||"Staff",bukti:bukti||"",tanggal:todayStr(),timestamp:new Date().toISOString()};kas.transaksi.push(newT);saveKas(kas);res.json({status:"success",message:"Transaksi berhasil dicatat",data:newT});});
app.delete("/api/kas/transaksi/:id",(req,res)=>{const kas=loadKas();const idx=kas.transaksi.findIndex(t=>t.id===Number(req.params.id));if(idx===-1)return res.status(404).json({status:"error",message:"Transaksi tidak ditemukan"});kas.transaksi.splice(idx,1);saveKas(kas);res.json({status:"success",message:"Transaksi berhasil dihapus"});});

// SERAH TERIMA CS LINE
app.get("/api/serahterima",(req,res)=>{
  const data=loadSerahTerima();
  const{tanggal,limit}=req.query;
  let filtered=data;
  if(tanggal)filtered=filtered.filter(s=>s.tanggal===tanggal);
  filtered=filtered.sort((a,b)=>b.id-a.id);
  if(limit)filtered=filtered.slice(0,Number(limit));
  res.json({status:"success",data:filtered});
});
app.post("/api/serahterima",(req,res)=>{
  const data=loadSerahTerima();
  const{shift_dari,shift_ke,petugas_dari,petugas_ke,ringkasan,kendala,tindakan,catatan,status_sistem}=req.body;
  if(!petugas_dari||!ringkasan)return res.status(400).json({status:"error",message:"Petugas dan ringkasan wajib diisi"});
  const newData={
    id:data.length?Math.max(...data.map(s=>s.id))+1:1,
    shift_dari:shift_dari||"",shift_ke:shift_ke||"",
    petugas_dari:petugas_dari,petugas_ke:petugas_ke||"",
    ringkasan,kendala:kendala||"Tidak ada",
    tindakan:tindakan||"",catatan:catatan||"",
    status_sistem:status_sistem||"Normal",
    tanggal:todayStr(),jam:currentTimeStr(),
    timestamp:new Date().toISOString()
  };
  data.push(newData);saveSerahTerima(data);
  res.json({status:"success",message:"Serah terima berhasil dicatat",data:newData});
});
app.delete("/api/serahterima/:id",(req,res)=>{
  const data=loadSerahTerima();const idx=data.findIndex(s=>s.id===Number(req.params.id));
  if(idx===-1)return res.status(404).json({status:"error",message:"Data tidak ditemukan"});
  data.splice(idx,1);saveSerahTerima(data);
  res.json({status:"success",message:"Data serah terima dihapus"});
});

// BROADCAST (pesan berjalan untuk semua user)
app.get("/api/broadcast",(req,res)=>res.json({status:"success",data:loadBroadcast()}));
app.put("/api/broadcast",(req,res)=>{
  const{aktif,pesan,dibuat_oleh}=req.body;
  const broadcast={aktif:!!aktif,pesan:pesan||"",dibuat_oleh:dibuat_oleh||"Admin",timestamp:new Date().toISOString()};
  saveBroadcast(broadcast);
  res.json({status:"success",message:aktif?"Broadcast diaktifkan":"Broadcast dinonaktifkan",data:broadcast});
});

// OTORITAS HAK AKSES
app.get("/api/akses",(req,res)=>res.json({status:"success",data:loadAkses()}));
app.put("/api/akses/:jabatan",(req,res)=>{const akses=loadAkses();const jabatan=decodeURIComponent(req.params.jabatan);akses[jabatan]={...(akses[jabatan]||{}),...req.body};saveAkses(akses);res.json({status:"success",message:`Hak akses ${jabatan} berhasil disimpan`,data:akses[jabatan]});});

// SETTINGS
app.get("/api/settings",(req,res)=>res.json({status:"success",data:loadSettings()}));
app.put("/api/settings",(req,res)=>{const current=loadSettings();const updated={...current,...req.body};if(req.body.notification)updated.notification={...current.notification,...req.body.notification};saveSettings(updated);res.json({status:"success",message:"Pengaturan disimpan",data:updated});});

// HAPUS HISTORY IZIN
app.delete("/api/izin/:id",(req,res)=>{let izin=loadIzin();const idx=izin.findIndex(i=>i.id===Number(req.params.id));if(idx===-1)return res.status(404).json({status:"error",message:"Data tidak ditemukan"});izin.splice(idx,1);saveIzin(izin);res.json({status:"success",message:"History izin dihapus"});});
app.delete("/api/izin/bulk/tanggal",(req,res)=>{const{tanggal}=req.body;let izin=loadIzin();if(tanggal)izin=izin.filter(i=>i.tanggal!==tanggal);else izin=[];saveIzin(izin);res.json({status:"success",message:"History izin dihapus"});});

// JOB DESK
app.get("/api/jobdesk",(req,res)=>{const data=loadJobDesk();const{tanggal}=req.query;res.json({status:"success",data:tanggal?data.filter(j=>j.tanggal===tanggal):data});});
app.post("/api/jobdesk",(req,res)=>{const jd=loadJobDesk();const{userId,nama,jabatan,jobdesk,tanggal,dibuat_oleh}=req.body;if(!userId||!jobdesk)return res.status(400).json({status:"error",message:"userId dan jobdesk wajib diisi"});const tgl=tanggal||todayStr();const filtered=jd.filter(j=>!(Number(j.userId)===Number(userId)&&j.tanggal===tgl));const newJD={id:jd.length?Math.max(...jd.map(j=>j.id))+1:1,userId:Number(userId),nama,jabatan,jobdesk,tanggal:tgl,jam:currentTimeStr(),timestamp:new Date().toISOString(),dibuat_oleh:dibuat_oleh||"Admin"};filtered.push(newJD);saveJobDesk(filtered);res.json({status:"success",message:"Job desk berhasil disimpan",data:newJD});});
app.delete("/api/jobdesk/:id",(req,res)=>{const jd=loadJobDesk();const idx=jd.findIndex(j=>j.id===Number(req.params.id));if(idx===-1)return res.status(404).json({status:"error",message:"Job desk tidak ditemukan"});jd.splice(idx,1);saveJobDesk(jd);res.json({status:"success",message:"Job desk berhasil dihapus"});});

app.listen(PORT,()=>console.log(`Server dashboard berjalan di http://localhost:${PORT}`));
