import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Play, 
  Pause, 
  RotateCw, 
  ZoomIn, 
  Maximize2,
  Eye,
  AlertCircle
} from 'lucide-react';
import { use3DLoader, useWebGLSupport } from '@/hooks/use3DLoader';
import { cn } from '@/lib/utils';
import * as THREE from 'three';

interface Exercise3DViewerProps {
  exerciseName: string;
  exerciseDescription?: string;
  className?: string;
  compact?: boolean;
}

// Componente do modelo 3D
function ExerciseModel({ url }: { url: string }) {
  const modelRef = useRef<THREE.Group>(null);
  
  // Para modelos reais, use useGLTF do drei
  // const { scene } = useGLTF(url);
  
  // Por enquanto, mostrar um manequim simples como exemplo
  useEffect(() => {
    if (modelRef.current) {
      // Animação de rotação suave
      const animate = () => {
        if (modelRef.current) {
          modelRef.current.rotation.y += 0.002;
        }
      };
      const id = setInterval(animate, 16);
      return () => clearInterval(id);
    }
  }, []);

  return (
    <group ref={modelRef}>
      {/* Corpo principal - torso */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[0.6, 1, 0.3]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      
      {/* Cabeça */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#FFB74D" />
      </mesh>
      
      {/* Braços */}
      <mesh position={[-0.45, 0.6, 0]} castShadow>
        <boxGeometry args={[0.15, 0.8, 0.15]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      <mesh position={[0.45, 0.6, 0]} castShadow>
        <boxGeometry args={[0.15, 0.8, 0.15]} />
        <meshStandardMaterial color="#4CAF50" />
      </mesh>
      
      {/* Pernas */}
      <mesh position={[-0.2, -0.4, 0]} castShadow>
        <boxGeometry args={[0.18, 0.9, 0.18]} />
        <meshStandardMaterial color="#2196F3" />
      </mesh>
      <mesh position={[0.2, -0.4, 0]} castShadow>
        <boxGeometry args={[0.18, 0.9, 0.18]} />
        <meshStandardMaterial color="#2196F3" />
      </mesh>
      
      {/* Base/Plataforma */}
      <mesh position={[0, -0.95, 0]} receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
        <meshStandardMaterial color="#607D8B" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}

export function Exercise3DViewer({ 
  exerciseName, 
  exerciseDescription,
  className,
  compact = false 
}: Exercise3DViewerProps) {
  const webGLSupported = useWebGLSupport();
  const [isPlaying, setIsPlaying] = useState(true);
  const [cameraView, setCameraView] = useState<'front' | 'side' | 'top'>('front');
  const [isExpanded, setIsExpanded] = useState(false);
  const controlsRef = useRef<any>(null);

  const cameraPositions = {
    front: [0, 0, 5] as [number, number, number],
    side: [5, 0, 0] as [number, number, number],
    top: [0, 5, 0] as [number, number, number],
  };

  const handleCameraReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleCameraView = (view: 'front' | 'side' | 'top') => {
    setCameraView(view);
  };

  // Fallback se WebGL não for suportado
  if (!webGLSupported) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">Visualização 3D não disponível</p>
            <p className="text-xs">Seu dispositivo não suporta WebGL</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Visualização 3D</h3>
              <p className="text-xs text-muted-foreground">
                {exerciseDescription || "Veja como executar corretamente"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas 3D */}
      <div className={cn(
        "relative bg-background/50",
        isExpanded ? "h-[500px]" : compact ? "h-[250px]" : "h-[350px]"
      )}>
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <PerspectiveCamera makeDefault position={cameraPositions[cameraView]} />
          
          <Suspense fallback={null}>
            <ExerciseModel url="" />
            <Environment preset="studio" />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 1.75}
            minDistance={2}
            maxDistance={10}
            autoRotate={isPlaying}
            autoRotateSpeed={2}
          />

          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <directionalLight position={[-10, -10, -5]} intensity={0.3} />
        </Canvas>

        {/* Overlay com gradiente */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/20 to-transparent" />
      </div>

      {/* Controles */}
      <div className="p-3 border-t border-border/50 bg-muted/20">
        <div className="flex items-center justify-between gap-2">
          {/* Controles de animação */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="gap-1.5"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3.5 w-3.5" />
                  <span className="text-xs">Pausar</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  <span className="text-xs">Girar</span>
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCameraReset}
              className="gap-1.5"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span className="text-xs">Reset</span>
            </Button>
          </div>

          {/* Controles de câmera */}
          <div className="flex items-center gap-1">
            <Button
              variant={cameraView === 'front' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCameraView('front')}
              className="text-xs px-2"
            >
              Frontal
            </Button>
            <Button
              variant={cameraView === 'side' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCameraView('side')}
              className="text-xs px-2"
            >
              Lateral
            </Button>
            <Button
              variant={cameraView === 'top' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCameraView('top')}
              className="text-xs px-2"
            >
              Superior
            </Button>
          </div>
        </div>

        {/* Dica de interação */}
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          Arraste para rotacionar • Scroll para zoom • Pinch para zoom (mobile)
        </p>
      </div>
    </Card>
  );
}
