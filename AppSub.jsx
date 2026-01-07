import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Lock, LogOut, Droplets, 
  Briefcase, Camera, X, Menu, Phone, Mail, 
  ChevronRight, LayoutDashboard, Eye, 
  Truck, Wallet, FlaskConical, IceCream, PlusCircle, MinusCircle,
  Upload, Image as ImageIcon, Loader2, Car, Store, CheckCircle,
  MapPin, Settings, ArrowRight
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, 
  signOut, signInAnonymously 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, deleteDoc, 
  doc, onSnapshot 
} from 'firebase/firestore';
import { 
  getStorage, ref, uploadBytes, getDownloadURL 
} from 'firebase/storage';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = JSON.parse(window.__firebase_config || '{}');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'waterchon-pro-v2';

export default function App() {
  const [user, setUser] = useState(null);
  // Simulamos los dos sitios mediante este estado: 'landing' o 'admin-subdomain'
  const [siteMode, setSiteMode] = useState('landing'); 
  const [vacantes, setVacantes] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [order, setOrder] = useState({ normal: 0, alcalina: 0, hielo: 0 });

  // Auth Listener
  useEffect(() => {
    const initAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
        if (!auth.currentUser) await signInAnonymously(auth);
        return () => unsubscribe();
      } catch (e) { console.error(e); }
    };
    initAuth();
  }, []);

  // Listeners de Datos (Misma DB para ambos modos)
  useEffect(() => {
    if (!user) return;
    const vRef = collection(db, 'artifacts', appId, 'public', 'data', 'vacantes');
    const gRef = collection(db, 'artifacts', appId, 'public', 'data', 'galeria');
    const unsubV = onSnapshot(vRef, (snap) => setVacantes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubG = onSnapshot(gRef, (snap) => setGaleria(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubV(); unsubG(); };
  }, [user]);

  // Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, e.target.email.value, e.target.password.value);
    } catch (error) { alert("Acceso denegado. Credenciales incorrectas."); }
  };

  const adjustQty = (type, delta) => {
    setOrder(prev => ({ ...prev, [type]: Math.max(0, Math.min(10, prev[type] + delta)) }));
  };

  const handleSendOrder = (e) => {
    e.preventDefault();
    const { order_name, order_phone, order_address } = e.target;
    if (order.normal + order.alcalina + order.hielo === 0) return alert("Selecciona productos.");
    const items = [];
    if (order.normal > 0) items.push(`${order.normal} Normal`);
    if (order.alcalina > 0) items.push(`${order.alcalina} Alcalina`);
    if (order.hielo > 0) items.push(`${order.hielo} Hielo`);
    const msg = `Pedido WaterChon:%0A- Cliente: ${order_name.value}%0A- Tel: ${order_phone.value}%0A- Dir: ${order_address.value}%0A- Items: ${items.join(', ')}`;
    window.open(`https://wa.me/526671234567?text=${msg}`, '_blank');
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    const file = e.target.photo_file.files[0];
    if (!file || file.size > 5 * 1024 * 1024) return alert("Archivo no válido o mayor a 5MB");
    setUploading(true);
    try {
      const storagePath = `artifacts/${appId}/public/gallery/${Date.now()}_${file.name}`;
      const imageRef = ref(storage, storagePath);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'galeria'), {
        titulo: e.target.titulo.value, url, tipo: e.target.tipo.value, createdAt: Date.now()
      });
      e.target.reset();
      alert("Galería actualizada.");
    } catch (err) { alert("Error al subir"); } finally { setUploading(false); }
  };

  const handleVacanteAdd = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'vacantes'), {
      titulo: e.target.titulo.value, sueldo: e.target.sueldo.value, horario: e.target.horario.value,
      color: e.target.color.value, categoria: e.target.categoria.value, createdAt: Date.now()
    });
    e.target.reset();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-blue-900"><Droplets className="text-white animate-bounce w-12 h-12" /></div>;

  // --- VISTA: LANDING PAGE PRINCIPAL ---
  const LandingView = () => (
    <>
      <nav className="fixed w-full z-50 bg-blue-900 shadow-2xl text-white">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-lg"><Droplets className="text-blue-600 w-6 h-6" /></div>
            <span className="text-xl font-black italic uppercase">Water<span className="text-blue-400">Chon</span></span>
          </div>
          <div className="hidden lg:flex gap-8 font-bold text-xs uppercase italic">
            <a href="#servicios" className="hover:text-blue-400 transition-colors">Servicios</a>
            <a href="#pedidos" className="hover:text-blue-400 transition-colors">Pedidos</a>
            <a href="#sucursales" className="hover:text-blue-400 transition-colors">Sucursales</a>
            <a href="#galeria" className="hover:text-blue-400 transition-colors">Galería</a>
            <a href="#vacantes" className="hover:text-white transition-colors">Vacantes</a>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setSiteMode('admin-subdomain')} className="text-blue-400/20 hover:text-blue-400 transition-colors"><Settings size={18} /></button>
            <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2"><Menu /></button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100">Culiacán, Sinaloa</span>
            <h1 className="text-5xl md:text-7xl font-black leading-tight text-slate-900 tracking-tighter uppercase italic">Agua <span className="text-blue-600">Alcalina</span> <br/>y Normal.</h1>
            <p className="text-slate-500 text-lg italic max-w-lg mx-auto lg:mx-0">Garrafones profesionales WaterChon con el balance perfecto de minerales para tu salud.</p>
            <a href="#pedidos" className="inline-block bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:bg-blue-700 transition-all">PEDIR AHORA</a>
          </div>
          <div className="flex-1 relative">
            <img src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=1000" className="rounded-[50px] shadow-2xl border-[12px] border-white w-full h-[500px] object-cover" alt="WaterChon" />
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section id="servicios" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter uppercase italic">Water<span className="text-blue-600">Chon</span> Solutions</h2>
            <div className="w-20 h-2 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[40px] bg-blue-50 border border-blue-100"><Droplets className="text-blue-600 w-12 h-12 mb-6"/><h3 className="text-2xl font-black mb-4 uppercase italic">Plantas de Agua</h3><p className="font-bold text-slate-600 text-sm">Purificada y Alcalina Premium de 20L.</p></div>
            <div className="p-10 rounded-[40px] bg-slate-100 border border-slate-200"><Car className="text-slate-800 w-12 h-12 mb-6"/><h3 className="text-2xl font-black mb-4 uppercase italic">Autolavado</h3><p className="font-bold text-slate-600 text-sm">Lavado a detalle y estética profesional.</p></div>
            <div className="p-10 rounded-[40px] bg-orange-50 border border-orange-100"><Store className="text-orange-600 w-12 h-12 mb-6"/><h3 className="text-2xl font-black mb-4 uppercase italic">Super & Six</h3><p className="font-bold text-slate-600 text-sm">Venta de botanas, bebidas y hielo.</p></div>
          </div>
        </div>
      </section>

      {/* Pedidos */}
      <section id="pedidos" className="py-24 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-slate-100">
            <div className="lg:w-1/3 bg-blue-600 p-12 text-white flex flex-col justify-center">
              <h3 className="text-4xl font-black mb-4 uppercase italic leading-none">Levantar <br/>Pedido</h3>
              <div className="space-y-4 font-black uppercase text-xs mt-6">
                <div className="flex items-center gap-3"><Truck size={20}/> Entrega Inmediata</div>
                <div className="flex items-center gap-3"><Wallet size={20}/> Pago al Recibir</div>
              </div>
            </div>
            <div className="flex-1 p-8 md:p-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {['normal', 'alcalina', 'hielo'].map(t => (
                  <div key={t} className="flex flex-col items-center p-6 border-2 border-slate-100 rounded-3xl bg-slate-50">
                    <span className="font-black text-slate-800 mb-4 text-[10px] uppercase tracking-widest">{t === 'hielo' ? 'Bolsa Hielo' : `Agua ${t}`}</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => adjustQty(t, -1)}><MinusCircle className="text-slate-300 hover:text-blue-600"/></button>
                      <span className="text-2xl font-black w-6 text-center">{order[t]}</span>
                      <button onClick={() => adjustQty(t, 1)}><PlusCircle className="text-slate-300 hover:text-blue-600"/></button>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendOrder} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <input name="order_name" placeholder="Nombre" className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold" required />
                  <input name="order_phone" type="tel" placeholder="WhatsApp" className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold" required />
                </div>
                <input name="order_address" placeholder="Dirección de entrega" className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500 font-bold" required />
                <button className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 italic">CONFIRMAR WHATSAPP</button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Sucursales - MAPS FIXED */}
      <section id="sucursales" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-black mb-16 uppercase italic text-center tracking-tighter">Puntos <span className="text-blue-600">WaterChon</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Planta Norte */}
            <div className="bg-blue-900 rounded-[2.5rem] p-6 shadow-xl border border-blue-800 text-white group transition-all hover:border-blue-400">
              <div className="w-full h-44 rounded-3xl overflow-hidden mb-6 bg-slate-900 border border-blue-700/50">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58045.54941913754!2d-107.4338421453396!3d24.79510103444855!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86bbd249f05908e3%3A0x892a7e78d2b904d4!2sCuliac%C3%A1n%20Rosales%2C%20Sin.!5e0!3m2!1ses-419!2smx!4v1714578000000!5m2!1ses-419!2smx" 
                  width="100%" height="100%" style={{border:0}} allowFullScreen="" loading="lazy">
                </iframe>
              </div>
              <div className="flex items-center gap-2 mb-1"><MapPin size={16} className="text-blue-300" /><h4 className="text-xl font-black uppercase italic tracking-tighter">Planta Norte</h4></div>
              <p className="text-blue-100 text-sm font-bold italic opacity-70">Sector Santa Fe, Culiacán.</p>
            </div>

            {/* Planta Sur */}
            <div className="bg-blue-900 rounded-[2.5rem] p-6 shadow-xl border border-blue-800 text-white group transition-all hover:border-blue-400">
              <div className="w-full h-44 rounded-3xl overflow-hidden mb-6 bg-slate-900 border border-blue-700/50">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58055.44192452033!2d-107.3994356!3d24.8101234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86bbd1d785750849%3A0xa988950892015560!2sCuliacan%2C%20Sinaloa!5e0!3m2!1ses-419!2smx!4v1714578100000!5m2!1ses-419!2smx" 
                  width="100%" height="100%" style={{border:0}} allowFullScreen="" loading="lazy">
                </iframe>
              </div>
              <div className="flex items-center gap-2 mb-1"><MapPin size={16} className="text-blue-300" /><h4 className="text-xl font-black uppercase italic tracking-tighter">Planta Sur</h4></div>
              <p className="text-blue-100 text-sm font-bold italic opacity-70">Blvd. Ganaderos (Frente a Expo).</p>
            </div>

            {/* Planta Poniente */}
            <div className="bg-blue-900 rounded-[2.5rem] p-6 shadow-xl border border-blue-800 text-white group transition-all hover:border-blue-400">
              <div className="w-full h-44 rounded-3xl overflow-hidden mb-6 bg-slate-900 border border-blue-700/50">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58042.8!2d-107.45!3d24.82!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86bbd249f05908e3%3A0x892a7e78d2b904d4!2sAguaruto%2C%20Sin.!5e0!3m2!1ses-419!2smx!4v1714578500000!5m2!1ses-419!2smx" 
                  width="100%" height="100%" style={{border:0}} allowFullScreen="" loading="lazy">
                </iframe>
              </div>
              <div className="flex items-center gap-2 mb-1"><MapPin size={16} className="text-blue-300" /><h4 className="text-xl font-black uppercase italic tracking-tighter">Planta Poniente</h4></div>
              <p className="text-blue-100 text-sm font-bold italic opacity-70">Bugambilias / Aeropuerto.</p>
            </div>

            {/* Humaya */}
            <div className="bg-blue-900 rounded-[2.5rem] p-6 shadow-xl border border-blue-800 text-white group transition-all hover:border-blue-400">
              <div className="w-full h-44 rounded-3xl overflow-hidden mb-6 bg-slate-900 border border-blue-700/50">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58042.345!2d-107.42!3d24.83!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86bbd26e47f7d745%3A0xe67c06232537f90!2sDesarrollo%20Urbano%20Tres%20R%C3%ADos%2C%20Culiac%C3%A1n%20Rosales%2C%20Sin.!5e0!3m2!1ses-419!2smx!4v1714578300000!5m2!1ses-419!2smx" 
                  width="100%" height="100%" style={{border:0}} allowFullScreen="" loading="lazy">
                </iframe>
              </div>
              <div className="flex items-center gap-2 mb-1"><MapPin size={16} className="text-blue-300" /><h4 className="text-xl font-black uppercase italic tracking-tighter">Car Wash Humaya</h4></div>
              <p className="text-blue-100 text-sm font-bold italic opacity-70">Sector Tres Ríos / Humaya.</p>
            </div>

            {/* Margarita */}
            <div className="bg-blue-900 rounded-[2.5rem] p-6 shadow-xl border border-blue-800 text-white group transition-all hover:border-blue-400">
              <div className="w-full h-44 rounded-3xl overflow-hidden mb-6 bg-slate-900 border border-blue-700/50">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58058.456!2d-107.38!3d24.78!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86bbd0f85f3e4c4f%3A0x90f6e9f16d566c5a!2sColonia%20Margarita%2C%20Culiac%C3%A1n%20Rosales%2C%20Sin.!5e0!3m2!1ses-419!2smx!4v1714578400000!5m2!1ses-419!2smx" 
                  width="100%" height="100%" style={{border:0}} allowFullScreen="" loading="lazy">
                </iframe>
              </div>
              <div className="flex items-center gap-2 mb-1"><MapPin size={16} className="text-orange-400" /><h4 className="text-xl font-black uppercase italic tracking-tighter">Super & Six</h4></div>
              <p className="text-blue-100 text-sm font-bold italic opacity-70">Colonia Margarita, Culiacán.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Galería */}
      <section id="galeria" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black uppercase italic mb-16 italic tracking-tighter underline decoration-blue-500 underline-offset-8">Nuestra <span className="text-blue-500">Experiencia Visual</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galeria.map(img => (
              <div key={img.id} className="group relative h-80 rounded-[40px] overflow-hidden cursor-pointer" onClick={() => setSelectedImage(img.url)}>
                <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={img.titulo} />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 to-transparent flex flex-col justify-end p-8 text-left">
                  <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{img.tipo}</span>
                  <h4 className="text-xl font-bold italic">{img.titulo}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vacantes */}
      <section id="vacantes" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-black mb-16 uppercase italic italic tracking-tighter">Bolsa de <span className="text-blue-600">Trabajo</span></h2>
          <div className="grid md:grid-cols-3 gap-8">
            {vacantes.map(v => (
              <div key={v.id} className={`p-10 rounded-[45px] shadow-2xl border-l-8 flex flex-col justify-between text-left transition-all hover:-translate-y-2
                ${v.color === 'blue' ? 'border-blue-600' : v.color === 'teal' ? 'border-teal-500' : 'border-slate-800'}`}>
                <div><h4 className="text-xl font-black uppercase italic tracking-tighter mb-2">{v.titulo}</h4><p className="font-bold text-slate-500 text-[10px] mb-6 uppercase tracking-widest">{v.categoria}</p></div>
                <div className="space-y-2 mb-8 text-sm font-bold text-slate-600 italic">
                  <p className="flex items-center gap-2"><Phone size={14} className="text-blue-600"/> {v.sueldo}</p>
                  <p className="flex items-center gap-2"><ChevronRight size={14} className="text-blue-600"/> {v.horario}</p>
                </div>
                <button className={`w-full py-4 rounded-2xl font-black text-white uppercase text-xs tracking-widest ${v.color === 'blue' ? 'bg-blue-600' : v.color === 'teal' ? 'bg-teal-600' : 'bg-slate-900'}`}>Postularse</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-24">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="bg-white p-2 rounded-xl"><Droplets className="text-blue-600" /></div>
              <span className="text-3xl font-black italic italic tracking-tighter uppercase">Water<span className="text-blue-500">Chon</span></span>
            </div>
            <p className="text-slate-500 italic font-medium">Pureza garantizada en cada gota, servicio garantizado en cada sucursal.</p>
          </div>
          <div className="text-center md:text-left">
            <h5 className="text-blue-500 font-black uppercase italic tracking-widest mb-8 text-xs">Menú</h5>
            <ul className="space-y-4 font-bold text-slate-400 text-sm">
              <li>Servicios</li><li>Pedidos</li><li>Sucursales</li><li>Galería</li><li>Vacantes</li>
            </ul>
          </div>
          <div className="text-center md:text-left">
            <h5 className="text-blue-500 font-black uppercase italic tracking-widest mb-8 text-xs">Contáctanos</h5>
            <ul className="space-y-4 font-bold text-slate-400 text-sm">
              <li className="flex items-center justify-center md:justify-start gap-3"><Phone size={16} className="text-blue-500"/> (667) 123-4567</li>
              <li className="flex items-center justify-center md:justify-start gap-3"><Mail size={16} className="text-blue-500"/> contacto@waterchon.mx</li>
            </ul>
          </div>
        </div>
        <div className="mt-16 text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]">
          © 2026 Grupo WaterChon S.A. de C.V. Culiacán, Sinaloa.
        </div>
      </footer>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-10 right-10 text-white"><X size={48}/></button>
          <img src={selectedImage} className="max-w-full max-h-[85vh] rounded-3xl border-4 border-white/10 shadow-2xl" alt="Preview" />
        </div>
      )}
    </>
  );

  // --- VISTA: PANEL DE ADMINISTRACIÓN (Simulación de Subdominio) ---
  const AdminPanel = () => {
    if (!user || user.isAnonymous) {
      return (
        <section className="h-screen flex items-center justify-center bg-slate-100 p-4">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-100">
            <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white"><Lock size={32} /></div>
            <h2 className="text-3xl font-black uppercase text-center mb-8 italic tracking-tighter">Acceso <span className="text-blue-600">Admin</span></h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 pl-2 tracking-widest">Email</label>
                <input name="email" type="email" placeholder="admin@waterchon.mx" className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none font-bold" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 pl-2 tracking-widest">Password</label>
                <input name="password" type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none font-bold" required />
              </div>
              <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl italic tracking-widest hover:bg-blue-700 transition-all">INGRESAR AL PANEL</button>
              <button type="button" onClick={() => setSiteMode('landing')} className="w-full text-slate-400 font-black text-xs uppercase mt-4">Volver al sitio público</button>
            </form>
          </div>
        </section>
      );
    }

    return (
      <section className="bg-gray-100 min-h-screen pb-20">
        <nav className="bg-slate-900 text-white px-6 h-20 flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-3"><LayoutDashboard className="text-blue-400" /><span className="font-black italic uppercase italic tracking-tighter text-xl text-blue-400">Panel.WaterChon.mx</span></div>
          <div className="flex gap-4">
            <button onClick={() => setSiteMode('landing')} className="bg-white/10 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20">Ver Landing</button>
            <button onClick={() => signOut(auth)} className="bg-red-500/20 text-red-400 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Cerrar Sesión</button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 mt-12 grid lg:grid-cols-2 gap-12">
          {/* Subir Fotos */}
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-blue-50">
              <h3 className="text-xl font-black mb-8 uppercase italic flex items-center gap-3"><Camera className="text-blue-600"/> Gestionar Galería</h3>
              <form onSubmit={handlePhotoUpload} className="space-y-4">
                <input name="titulo" placeholder="Título de la foto" required className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none font-bold" />
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 pl-2 uppercase tracking-widest">Archivo (Máx 5MB)</label>
                  <input name="photo_file" type="file" accept="image/*" required className="w-full p-4 bg-slate-50 border-2 border-dashed rounded-2xl font-bold text-xs" />
                </div>
                <select name="tipo" className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-bold outline-none">
                  <option>Planta</option><option>Eventos</option><option>Sucursal</option><option>Calidad</option>
                </select>
                <button disabled={uploading} className={`w-full text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 italic tracking-widest ${uploading ? 'bg-slate-400' : 'bg-slate-900 shadow-xl hover:bg-slate-800 transition-all'}`}>
                  {uploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />} {uploading ? 'SUBIENDO...' : 'SUBIR A LA WEB'}
                </button>
              </form>
            </div>
            <div className="bg-slate-900 p-8 rounded-[3rem] shadow-xl text-white">
              <h3 className="font-black mb-6 uppercase italic text-xs tracking-[0.3em] text-blue-500">Fotos Activas en la Nube</h3>
              <div className="grid grid-cols-4 gap-4">
                {galeria.map(g => (
                  <div key={g.id} className="relative group aspect-square rounded-xl overflow-hidden border border-white/10">
                    <img src={g.url} className="w-full h-full object-cover" />
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'galeria', g.id))} className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"><Trash2 size={24}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gestión Vacantes */}
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-blue-50">
              <h3 className="text-xl font-black mb-8 uppercase italic flex items-center gap-3"><PlusCircle className="text-blue-600"/> Publicar Vacante</h3>
              <form onSubmit={handleVacanteAdd} className="space-y-4">
                <input name="titulo" placeholder="Puesto" required className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none font-bold" />
                <div className="grid grid-cols-2 gap-4">
                  <input name="sueldo" placeholder="Sueldo (Semanal)" required className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none font-bold" />
                  <input name="horario" placeholder="Horario" required className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select name="color" className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-bold outline-none"><option value="blue">Azul</option><option value="teal">Aqua</option><option value="slate">Negro</option></select>
                  <input name="categoria" placeholder="Categoría (ej. Producción)" className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none font-bold" />
                </div>
                <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl italic tracking-widest hover:bg-blue-700 transition-all">GUARDAR VACANTE</button>
              </form>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
              <h3 className="font-black mb-6 uppercase italic text-xs tracking-[0.3em] text-blue-600">Bolsa Activa</h3>
              <div className="space-y-3">
                {vacantes.map(v => (
                  <div key={v.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border-l-4 border-blue-600">
                    <span className="font-black text-slate-800 uppercase text-[10px] tracking-widest italic">{v.titulo}</span>
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vacantes', v.id))} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen">
      {siteMode === 'landing' ? <LandingView /> : <AdminPanel />}
    </div>
  );
}