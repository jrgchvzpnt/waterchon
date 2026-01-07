import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Lock, LogOut, Droplets, 
  Briefcase, Camera, X, Menu, Phone, Mail, 
  ChevronRight, LayoutDashboard, Eye, 
  Truck, Wallet, FlaskConical, IceCream, PlusCircle, MinusCircle
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, 
  signOut, signInAnonymously 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, deleteDoc, 
  doc, onSnapshot, query, orderBy 
} from 'firebase/firestore';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = JSON.parse(window.__firebase_config || '{}');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'waterchon-pro-v2';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('public'); // 'public' | 'login' | 'admin'
  const [vacantes, setVacantes] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Estado de Pedidos
  const [order, setOrder] = useState({ normal: 0, alcalina: 0, hielo: 0 });

  // Autenticación (Regla 3)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
          if (currentUser && !currentUser.isAnonymous) setView('admin');
        });
        // Si no hay token previo, entramos como anónimos para lectura
        if (!auth.currentUser) await signInAnonymously(auth);
        return () => unsubscribe();
      } catch (e) { console.error(e); }
    };
    initAuth();
  }, []);

  // Firestore Listeners (Regla 1 y 2)
  useEffect(() => {
    if (!user) return;

    const vRef = collection(db, 'artifacts', appId, 'public', 'data', 'vacantes');
    const gRef = collection(db, 'artifacts', appId, 'public', 'data', 'galeria');

    const unsubV = onSnapshot(vRef, (snap) => {
      setVacantes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error(err));

    const unsubG = onSnapshot(gRef, (snap) => {
      setGaleria(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error(err));

    return () => { unsubV(); unsubG(); };
  }, [user]);

  // Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) { alert("Credenciales incorrectas"); }
  };

  const adjustQty = (type, delta) => {
    setOrder(prev => {
      const newVal = Math.max(0, Math.min(10, prev[type] + delta));
      return { ...prev, [type]: newVal };
    });
  };

  // Función para enviar pedido por WhatsApp
  const handleSendOrder = (e) => {
    e.preventDefault();
    const name = e.target.order_name.value;
    const phone = e.target.order_phone.value;
    const address = e.target.order_address.value;

    if (order.normal === 0 && order.alcalina === 0 && order.hielo === 0) {
      alert("Por favor selecciona al menos un producto.");
      return;
    }

    const items = [];
    if (order.normal > 0) items.push(`${order.normal} Garrafón(es) Agua Normal`);
    if (order.alcalina > 0) items.push(`${order.alcalina} Garrafón(es) Agua Alcalina`);
    if (order.hielo > 0) items.push(`${order.hielo} Bolsa(s) de Hielo`);

    const msg = `¡Hola WaterChon! Quisiera realizar un pedido:%0A%0A*Datos del Cliente:*%0A- Nombre: ${name}%0A- WhatsApp: ${phone}%0A- Dirección: ${address}%0A%0A*Pedido:*%0A- ${items.join('%0A- ')}`;
    
    window.open(`https://wa.me/526671234567?text=${msg}`, '_blank');
  };

  const handleAdminAction = async (type, e) => {
    e.preventDefault();
    const col = type === 'vacante' ? 'vacantes' : 'galeria';
    const data = type === 'vacante' ? {
      titulo: e.target.titulo.value,
      sueldo: e.target.sueldo.value,
      horario: e.target.horario.value,
      color: e.target.color.value, // blue, teal, slate
      categoria: e.target.categoria.value
    } : {
      titulo: e.target.titulo.value,
      url: e.target.url.value,
      tipo: e.target.tipo.value
    };

    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', col), data);
    e.target.reset();
  };

  const handleDelete = async (col, id) => {
    if (window.confirm("¿Eliminar este elemento?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-blue-900">
      <Droplets className="text-white animate-bounce w-12 h-12" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      {/* Navbar Profesional */}
      <nav className="fixed w-full z-50 bg-blue-900 shadow-2xl text-white">
        <div className="max-w-7xl mx-auto px-4 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <Droplets className="text-blue-600 w-6 h-6" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl font-black italic uppercase tracking-tighter">Water<span className="text-blue-400">Chon</span></span>
              <span className="text-[8px] text-blue-300 font-bold uppercase tracking-widest">Pureza Total</span>
            </div>
          </div>

          <div className="hidden lg:flex gap-8 font-bold text-sm uppercase italic">
            <button onClick={() => setView('public')} className="hover:text-blue-400 transition-colors">Inicio</button>
            <a href="#pedidos" className="hover:text-blue-400 transition-colors">Pedidos</a>
            <a href="#galeria" className="hover:text-blue-400 transition-colors">Galería</a>
            <a href="#sucursales" className="hover:text-blue-400 transition-colors">Sucursales</a>
            <a href="#vacantes" className="hover:text-white transition-colors">Vacantes</a>
          </div>

          <div className="flex items-center gap-4">
            {user && !user.isAnonymous ? (
              <button onClick={() => setView('admin')} className="bg-blue-600 p-2 rounded-lg hover:bg-blue-500"><LayoutDashboard size={20} /></button>
            ) : (
              <button onClick={() => setView('login')} className="bg-slate-800 p-2 rounded-lg hover:bg-slate-700"><Lock size={20} /></button>
            )}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2"><Menu /></button>
          </div>
        </div>
      </nav>

      {/* Menú Móvil */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-blue-900 text-white p-8 flex flex-col gap-6 lg:hidden">
          <button onClick={() => setIsMenuOpen(false)} className="self-end"><X size={32}/></button>
          <div className="flex flex-col gap-6 text-2xl font-black uppercase italic">
            <button onClick={() => {setView('public'); setIsMenuOpen(false)}}>Inicio</button>
            <a href="#pedidos" onClick={() => setIsMenuOpen(false)}>Pedidos</a>
            <a href="#galeria" onClick={() => setIsMenuOpen(false)}>Galería</a>
            <a href="#vacantes" onClick={() => setIsMenuOpen(false)}>Vacantes</a>
          </div>
        </div>
      )}

      {/* Vistas */}
      <main className="pt-20">
        {view === 'public' && (
          <>
            {/* Hero */}
            <section className="bg-white py-20 px-4 overflow-hidden">
              <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
                <div className="flex-1 space-y-6 text-center lg:text-left">
                  <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-blue-100">Sabor y Pureza Superior</span>
                  <h1 className="text-5xl md:text-7xl font-black leading-tight text-slate-900 tracking-tight">
                    Agua <span className="text-blue-600">Alcalina</span> <br/>y Normal.
                  </h1>
                  <p className="text-slate-500 text-lg max-w-lg mx-auto lg:mx-0 leading-relaxed italic">
                    Garrafones profesionales WaterChon con el balance perfecto de minerales para tu salud.
                  </p>
                  <a href="#pedidos" className="inline-block bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-2xl hover:bg-blue-700 transition-all transform hover:-translate-y-1">
                    PEDIR AHORA
                  </a>
                </div>
                <div className="flex-1 relative">
                  <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=1000" 
                    className="relative z-10 rounded-[50px] shadow-2xl border-[12px] border-white w-full h-[500px] object-cover animate-float"
                    alt="WaterChon Hero"
                  />
                </div>
              </div>
            </section>

            {/* Galería Pública */}
            <section id="galeria" className="py-24 bg-slate-900 text-white">
              <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Nuestra <span className="text-blue-500 font-black">Experiencia Visual</span></h2>
                  <p className="text-slate-400 mt-2">Fotos reales de nuestra planta y servicios en Culiacán.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {galeria.map(img => (
                    <div 
                      key={img.id} 
                      className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer"
                      onClick={() => setSelectedImage(img.url)}
                    >
                      <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={img.titulo} />
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 to-transparent flex flex-col justify-end p-6 opacity-80 group-hover:opacity-100 transition-opacity">
                        <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">{img.tipo}</span>
                        <h4 className="text-xl font-bold">{img.titulo}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Lightbox */}
            {selectedImage && (
              <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
                <button className="absolute top-8 right-8 text-white"><X size={40}/></button>
                <img src={selectedImage} className="max-w-full max-h-full rounded-2xl shadow-2xl" alt="Preview" />
              </div>
            )}

            {/* Pedidos */}
            <section id="pedidos" className="py-24 bg-blue-50">
              <div className="max-w-7xl mx-auto px-4">
                <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row">
                  <div className="lg:w-1/3 bg-blue-600 p-12 text-white flex flex-col justify-center">
                    <h3 className="text-4xl font-black mb-4 uppercase italic leading-tight italic">Levantar <br/>Pedido</h3>
                    <p className="text-blue-100 mb-8 italic font-medium">Límite máximo de 10 unidades por producto para garantizar stock.</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 font-bold"><Truck size={20}/> Entrega Inmediata</div>
                      <div class="flex items-center gap-3 font-bold"><Wallet size={20}/> Pago al Recibir</div>
                    </div>
                  </div>
                  <div className="flex-1 p-8 md:p-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                      {/* Agua Normal */}
                      <div className="flex flex-col items-center p-6 border-2 border-slate-100 rounded-3xl bg-slate-50">
                        <Droplets className="text-blue-500 mb-2" />
                        <span className="font-bold text-slate-800 mb-4 text-sm uppercase">Agua Normal</span>
                        <div className="flex items-center gap-4">
                          <button onClick={() => adjustQty('normal', -1)}><MinusCircle className="text-slate-300 hover:text-blue-600"/></button>
                          <span className="text-2xl font-black w-8 text-center">{order.normal}</span>
                          <button onClick={() => adjustQty('normal', 1)}><PlusCircle className="text-slate-300 hover:text-blue-600"/></button>
                        </div>
                      </div>
                      {/* Agua Alcalina */}
                      <div className="flex flex-col items-center p-6 border-2 border-blue-100 rounded-3xl bg-blue-50/50">
                        <FlaskConical className="text-blue-700 mb-2" />
                        <span className="font-bold text-slate-800 mb-4 text-sm uppercase">Agua Alcalina</span>
                        <div className="flex items-center gap-4">
                          <button onClick={() => adjustQty('alcalina', -1)}><MinusCircle className="text-slate-300 hover:text-blue-600"/></button>
                          <span className="text-2xl font-black w-8 text-center">{order.alcalina}</span>
                          <button onClick={() => adjustQty('alcalina', 1)}><PlusCircle className="text-slate-300 hover:text-blue-600"/></button>
                        </div>
                      </div>
                      {/* Hielo */}
                      <div className="flex flex-col items-center p-6 border-2 border-slate-100 rounded-3xl bg-slate-50">
                        <IceCream className="text-blue-400 mb-2" />
                        <span className="font-bold text-slate-800 mb-4 text-sm uppercase">Hielo Bolsa</span>
                        <div className="flex items-center gap-4">
                          <button onClick={() => adjustQty('hielo', -1)}><MinusCircle className="text-slate-300 hover:text-blue-600"/></button>
                          <span className="text-2xl font-black w-8 text-center">{order.hielo}</span>
                          <button onClick={() => adjustQty('hielo', 1)}><PlusCircle className="text-slate-300 hover:text-blue-600"/></button>
                        </div>
                      </div>
                    </div>
                    <form onSubmit={handleSendOrder} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-2">Nombre Completo</label>
                          <input name="order_name" type="text" placeholder="¿A nombre de quién?" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-2">WhatsApp / Teléfono</label>
                          <input name="order_phone" type="tel" placeholder="Ej. 667 123 4567" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all" required />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-2">Dirección de Entrega</label>
                        <input name="order_address" type="text" placeholder="Calle, número y colonia" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 transition-all" required />
                      </div>
                      <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transform transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3">
                        <Phone size={24}/> CONFIRMAR POR WHATSAPP
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </section>

            {/* Vacantes */}
            <section id="vacantes" className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-4">
                <h2 className="text-4xl font-black mb-16 uppercase italic text-center tracking-tighter italic">Bolsa de <span className="text-blue-600 font-black">Trabajo</span></h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {vacantes.map(v => (
                    <div key={v.id} className={`relative bg-white p-8 rounded-[2.5rem] shadow-xl border-l-8 flex flex-col justify-between transition hover:-translate-y-2 
                      ${v.color === 'blue' ? 'border-blue-600' : v.color === 'teal' ? 'border-teal-500' : 'border-slate-800'}`}>
                      <div>
                        <div className="flex items-center gap-4 mb-8">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner
                            ${v.color === 'blue' ? 'bg-blue-50 text-blue-600' : v.color === 'teal' ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-800'}`}>
                            <Briefcase />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-slate-800 uppercase leading-none">{v.titulo}</h4>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{v.categoria}</span>
                          </div>
                        </div>
                        <div className="space-y-4 mb-10 text-slate-600 font-semibold text-sm">
                          <p className="flex items-center gap-3"><Phone size={16} className="text-blue-600"/> {v.sueldo}</p>
                          <p className="flex items-center gap-3"><ChevronRight size={16} className="text-blue-600"/> {v.horario}</p>
                        </div>
                      </div>
                      <button className={`w-full py-4 text-white font-black rounded-2xl uppercase text-xs tracking-widest shadow-lg
                        ${v.color === 'blue' ? 'bg-blue-600' : v.color === 'teal' ? 'bg-teal-600' : 'bg-slate-800'}`}>
                        Postularse ahora
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Footer Detallado */}
            <footer className="bg-slate-950 text-white pt-24 pb-12">
              <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-white p-2 rounded-xl">
                        <Droplets className="text-blue-600" />
                      </div>
                      <span className="text-3xl font-black italic uppercase">Water<span className="text-blue-500">Chon</span></span>
                    </div>
                    <p className="text-slate-400 italic leading-relaxed max-w-sm">Pureza garantizada en cada gota, servicio garantizado en cada sucursal.</p>
                  </div>
                  <div>
                    <h5 class="text-xl font-black mb-8 uppercase italic text-blue-500 tracking-widest">Menú</h5>
                    <ul className="space-y-4 text-slate-300 font-bold">
                      <li><a href="#servicios" className="hover:text-white">Servicios</a></li>
                      <li><a href="#pedidos" className="hover:text-white">Hacer Pedido</a></li>
                      <li><a href="#galeria" className="hover:text-white">Galería</a></li>
                      <li><a href="#sucursales" className="hover:text-white">Ubicaciones</a></li>
                    </ul>
                  </div>
                  <div>
                    <h5 class="text-xl font-black mb-8 uppercase italic text-blue-500 tracking-widest">Contáctanos</h5>
                    <ul className="space-y-6 text-slate-300 font-bold">
                      <li className="flex items-center gap-4 hover:text-white cursor-pointer"><Phone className="text-blue-500"/> (667) 123-4567</li>
                      <li className="flex items-center gap-4 hover:text-white cursor-pointer"><Mail className="text-blue-500"/> contacto@waterchon.mx</li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-slate-900 pt-12 text-center text-slate-600 text-sm font-bold">
                  <p>© 2026 Grupo WaterChon S.A. de C.V. Culiacán, Sinaloa.</p>
                </div>
              </div>
            </footer>
          </>
        )}

        {view === 'login' && (
          <section className="h-[80vh] flex items-center justify-center p-4">
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-100">
              <h2 className="text-3xl font-black uppercase text-center mb-8 italic">Panel <span className="text-blue-600">Admin</span></h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <input name="email" type="email" placeholder="Usuario" className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500" required />
                <input name="password" type="password" placeholder="Contraseña" className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-blue-500" required />
                <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl">INGRESAR</button>
                <button type="button" onClick={() => setView('public')} className="w-full text-slate-400 font-bold text-sm">Cancelar</button>
              </form>
            </div>
          </section>
        )}

        {view === 'admin' && (
          <section className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-slate-900 text-white p-8 rounded-[2.5rem]">
              <h2 className="text-3xl font-black uppercase italic italic">Control de <span className="text-blue-400 font-black">Plataforma</span></h2>
              <div className="flex gap-4">
                <button onClick={() => setView('public')} className="bg-white/10 px-6 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-white/20 transition-all"><Eye size={18}/> Vista Pública</button>
                <button onClick={() => {signOut(auth); setView('public')}} className="bg-red-500/10 text-red-400 px-6 py-2 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all">Salir</button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Nueva Vacante */}
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-blue-50">
                  <h3 className="text-xl font-black mb-8 uppercase flex items-center gap-3"><PlusCircle className="text-blue-600"/> Añadir Vacante</h3>
                  <form onSubmit={(e) => handleAdminAction('vacante', e)} className="space-y-4">
                    <input name="titulo" placeholder="Puesto (ej. Operador)" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <input name="sueldo" placeholder="Sueldo Semanal" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none" />
                      <input name="horario" placeholder="Horario" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <select name="color" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none">
                        <option value="blue">Color: Azul (Planta)</option>
                        <option value="teal">Color: Aqua (CarWash)</option>
                        <option value="slate">Color: Negro (Tienda)</option>
                      </select>
                      <input name="categoria" placeholder="Categoría (ej. Retail)" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none" />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">PUBLICAR</button>
                  </form>
                </div>
                {/* Lista Vacantes */}
                <div className="bg-white p-10 rounded-[3rem] shadow-xl">
                  <h3 className="text-xl font-black mb-6 uppercase">Vacantes en Línea</h3>
                  <div className="space-y-3">
                    {vacantes.map(v => (
                      <div key={v.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border-l-4 border-blue-500">
                        <span className="font-bold text-slate-800 uppercase text-xs tracking-tight">{v.titulo}</span>
                        <button onClick={() => handleDelete('vacantes', v.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Galería Admin */}
              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-blue-50">
                  <h3 className="text-xl font-black mb-8 uppercase flex items-center gap-3"><Camera className="text-blue-600"/> Añadir Imagen</h3>
                  <form onSubmit={(e) => handleAdminAction('foto', e)} className="space-y-4">
                    <input name="titulo" placeholder="Título de la foto" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none" />
                    <input name="url" placeholder="Enlace de la imagen (URL)" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none" />
                    <select name="tipo" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 outline-none">
                      <option>Planta</option>
                      <option>Eventos</option>
                      <option>Sucursal</option>
                      <option>Calidad</option>
                    </select>
                    <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg">AGREGAR A GALERÍA</button>
                  </form>
                </div>
                <div className="bg-slate-900 p-10 rounded-[3rem] shadow-xl text-white">
                  <h3 className="text-xl font-black mb-6 uppercase">Control de Fotos</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {galeria.map(g => (
                      <div key={g.id} className="relative group aspect-square rounded-xl overflow-hidden">
                        <img src={g.url} className="w-full h-full object-cover" />
                        <button onClick={() => handleDelete('galeria', g.id)} className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Trash2 size={24}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}