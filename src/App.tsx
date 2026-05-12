import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Star, CheckCircle, Bell, X, Moon, Shield, Award, Mail } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

// Types
type LeadData = {
  email: string;
  consent: boolean;
  createdAt: any;
};

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleBuyClick = async () => {
    setIsModalOpen(true);
    try {
      await fetch('/api/notify-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'BUY_BUTTON_CLICK' }),
      });
    } catch (err) {
      console.error('Failed to log click', err);
    }
  };

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError('Моля, дайте своето съгласие за обработка на данни.');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    const leadPath = 'leads';
    console.log("Submitting lead for email:", email);
    
    try {
      const leadsRef = collection(db, leadPath);
      
      // Attempt Firestore write with a timeout
      const writePromise = addDoc(leadsRef, {
        email,
        consent,
        source: 'smoke_test_landing',
        createdAt: serverTimestamp(),
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout')), 5000)
      );

      // We wait for either success or timeout for Firestore
      try {
        await Promise.race([writePromise, timeoutPromise]);
        console.log("Firestore write successful");
      } catch (fError) {
        console.warn("Firestore write skipped/failed, but proceeding to notify via email", fError);
      }

      // Now attempt the email notification via backend
      const notifyResponse = await fetch('/api/notify-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'EMAIL_CAPTURE' }),
      });
      
      const notifyData = await notifyResponse.json();
      console.log("Notification result:", notifyData);

      // Show success regardless of Firestore outcome, as long as we tried both
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Submission technical error:', err);
      setError('Възникна грешка при изпращането. Моля, опитайте отново след малко.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col selection:bg-indigo-100 italic-headings">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-12 py-6 border-b border-slate-100 bg-white sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
             <Moon size={18} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 uppercase">SleekREST</span>
        </div>
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-500 uppercase tracking-widest">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Характеристики</a>
          <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Отзиви</a>
          <a href="#warranty" className="hover:text-indigo-600 transition-colors">Гаранция</a>
        </div>
        <button 
          onClick={handleBuyClick}
          className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest"
        >
          КУПИ СЕГА
        </button>
      </nav>

      {/* Main Product Display Section (Split Layout) */}
      <main className="flex-1 lg:grid lg:grid-cols-2 gap-0 items-stretch min-h-[calc(100vh-80px)]">
        {/* Product Visuals (Left) */}
        <div className="bg-slate-50 flex items-center justify-center p-8 lg:p-16 relative overflow-hidden">
          <div className="absolute -inset-20 bg-indigo-100 rounded-full blur-3xl opacity-30"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col p-2">
              <img 
                src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=800" 
                alt="SleekREST Pillow" 
                className="w-full h-80 object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
              <div className="p-8">
                <div className="w-24 h-2 bg-indigo-200 rounded-full mb-4"></div>
                <div className="w-48 h-3 bg-slate-200 rounded-full mb-3"></div>
                <div className="w-32 h-3 bg-slate-100 rounded-full"></div>
              </div>
            </div>
            {/* Price Tag Badge */}
            <motion.div 
              initial={{ rotate: 0 }}
              animate={{ rotate: 12 }}
              className="absolute -top-4 -right-8 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-xl text-xl"
            >
              89.00 лв.
            </motion.div>
          </motion.div>
        </div>

        {/* Sales Copy (Right) */}
        <div className="p-12 lg:p-24 flex flex-col justify-center bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-4 text-indigo-600 font-bold tracking-widest text-xs uppercase underline underline-offset-8">Ново поколение комфорт</div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8 italic tracking-tight">
              Интелигентният <br /> сън за Вашия <br /> модерен дом
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-lg">
              Запознайте се със SleekREST — първата възглавница, която се адаптира към Вашето тяло. Елегантност, тишина и пълна хармония през цялата нощ.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 mb-12">
              <button 
                onClick={handleBuyClick}
                className="px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-tighter text-lg flex items-center justify-center gap-3"
              >
                <ShoppingCart size={22} />
                КУПИ СЕГА
              </button>
              <div className="flex items-center px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-500 font-medium">
                <span className="flex h-3 w-3 rounded-full bg-green-500 mr-3 animate-pulse"></span>
                Безплатна доставка за България
              </div>
            </div>


          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="py-24 px-12 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
              <Shield size={24} />
            </div>
            <h3 className="font-bold text-lg uppercase tracking-tight">Ортопедична опора</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Специалната форма поддържа врата в естествена позиция, независимо как спите.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
              <Award size={24} />
            </div>
            <h3 className="font-bold text-lg uppercase tracking-tight">Премиум материали</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Висококачествена мемори пяна с висока плътност, която запазва формата си.</p>
          </div>
          <div className="space-y-4">
             <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
              <Star size={24} />
            </div>
            <h3 className="font-bold text-lg uppercase tracking-tight">Дишаща материя</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Терморегулиращ калъф, който осигурява прохлада през всички сезони.</p>
          </div>
        </div>
      </section>

      {/* Sub-footer info bar */}
      <footer className="px-12 py-8 bg-white flex flex-col md:flex-row justify-between items-center border-t border-slate-100 text-[11px] text-slate-400 uppercase tracking-widest font-medium">
        <div className="mb-4 md:mb-0">© 2024 SleekREST Technologies • Всички права запазени</div>
        <div className="flex space-x-8">
          <a href="#" className="hover:text-indigo-600">Политика за бисквитки</a>
          <a href="#" className="hover:text-indigo-600">Общи условия</a>
          <a href="#" className="hover:text-indigo-600">Контакти</a>
        </div>
      </footer>

      {/* Smoke Test Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-10 md:p-14 max-w-xl w-full relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-slate-100"
            >
              <button 
                onClick={() => { setIsModalOpen(false); setIsSubmitted(false); }}
                className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={24} />
              </button>

              {!isSubmitted ? (
                <>
                  <div className="flex items-start space-x-6 mb-10">
                    <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 flex-shrink-0">
                      <Bell size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight uppercase italic">Продуктът е временно изчерпан</h3>
                      <p className="text-slate-500 leading-relaxed">
                        Поради извънредно големия интерес, първата партида бе напълно разпродадена. Оставете имейл, за да Ви уведомим първи за следващото зареждане (и да получите <span className="text-indigo-600 font-bold">ексклузивна отстъпка</span>).
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleNotifySubmit} className="space-y-6">
                    <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
                      <div className="relative flex-1">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="email" 
                          required
                          placeholder="Вашият имейл адрес..."
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all uppercase text-xs tracking-widest disabled:opacity-50 shadow-lg shadow-indigo-100 flex items-center justify-center min-w-[140px]"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'ИЗПРАТИ'}
                      </button>
                    </div>
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        required
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-wider">
                        Съгласен съм с политиката за поверителност
                      </span>
                    </label>
                    {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">{error}</p>}
                  </form>
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner"
                  >
                    <CheckCircle size={40} />
                  </motion.div>
                  <h3 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tighter italic">БЛАГОДАРИМ ВИ!</h3>
                  <p className="text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Вашият имейл <span className="text-indigo-600 font-bold">{email}</span> бе успешно записан. Ще се свържем с Вас веднага щом сме готови с новата партида!
                  </p>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="mt-10 px-10 py-4 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all hover:border-slate-300"
                  >
                    ЗАТВОРИ
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


function FeatureCard({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-10 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-2xl transition-all duration-500 group">
      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function TestimonialCard({ name, text, rating, className = '' }: { name: string, text: string, rating: number, className?: string }) {
  return (
    <div className={`bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 max-w-lg ${className}`}>
      <div className="flex text-yellow-400 mb-4">
        {[...Array(rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
      </div>
      <p className="text-lg italic text-[#1a1a1a] mb-6 leading-relaxed">"{text}"</p>
      <p className="font-bold text-sm tracking-widest uppercase text-gray-500"> — {name}</p>
    </div>
  );
}
