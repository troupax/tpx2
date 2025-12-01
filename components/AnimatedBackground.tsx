import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  size: number;
  color: string;
}

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particlesArray: Particle[];
    
    const themeColors = {
      primary: '#f97316', // brand-primary
      secondary: '#ea580c', // brand-secondary
      light: '#ffedd5', // brand-light
      lines: 'rgba(249, 115, 22, 0.15)',
    };
    
    const particleColors = [themeColors.primary, themeColors.secondary, themeColors.light];

    const createParticle = (): Particle => {
      const size = Math.random() * 2.5 + 1;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        directionX: Math.random() * 0.4 - 0.2,
        directionY: Math.random() * 0.4 - 0.2,
        size,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
      };
    };

    const init = () => {
      particlesArray = [];
      const numberOfParticles = (canvas.height * canvas.width) / 9000;
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(createParticle());
      }
    };

    const connect = () => {
      let opacityValue = 1;
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const distance =
            ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
            ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));

          if (distance < (canvas.width / 7) * (canvas.height / 7)) {
            opacityValue = 1 - (distance / 20000);
            ctx.strokeStyle = `rgba(249, 115, 22, ${opacityValue * 0.2})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const particle of particlesArray) {
        particle.x += particle.directionX;
        particle.y += particle.directionY;

        if (particle.x > canvas.width || particle.x < 0) {
          particle.directionX = -particle.directionX;
        }
        if (particle.y > canvas.height || particle.y < 0) {
          particle.directionY = -particle.directionY;
        }
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2, false);
        ctx.fillStyle = particle.color;
        ctx.fill();
      }

      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.body.scrollHeight;
      init();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        width: '100%',
        height: '100%',
        background: '#000000', // Matches dark-bg
      }}
    />
  );
};
