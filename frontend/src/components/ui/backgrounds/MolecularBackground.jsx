import { useEffect, useRef } from 'react';

export default function MolecularBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let nodes = [];
    let links = [];
    let frame = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let visible = true;

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const color = getComputedStyle(canvas).color;
      const positions = nodes.map((node) => ({
        ...node,
        x: node.x + Math.sin(elapsed * 0.00022 + node.phase) * 7,
        y: node.y + Math.cos(elapsed * 0.00018 + node.phase) * 9,
      }));

      for (const link of links) {
        const start = positions[link.start];
        const end = positions[link.end];
        context.strokeStyle = color;
        context.globalAlpha = link.opacity;
        context.lineWidth = 0.65;
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
      }

      for (const node of positions) {
        context.fillStyle = color;
        context.globalAlpha = node.opacity;
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
    };

    const animate = (timestamp) => {
      if (timestamp - lastFrame >= 1000 / 30) {
        elapsed += lastFrame ? Math.min(timestamp - lastFrame, 100) : 0;
        lastFrame = timestamp;
        draw();
      }
      frame = window.requestAnimationFrame(animate);
    };

    const syncAnimation = () => {
      window.cancelAnimationFrame(frame);
      lastFrame = 0;
      draw();
      if (!motion.matches && visible && !document.hidden) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      let seed = 7319;
      const random = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      const edgeWidth = Math.min(width * 0.23, 260);
      const count = Math.min(320, Math.round((width + height) / 8));
      nodes = Array.from({ length: count }, (_, index) => {
        const band = index % 10;
        const progress = random();
        const spread = (random() + random() - 1) * edgeWidth * 0.8;
        let positionX;
        let positionY;
        if (band < 7) {
          positionY = progress * height;
          const curve = edgeWidth * (0.45 + Math.sin(progress * Math.PI * 3) * 0.28);
          positionX = band < 4 ? curve + spread : width - curve + spread;
        } else {
          positionX = progress * width;
          positionY = band < 9 ? random() * 100 - 15 : height - random() * 120;
        }
        return {
          x: positionX,
          y: positionY,
          radius: 1.3 + random() ** 2 * 4.3,
          opacity: random() > 0.3 ? 0.42 + random() * 0.34 : 0.12,
          phase: random() * Math.PI * 2,
        };
      });

      const reach = width < 640 ? 85 : 145;
      links = [];
      for (let start = 0; start < nodes.length; start += 1) {
        for (let end = start + 1; end < nodes.length; end += 1) {
          const distance = Math.hypot(nodes[start].x - nodes[end].x, nodes[start].y - nodes[end].y);
          if (distance < reach) {
            links.push({ start, end, opacity: (1 - distance / reach) * 0.3 });
          }
        }
      }
      syncAnimation();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    });
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    motion.addEventListener('change', syncAnimation);
    document.addEventListener('visibilitychange', syncAnimation);
    resize();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      motion.removeEventListener('change', syncAnimation);
      document.removeEventListener('visibilitychange', syncAnimation);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-brand-500 opacity-80 dark:text-brand-200 dark:opacity-60"
    />
  );
}