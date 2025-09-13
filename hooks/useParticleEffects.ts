import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
  life: number;
  maxLife: number;
}

const createParticle = (canvas: HTMLCanvasElement, type: 'light' | 'star' | 'void'): Particle => {
  const common = {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speedX: (Math.random() - 0.5) * 1.5,
    speedY: (Math.random() - 0.5) * 1.5,
    opacity: 1,
    maxLife: 40 + Math.random() * 50
  };
  
  switch (type) {
    case 'light':
      return {
        ...common,
        size: Math.random() * 2 + 1,
        color: `rgba(255, 255, 220, ${Math.random() * 0.5 + 0.5})`,
        life: common.maxLife * 2,
        speedY: (Math.random() - 0.8) * 0.5,
      };
    case 'star':
      return {
        ...common,
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height * 0.75), // more top-heavy
        size: Math.random() * 1.5 + 0.5,
        color: `rgba(255, 255, 240, ${Math.random() * 0.7 + 0.3})`,
        life: common.maxLife * 3,
        speedX: (Math.random() - 0.5) * 0.1, // very slow drift
        speedY: (Math.random() - 0.5) * 0.1,
      };
    case 'void':
        return {
        ...common,
        size: Math.random() * 4 + 2,
        color: `rgba(44, 1, 68, ${Math.random() * 0.2 + 0.1})`,
        life: common.maxLife * 2.5,
        speedX: (Math.random() - 0.5) * 0.7,
        speedY: (Math.random() - 0.5) * 0.7,
      };
  }
};

const createBurstParticle = (canvas: HTMLCanvasElement, type: 'light' | 'star' | 'void'): Particle => {
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * 4 + 2;
  const common = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    speedX: Math.cos(angle) * speed,
    speedY: Math.sin(angle) * speed,
    opacity: 1,
    maxLife: 30 + Math.random() * 40,
    life: 0, // Will be set below
  };
  common.life = common.maxLife;

  switch (type) {
    case 'light':
      return {
        ...common,
        size: Math.random() * 2.5 + 1,
        color: `rgba(255, 255, 224, ${Math.random() * 0.6 + 0.4})`,
      };
    case 'star':
       return {
        ...common,
        size: Math.random() * 2 + 1,
        color: `rgba(255, 220, 180, ${Math.random() * 0.7 + 0.3})`,
      };
    case 'void':
      return {
        ...common,
        size: Math.random() * 3 + 1,
        color: `rgba(76, 29, 149, ${Math.random() * 0.4 + 0.2})`,
        speedX: Math.cos(angle) * speed * 0.5, // Slower implosion effect
        speedY: Math.sin(angle) * speed * 0.5,
      };
  }
}

export const useParticleEffects = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, index) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= 1;
        p.opacity = (p.life / p.maxLife) * 0.7;

        if (p.life <= 0) {
          particlesRef.current.splice(index, 1);
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const originalColor = p.color.substring(0, p.color.lastIndexOf(','));
        ctx.fillStyle = `${originalColor}, ${p.opacity})`;
        ctx.fill();
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [canvasRef]);

  const triggerEffect = (type: 'light' | 'star' | 'void', count: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(createParticle(canvas, type));
    }
    if (particlesRef.current.length > 200) {
      particlesRef.current = particlesRef.current.slice(particlesRef.current.length - 200);
    }
  };
  
  const triggerBurst = (type: 'light' | 'star' | 'void', count: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(createBurstParticle(canvas, type));
    }
     if (particlesRef.current.length > 200) {
      particlesRef.current = particlesRef.current.slice(particlesRef.current.length - 200);
    }
  }

  return {
    // Ambient effects
    triggerLight: () => triggerEffect('light', 30),
    triggerStar: () => triggerEffect('star', 25),
    triggerVoid: () => triggerEffect('void', 20),
    // Burst effects
    burstLight: () => triggerBurst('light', 50),
    burstStar: () => triggerBurst('star', 40),
    burstVoid: () => triggerBurst('void', 30),
  };
};