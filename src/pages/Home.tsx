import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, QrCode, Scan, Shield, Users, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function Home() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const stepsRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero entrance animation
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.fromTo('.hero-eyebrow', 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.2 }
      );
      gsap.fromTo('.hero-title',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.4 }
      );
      gsap.fromTo('.hero-subtitle',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.6 }
      );
      gsap.fromTo('.hero-cta',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.8 }
      );

      // Steps scroll animation
      gsap.fromTo('.step-card',
        { opacity: 0, y: 60, rotateY: -10 },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          duration: 0.8,
          stagger: 0.15,
          scrollTrigger: {
            trigger: stepsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );

      // Features animation
      gsap.fromTo('.feature-item',
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  const handleCreateEvent = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#070A12]">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#070A12] via-[#0B1020] to-[#070A12]" />
        
        {/* Glow orb */}
        <div 
          className="absolute -right-1/4 top-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(0,240,255,0.3) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,240,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,240,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <div className="hero-eyebrow mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20">
                <Zap className="w-4 h-4 text-[#00F0FF]" />
                <span className="text-xs font-mono tracking-widest text-[#00F0FF] uppercase">
                  Digital Event Passes
                </span>
              </span>
            </div>
            
            {/* Title */}
            <h1 className="hero-title text-5xl md:text-7xl font-bold text-[#F4F7FF] mb-6 leading-tight tracking-tight">
              YOUR INVITE.
              <br />
              <span className="text-[#00F0FF]">ONE SCAN.</span>
              <br />
              YOU&apos;RE IN.
            </h1>
            
            {/* Subtitle */}
            <p className="hero-subtitle text-lg md:text-xl text-[#A7B1C6] mb-10 max-w-xl leading-relaxed">
              Create events in seconds. Guests get a QR pass. Gatekeepers scan with any phone—no apps, no friction.
            </p>
            
            {/* CTAs */}
            <div className="hero-cta flex flex-wrap gap-4">
              <Button
                onClick={handleCreateEvent}
                size="lg"
                className="bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90 font-semibold px-8 py-6 text-base rounded-xl"
              >
                Create an Event
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="border-[#A7B1C6]/30 text-[#F4F7FF] hover:bg-[#A7B1C6]/10 px-8 py-6 text-base rounded-xl"
              >
                See How It Works
              </Button>
            </div>
            
            {/* Microcopy */}
            <p className="mt-6 text-sm text-[#A7B1C6]/70">
              Free for small events. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" ref={stepsRef} className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#F4F7FF] mb-4">
              THREE STEPS TO A SOLD-OUT NIGHT
            </h2>
            <p className="text-[#A7B1C6] max-w-2xl mx-auto">
              From creation to check-in, we&apos;ve streamlined every step
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="step-card relative p-8 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-[#A7B1C6]/10">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00F0FF] to-transparent rounded-t-3xl" />
              <div className="text-5xl font-mono font-bold text-[#00F0FF]/30 mb-4">01</div>
              <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-[#00F0FF]" />
              </div>
              <h3 className="text-xl font-bold text-[#F4F7FF] mb-3">Create</h3>
              <p className="text-[#A7B1C6] leading-relaxed">
                Set name, date, location, and capacity. Get a shareable link instantly.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="step-card relative p-8 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-[#A7B1C6]/10">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00F0FF] to-transparent rounded-t-3xl" />
              <div className="text-5xl font-mono font-bold text-[#00F0FF]/30 mb-4">02</div>
              <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center mb-6">
                <QrCode className="w-6 h-6 text-[#00F0FF]" />
              </div>
              <h3 className="text-xl font-bold text-[#F4F7FF] mb-3">Register</h3>
              <p className="text-[#A7B1C6] leading-relaxed">
                Guests sign up in seconds. Each gets a unique QR pass.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="step-card relative p-8 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-[#A7B1C6]/10">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00F0FF] to-transparent rounded-t-3xl" />
              <div className="text-5xl font-mono font-bold text-[#00F0FF]/30 mb-4">03</div>
              <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/10 flex items-center justify-center mb-6">
                <Scan className="w-6 h-6 text-[#00F0FF]" />
              </div>
              <h3 className="text-xl font-bold text-[#F4F7FF] mb-3">Scan</h3>
              <p className="text-[#A7B1C6] leading-relaxed">
                Gatekeepers scan with any phone camera. Verified in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#F4F7FF] mb-6">
                BUILT TO STAY SECURE
              </h2>
              <p className="text-[#A7B1C6] mb-10 leading-relaxed">
                Every pass is protected with unique tokens and real-time verification. Your events stay secure.
              </p>
              
              <div className="space-y-6">
                <div className="feature-item flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-[#00F0FF]" />
                  </div>
                  <div>
                    <h4 className="text-[#F4F7FF] font-semibold mb-1">Unique tokens per pass</h4>
                    <p className="text-[#A7B1C6] text-sm">Cryptographically secure, impossible to guess</p>
                  </div>
                </div>
                
                <div className="feature-item flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center flex-shrink-0">
                    <Scan className="w-5 h-5 text-[#00F0FF]" />
                  </div>
                  <div>
                    <h4 className="text-[#F4F7FF] font-semibold mb-1">Single-use check-in</h4>
                    <p className="text-[#A7B1C6] text-sm">Prevents duplicate entries automatically</p>
                  </div>
                </div>
                
                <div className="feature-item flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-[#00F0FF]" />
                  </div>
                  <div>
                    <h4 className="text-[#F4F7FF] font-semibold mb-1">Revoke anytime</h4>
                    <p className="text-[#A7B1C6] text-sm">Full control over your guest list</p>
                  </div>
                </div>
                
                <div className="feature-item flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#00F0FF]/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-[#00F0FF]" />
                  </div>
                  <div>
                    <h4 className="text-[#F4F7FF] font-semibold mb-1">No guessable URLs</h4>
                    <p className="text-[#A7B1C6] text-sm">Random tokens prevent unauthorized access</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual */}
            <div className="relative">
              <div className="relative p-8 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-[#00F0FF]/20">
                <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-[#00F0FF]/20 to-transparent opacity-50" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#00F0FF]/20 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-[#00F0FF]" />
                      </div>
                      <div>
                        <p className="text-[#F4F7FF] font-semibold">Security Status</p>
                        <p className="text-[#00F0FF] text-sm">Protected</p>
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30">
                      <span className="text-xs font-mono text-[#00F0FF]">ACTIVE</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#070A12]">
                      <span className="text-[#A7B1C6] text-sm">Encryption</span>
                      <span className="text-[#00F0FF] text-sm font-mono">AES-256</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#070A12]">
                      <span className="text-[#A7B1C6] text-sm">Token Format</span>
                      <span className="text-[#00F0FF] text-sm font-mono">UUID v4</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#070A12]">
                      <span className="text-[#A7B1C6] text-sm">Verification</span>
                      <span className="text-[#00F0FF] text-sm font-mono">Real-time</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative p-12 md:p-16 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-[#00F0FF]/30 text-center overflow-hidden">
            {/* Glow effect */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-30"
              style={{
                background: 'radial-gradient(circle, rgba(0,240,255,0.2) 0%, transparent 70%)',
                filter: 'blur(60px)'
              }}
            />
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-[#F4F7FF] mb-6">
                READY TO OPEN THE DOORS?
              </h2>
              <p className="text-[#A7B1C6] text-lg mb-10 max-w-xl mx-auto">
                Create your first event. It&apos;s free to start.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  onClick={handleCreateEvent}
                  size="lg"
                  className="bg-[#00F0FF] text-[#070A12] hover:bg-[#00F0FF]/90 font-semibold px-10 py-6 text-base rounded-xl"
                >
                  Create an Event
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#A7B1C6]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-[#00F0FF]" />
              <span className="text-xl font-bold text-[#F4F7FF]">Gate-Pass</span>
            </div>
            
            <div className="flex items-center gap-8">
              <a href="#" className="text-[#A7B1C6] hover:text-[#F4F7FF] transition-colors text-sm">Privacy</a>
              <a href="#" className="text-[#A7B1C6] hover:text-[#F4F7FF] transition-colors text-sm">Terms</a>
              <a href="#" className="text-[#A7B1C6] hover:text-[#F4F7FF] transition-colors text-sm">Support</a>
            </div>
            
            <p className="text-[#A7B1C6]/60 text-sm">
              © {new Date().getFullYear()} Gate-Pass. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
