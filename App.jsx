import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Lock, LogOut, Droplets, 
  Briefcase, Camera, X, Menu, Phone, Mail, 
  ChevronRight, LayoutDashboard, Eye, 
  Truck, Wallet, FlaskConical, IceCream, PlusCircle, MinusCircle,
  Upload, Image as ImageIcon, Loader2, Car, Store, CheckCircle,
  MapPin, Settings, Building2, ShieldCheck, Tag, DollarSign,
  Info
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, 
  signOut, signInAnonymously, signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, deleteDoc, 
  doc, onSnapshot, query, updateDoc
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
  const [siteMode, setSiteMode] = useState('landing'); 
  const [vacantes, setVacantes] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [productos, setProductos] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const [order, setOrder] = useState({});
  const [clickCount, setClickCount] = useState(0);

  // Auth Listener
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (e) { console.error("Auth error:", e); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Data Listeners
  useEffect(() => {
    if (!user) return;
    const vRef = collection(db, 'artifacts', appId, 'public', 'data', 'vacantes');
    const gRef = collection(db, 'artifacts', appId, 'public', 'data', 'galeria');
    const pRef = collection(db, 'artifacts', appId, 'public', 'data', 'productos');

    const unsubV = onSnapshot(vRef, (snap) => setVacantes(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubG = onSnapshot(gRef, (snap) => setGaleria(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubP = onSnapshot(pRef, (snap) => setProductos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubV(); unsubG(); unsubP(); };
  }, [user]);

  // Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, e.target.email.value, e.target.password.value);
    } catch (error) { alert("Acceso denegado."); }
  };

  const adjustQty = (productId, delta) => {
    setOrder(prev => ({ ...prev, [productId]: Math.max(0, (prev[productId] || 0) + delta) }));
  };

  const handleSendOrder = (e) => {
    e.preventDefault();
    const { order_name, order_phone, order_address } = e.target;
    const itemsOrdered = productos.filter(p => order[p.id] > 0).map(p => `${order[p.id]}x ${p.nombre}`);
    if (itemsOrdered.length === 0) return alert("Selecciona al menos un producto.");
    const total = productos.reduce((acc, p) => acc + ((order[p.id] || 0) * (parseFloat(p.precio) || 0)), 0);
    const msg = `Pedido WaterChon:%0A- Cliente: ${order_name.value}%0A- Tel: ${order_phone.value}%0A- Dir: ${order_address.value}%0A- Pedido: ${itemsOrdered.join(', ')}%0A- Total: $${total.toFixed(2)}`;
    window.open(`https://wa.me/526671234567?text=${msg}`, '_blank');
  };

  const handleFileUpload = async (file, folder) => {
    const storagePath = `artifacts/${appId}/public/${folder}/${Date.now()}_${file.name}`;
    const fileRef = ref(storage, storagePath);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  const handleProductAdd = async (e) => {
    e.preventDefault();
    const file = e.target.prod_img.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await handleFileUpload(file, 'products');
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'productos'), {
        nombre: e.target.nombre.value, precio: e.target.precio.value, categoria: e.target.categoria.value, imagen: url, createdAt: Date.now()
      });
      e.target.reset();
    } catch (err) { console.error(err); } finally { setUploading(false); }
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    const file = e.target.photo_file.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await handleFileUpload(file, 'gallery');
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'galeria'), {
        titulo: e.target.titulo.value, url, tipo: e.target.tipo.value, createdAt: Date.now()
      });
      e.target.reset();
    } catch (err) { console.error(err); } finally { setUploading(false); }
  };

  const handleVacanteAdd = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'vacantes'), {
      titulo: e.target.titulo.value, sueldo: e.target.sueldo.value, horario: e.target.horario.value,
      color: e.target.color.value, categoria: e.target.categoria.value, createdAt: Date.now()
    });
    e.target.reset();
  };

  const handleDelete = async (col, id) => {
    if (!user || user.isAnonymous) return;
    if (window.confirm("¿Seguro de eliminar?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
  };

  const secretTrigger = () => {
    setClickCount(prev => {
      const next = prev + 1;
      if (next === 5) { setSiteMode('admin-panel'); return 0; }
      setTimeout(() => setClickCount(0), 3000);
      return next;
    });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-blue-900"><Droplets className="text-white animate-bounce w-12 h-12" /></div>;

  // --- UI: LANDING VIEW ---
  const LandingView = () => (
    <>
      <nav className="fixed w-full z-50 bg-blue-900 shadow-2xl text-white">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-lg"><Droplets className="text-blue-600 w-6 h-6" /></div>
            <span className="text-xl font-black italic uppercase tracking-tighter">Water<span className="text-blue-400">Chon</span></span>
          </div>
          <div className="hidden lg:flex gap-8 font-bold text-xs uppercase italic">
            <a href="#aliados" className="hover:text-blue-400 transition-colors">Aliados</a>
            <a href="#pedidos" className="hover:text-blue-400 transition-colors">Pedidos</a>
            <a href="#sucursales" className="hover:text-blue-400 transition-colors">Sucursales</a>
            <a href="#galeria" className="hover:text-blue-400 transition-colors">Galería</a>
            <a href="#vacantes" className="hover:text-white transition-colors">Vacantes</a>
          </div>
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2"><Menu /></button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white pt-40 pb-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <span className="bg-blue-50 text-blue-700 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em] border border-blue-100 shadow-sm">Culiacán, Sinaloa</span>
            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] text-slate-900 tracking-tighter uppercase italic italic">Calidad <br/><span className="text-blue-600">Insuperable</span> <br/>en cada gota.</h1>
            <p className="text-slate-500 text-xl italic max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">Sabor único y procesos de purificación avanzados para el bienestar de tu familia.</p>
            <a href="#pedidos" className="inline-block bg-blue-600 text-white px-12 py-5 rounded-3xl font-black text-xl shadow-2xl hover:bg-blue-700 transition-all uppercase italic">Pedir a domicilio</a>
          </div>
          <div className="flex-1 relative group">
            <div className="relative rounded-[60px] overflow-hidden shadow-2xl border-[15px] border-white">
              <img src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=1000" className="w-full h-[550px] object-cover" alt="WaterChon Hero" />
              <div className="absolute bottom-10 left-10 right-10 bg-blue-600/90 text-white p-8 rounded-[40px] backdrop-blur-md shadow-2xl transform group-hover:scale-105 transition-transform duration-500">
                <p className="font-black italic uppercase tracking-tighter text-xl leading-none">Sabor que refresca, confianza que perdura.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Aliados / Logos */}
      <section id="aliados" className="py-20 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-center text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-12 italic">Marcas que confían en nosotros</h2>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
            {['CONSTRUCTORA', 'RETAIL MX', 'INDUSTRIA PRO', 'LOGÍSTICA CLN', 'AGRÍCOLA S.A.', 'SERVICIOS PRO'].map(logo => (
              <div key={logo} className="font-black italic text-2xl tracking-tighter text-slate-400 uppercase">{logo}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Productos / Pedidos */}
      <section id="pedidos" className="py-32 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black mb-4 uppercase italic tracking-tighter text-slate-900">Nuestros <span className="text-blue-600">Productos</span></h2>
            <div className="w-20 h-2 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="bg-white rounded-[4rem] shadow-3xl overflow-hidden border border-slate-100 p-10 md:p-20">
            {productos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
                {productos.map(p => (
                  <div key={p.id} className="bg-slate-50 border-2 border-slate-100 rounded-[45px] p-6 flex flex-col items-center group hover:border-blue-200 transition-all">
                    <img src={p.imagen} className="w-full h-40 object-cover rounded-3xl mb-6 shadow-md" alt={p.nombre} />
                    <h4 className="text-xl font-black text-slate-900 uppercase italic mb-1">{p.nombre}</h4>
                    <p className="text-slate-500 font-black mb-6 italic text-lg">${parseFloat(p.precio).toFixed(2)}</p>
                    <div className="flex items-center gap-6 bg-white px-6 py-3 rounded-2xl shadow-sm">
                      <button onClick={() => adjustQty(p.id, -1)} className="text-slate-300 hover:text-blue-600"><MinusCircle size={28}/></button>
                      <span className="text-3xl font-black w-8 text-center text-slate-900">{order[p.id] || 0}</span>
                      <button onClick={() => adjustQty(p.id, 1)} className="text-slate-300 hover:text-blue-600"><PlusCircle size={28}/></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-slate-50 rounded-[3rem] mb-20 border-2 border-dashed border-slate-200">
                <Tag className="mx-auto text-slate-300 w-16 h-16 mb-4" />
                <p className="font-black italic text-slate-400 uppercase tracking-widest">Inventario en actualización</p>
                <p className="text-slate-400 font-bold italic text-sm mt-2">Próximamente podrás ver nuestros productos aquí.</p>
              </div>
            )}

            <form onSubmit={handleSendOrder} className="max-w-4xl mx-auto space-y-8 bg-blue-600 p-10 md:p-16 rounded-[4rem] text-white shadow-2xl">
              <div className="grid md:grid-cols-2 gap-8">
                <input name="order_name" placeholder="Tu Nombre" className="w-full p-5 bg-white/10 border-2 border-white/10 rounded-3xl outline-none font-bold placeholder:text-blue-200" required />
                <input name="order_phone" type="tel" placeholder="Tu WhatsApp" className="w-full p-5 bg-white/10 border-2 border-white/10 rounded-3xl outline-none font-bold placeholder:text-blue-200" required />
              </div>
              <input name="order_address" placeholder="Dirección de entrega completa" className="w-full p-5 bg-white/10 border-2 border-white/10 rounded-3xl outline-none font-bold placeholder:text-blue-200" required />
              <button className="w-full bg-white text-blue-600 py-6 rounded-3xl font-black text-2xl shadow-xl italic uppercase hover:bg-blue-50 transition-colors">Confirmar Pedido</button>
            </form>
          </div>
        </div>
      </section>

      {/* Sucursales Detalladas */}
      <section id="sucursales" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black mb-20 uppercase italic tracking-tighter text-slate-900">Puntos <span className="text-blue-600">WaterChon</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 text-left">
            {[
              { title: 'Planta Norte', loc: 'Santa Fe', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58045.5494!2d-107.4338!3d24.7951' },
              { title: 'Planta Sur', loc: 'Blvd. Ganaderos', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58055.4419!2d-107.3994!3d24.8101' },
              { title: 'Planta Poniente', loc: 'Aeropuerto', map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58042.8!2d-107.45!3d24.82' },
              { title: 'CarWashChon', loc: 'Tres Ríos', icon: <Car />, map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58042.345!2d-107.42!3d24.83' },
              { title: 'Súper Margarita', loc: 'Col. Margarita', icon: <Store />, map: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58058.456!2d-107.38!3d24.78' }
            ].map((suc, i) => (
              <div key={i} className="bg-blue-900 rounded-[3.5rem] p-8 shadow-2xl border border-blue-800 text-white group hover:border-blue-400 transition-all duration-500">
                <div className="w-full h-52 rounded-[2.5rem] overflow-hidden mb-8 border border-blue-700/50 bg-slate-900 shadow-inner">
                   <iframe src={suc.map} width="100%" height="100%" style={{border:0, filter: 'invert(90%) hue-rotate(180deg)'}} allowFullScreen="" loading="lazy"></iframe>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <MapPin size={24} className="text-blue-300" />
                  <h4 className="text-2xl font-black uppercase italic tracking-tighter">{suc.title}</h4>
                </div>
                <p className="text-blue-100 text-sm font-bold italic opacity-60 ml-9">{suc.loc}, Culiacán.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galería */}
      <section id="galeria" className="py-32 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black uppercase italic mb-20">Nuestra <span className="text-blue-500">Galería</span></h2>
          {galeria.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {galeria.map(img => (
                <div key={img.id} className="group relative h-[450px] rounded-[50px] overflow-hidden cursor-pointer" onClick={() => setSelectedImage(img.url)}>
                  <img src={img.url} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" alt={img.titulo} />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/95 via-transparent to-transparent flex flex-col justify-end p-12 text-left opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-blue-400 text-xs font-black uppercase tracking-[0.4em] mb-4">{img.tipo}</span>
                    <h4 className="text-3xl font-black italic uppercase leading-tight tracking-tighter">{img.titulo}</h4>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-32 bg-white/5 rounded-[4rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center">
              <Camera className="text-white/20 w-16 h-16 mb-4" />
              <p className="font-black italic text-white/20 uppercase tracking-widest text-lg">Galería en proceso</p>
              <p className="text-white/10 font-bold italic mt-2">Próximamente fotos de nuestras plantas y procesos.</p>
            </div>
          )}
        </div>
      </section>

      {/* Vacantes */}
      <section id="vacantes" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-5xl font-black mb-20 uppercase italic tracking-tighter text-slate-900">Bolsa de <span className="text-blue-600">Trabajo</span></h2>
          {vacantes.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-10">
              {vacantes.map(v => (
                <div key={v.id} className={`p-12 rounded-[55px] shadow-3xl border-l-[15px] flex flex-col justify-between text-left transition-all hover:-translate-y-4
                  ${v.color === 'blue' ? 'border-blue-600' : v.color === 'teal' ? 'border-teal-500' : 'border-slate-800'}`}>
                  <div>
                    <h4 className="text-3xl font-black uppercase italic tracking-tighter mb-4 leading-none">{v.titulo}</h4>
                    <p className="font-bold text-slate-400 text-xs mb-10 uppercase tracking-[0.3em]">{v.categoria}</p>
                  </div>
                  <div className="space-y-4 mb-12 text-lg font-bold text-slate-600 italic">
                    <p className="flex items-center gap-4"><Phone size={20} className="text-blue-600"/> {v.sueldo}</p>
                    <p className="flex items-center gap-4"><ChevronRight size={20} className="text-blue-600"/> {v.horario}</p>
                  </div>
                  <button className={`w-full py-6 rounded-3xl font-black text-white uppercase text-sm tracking-[0.3em] shadow-2xl ${v.color === 'blue' ? 'bg-blue-600' : v.color === 'teal' ? 'bg-teal-600' : 'bg-slate-900'}`}>Postularse</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 max-w-2xl mx-auto flex flex-col items-center justify-center">
              <Briefcase className="text-slate-300 w-16 h-16 mb-4" />
              <p className="font-black italic text-slate-400 uppercase tracking-widest text-lg">Sin vacantes activas</p>
              <p className="text-slate-400 font-bold italic text-sm mt-2">Por el momento no tenemos posiciones abiertas, ¡vuelve pronto!</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-24">
            <div className="space-y-8 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 cursor-pointer" onClick={secretTrigger}>
                <div className="bg-white p-3 rounded-2xl"><Droplets className="text-blue-600 w-8 h-8" /></div>
                <span className="text-4xl font-black italic tracking-tighter uppercase italic">Water<span className="text-blue-500">Chon</span></span>
              </div>
              <p className="text-slate-500 italic font-bold text-lg max-w-sm mx-auto md:mx-0">Pureza total y servicios integrales para las familias de Culiacán.</p>
            </div>
            
            <div className="text-center md:text-left">
              <h5 className="text-blue-500 font-black uppercase italic tracking-[0.4em] mb-10 text-xs">Información</h5>
              <ul className="space-y-6 font-black text-slate-400 text-sm uppercase italic tracking-[0.2em]">
                <li className="hover:text-white transition-colors cursor-pointer">Unidades de Servicio</li>
                <li className="hover:text-white transition-colors cursor-pointer">Pedidos a domicilio</li>
                <li className="hover:text-white transition-colors cursor-pointer">Ubicaciones GPS</li>
                <li className="hover:text-white transition-colors cursor-pointer">Galería Visual</li>
              </ul>
            </div>

            <div className="text-center md:text-left">
              <h5 className="text-blue-500 font-black uppercase italic tracking-[0.4em] mb-10 text-xs">Atención Directa</h5>
              <ul className="space-y-8 font-black text-slate-400 text-lg italic tracking-tight">
                <li className="flex items-center justify-center md:justify-start gap-5 group cursor-pointer hover:text-white transition-all">
                  <Phone size={24} className="text-blue-500 group-hover:rotate-12 transition-transform"/> (667) 123-4567
                </li>
                <li className="flex items-center justify-center md:justify-start gap-5 group cursor-pointer hover:text-white transition-all">
                  <Mail size={24} className="text-blue-500 group-hover:-translate-y-1 transition-transform"/> contacto@waterchon.mx
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 text-center text-slate-800 text-[10px] font-black uppercase tracking-[0.5em]">
             © 2026 GRUPO WATERCHON S.A. DE C.V. • CULIACÁN, SINALOA.
          </div>
        </div>
      </footer>

      {selectedImage && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-6" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-12 right-12 text-white hover:text-blue-400 transition-colors bg-white/5 p-4 rounded-full"><X size={48}/></button>
          <img src={selectedImage} className="max-w-full max-h-[90vh] rounded-[60px] border-[12px] border-white/5 shadow-2xl" alt="Preview" />
        </div>
      )}
    </>
  );

  // --- UI: ADMIN PANEL ---
  const AdminPanel = () => {
    if (!user || user.isAnonymous) {
      return (
        <section className="h-screen flex items-center justify-center bg-slate-100 p-6">
          <div className="bg-white p-16 rounded-[4rem] shadow-3xl w-full max-w-lg border border-slate-200 text-center">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-white shadow-2xl"><Lock size={40} /></div>
            <h2 className="text-4xl font-black uppercase mb-12 italic tracking-tighter">Acceso <span className="text-blue-600 font-black">Admin</span></h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <input name="email" type="email" placeholder="Usuario" className="w-full p-6 bg-slate-50 border-2 rounded-3xl outline-none font-black" required />
              <input name="password" type="password" placeholder="Clave" className="w-full p-6 bg-slate-50 border-2 rounded-3xl outline-none font-black" required />
              <button className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl shadow-2xl italic tracking-widest uppercase">Autenticar</button>
              <button type="button" onClick={() => setSiteMode('landing')} className="w-full text-slate-400 font-black text-xs uppercase mt-4">Salir</button>
            </form>
          </div>
        </section>
      );
    }

    return (
      <section className="bg-slate-50 min-h-screen pb-32">
        <nav className="bg-slate-950 text-white px-10 h-24 flex justify-between items-center shadow-3xl">
          <div className="flex items-center gap-5"><LayoutDashboard className="text-blue-500" size={32} /><span className="font-black italic uppercase tracking-tighter text-2xl text-blue-500">Gestión.Pro</span></div>
          <div className="flex gap-6">
            <button onClick={() => setSiteMode('landing')} className="bg-white/5 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/5 hover:bg-white/10 italic">Ver Landing</button>
            <button onClick={() => {signOut(auth); setSiteMode('landing');}} className="bg-red-500/10 text-red-400 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-500/20 hover:bg-red-500 italic transition-all">Cerrar Sesión</button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 mt-16 space-y-16">
          {/* Productos */}
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="bg-white p-16 rounded-[4.5rem] shadow-3xl border border-blue-50">
              <h3 className="text-3xl font-black mb-10 uppercase italic flex items-center gap-4 italic tracking-tighter"><Tag className="text-blue-600" /> Nuevo Producto</h3>
              <form onSubmit={handleProductAdd} className="space-y-6">
                <input name="nombre" placeholder="Nombre (ej. Garrafón 20L)" required className="w-full p-5 bg-slate-50 border-2 rounded-3xl outline-none font-black" />
                <div className="grid grid-cols-2 gap-6">
                  <input name="precio" type="number" step="0.01" placeholder="Precio" required className="w-full p-5 bg-slate-50 border-2 rounded-3xl outline-none font-black" />
                  <input name="categoria" placeholder="Categoría" required className="w-full p-5 bg-slate-50 border-2 rounded-3xl outline-none font-black" />
                </div>
                <input name="prod_img" type="file" accept="image/*" required className="w-full p-5 bg-slate-50 border-2 border-dashed rounded-3xl font-black text-xs" />
                <button disabled={uploading} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:bg-blue-700 italic uppercase">Registrar Producto</button>
              </form>
            </div>
            <div className="bg-white p-12 rounded-[4.5rem] shadow-3xl border border-slate-100 h-[600px] overflow-y-auto">
               <h3 className="text-xl font-black mb-8 uppercase italic text-blue-600 italic">Inventario Activo</h3>
               <div className="grid gap-4">
                 {productos.map(p => (
                   <div key={p.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-200">
                     <img src={p.imagen} className="w-16 h-16 rounded-2xl object-cover" />
                     <div className="flex-1"><p className="font-black text-slate-900 uppercase text-xs">{p.nombre}</p><p className="font-bold text-blue-600">${p.precio}</p></div>
                     <button onClick={() => handleDelete('productos', p.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={24}/></button>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Galería y Vacantes */}
          <div className="grid lg:grid-cols-2 gap-16">
            <div className="bg-slate-900 p-16 rounded-[4.5rem] shadow-3xl text-white">
              <h3 className="text-3xl font-black mb-10 uppercase italic flex items-center gap-4 italic tracking-tighter"><Camera className="text-blue-500" /> Nueva Foto</h3>
              <form onSubmit={handlePhotoUpload} className="space-y-6">
                <input name="titulo" placeholder="Título" required className="w-full p-5 bg-white/10 border-2 border-white/10 rounded-3xl outline-none font-black text-white" />
                <input name="photo_file" type="file" accept="image/*" required className="w-full p-5 bg-white/10 border-2 border-dashed border-white/20 rounded-3xl font-black text-xs" />
                <select name="tipo" className="w-full p-5 bg-white/10 border-2 border-white/10 rounded-3xl font-black outline-none"><option className="bg-slate-900">Planta</option><option className="bg-slate-900">Eventos</option><option className="bg-slate-900">Sucursal</option></select>
                <button disabled={uploading} className="w-full bg-blue-600 py-6 rounded-3xl font-black text-xl shadow-2xl hover:bg-blue-700 italic uppercase">Publicar Foto</button>
              </form>
            </div>
            <div className="bg-white p-16 rounded-[4.5rem] shadow-3xl border border-blue-50">
              <h3 className="text-3xl font-black mb-10 uppercase italic flex items-center gap-4 italic tracking-tighter"><PlusCircle className="text-blue-600" /> Nueva Vacante</h3>
              <form onSubmit={handleVacanteAdd} className="space-y-6">
                <input name="titulo" placeholder="Puesto" required className="w-full p-5 bg-slate-50 border-2 rounded-3xl outline-none font-black" />
                <div className="grid grid-cols-2 gap-6"><input name="sueldo" placeholder="Sueldo" required className="w-full p-5 bg-slate-50 border-2 rounded-3xl outline-none font-black" /><input name="horario" placeholder="Horario" required className="w-full p-5 bg-slate-50 border-2 rounded-3xl outline-none font-black" /></div>
                <button className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl italic uppercase">Publicar Empleo</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen font-sans bg-white selection:bg-blue-100 selection:text-blue-900">
      {siteMode === 'landing' ? <LandingView /> : <AdminPanel />}
    </div>
  );
}