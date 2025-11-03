import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, useGLTF, Sphere, Box, Cylinder } from '@react-three/drei';
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

// Componente do modelo 3D com animações de exercícios
function ExerciseModel({ 
  url, 
  exerciseName,
  isPlaying 
}: { 
  url: string;
  exerciseName: string;
  isPlaying: boolean;
}) {
  const mannequinRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  // Detectar tipo de exercício
  const getExerciseType = (name: string): string => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('agachamento') || nameLower.includes('squat') || nameLower.includes('leg press')) {
      return 'squat';
    } else if (nameLower.includes('supino') || nameLower.includes('bench') || nameLower.includes('press') || nameLower.includes('peito')) {
      return 'bench';
    } else if (nameLower.includes('rosca') || nameLower.includes('curl') || nameLower.includes('bíceps') || nameLower.includes('biceps')) {
      return 'curl';
    } else if (nameLower.includes('puxada') || nameLower.includes('pull') || nameLower.includes('lat') || nameLower.includes('costas')) {
      return 'pulldown';
    } else if (nameLower.includes('shoulder') || nameLower.includes('ombro') || nameLower.includes('elevação') || nameLower.includes('lateral')) {
      return 'shoulder';
    } else if (nameLower.includes('abdomen') || nameLower.includes('abdominal') || nameLower.includes('abs')) {
      return 'abs';
    }
    return 'default';
  };

  const exerciseType = getExerciseType(exerciseName);

  // Animação frame por frame
  useFrame((state, delta) => {
    if (!isPlaying) return;
    
    timeRef.current += delta;
    const time = timeRef.current;
    const speed = 1.5; // Velocidade da animação

    // Animações baseadas no tipo de exercício
    switch (exerciseType) {
      case 'squat': // Agachamento
        if (torsoRef.current && leftLegRef.current && rightLegRef.current) {
          const squat = Math.sin(time * speed) * 0.4;
          torsoRef.current.position.y = 0.5 - Math.abs(squat);
          leftLegRef.current.rotation.x = squat;
          rightLegRef.current.rotation.x = squat;
        }
        break;

      case 'bench': // Supino
        if (leftArmRef.current && rightArmRef.current) {
          const press = Math.sin(time * speed) * 0.8;
          leftArmRef.current.rotation.x = -0.2 + press;
          rightArmRef.current.rotation.x = -0.2 + press;
          leftArmRef.current.rotation.z = 0.3;
          rightArmRef.current.rotation.z = -0.3;
        }
        break;

      case 'curl': // Rosca
        if (leftArmRef.current && rightArmRef.current) {
          const curl = Math.sin(time * speed) * 1.2;
          leftArmRef.current.rotation.x = -Math.abs(curl * 0.8);
          rightArmRef.current.rotation.x = -Math.abs(curl * 0.8);
        }
        break;

      case 'pulldown': // Puxada
        if (leftArmRef.current && rightArmRef.current && torsoRef.current) {
          const pull = Math.sin(time * speed) * 0.6;
          leftArmRef.current.rotation.x = -0.3 + pull;
          rightArmRef.current.rotation.x = -0.3 + pull;
          leftArmRef.current.rotation.z = 0.4;
          rightArmRef.current.rotation.z = -0.4;
          torsoRef.current.rotation.x = Math.sin(time * speed) * 0.1;
        }
        break;

      case 'shoulder': // Elevação lateral
        if (leftArmRef.current && rightArmRef.current) {
          const raise = Math.abs(Math.sin(time * speed)) * 1.2;
          leftArmRef.current.rotation.z = raise;
          rightArmRef.current.rotation.z = -raise;
          leftArmRef.current.rotation.x = -0.2;
          rightArmRef.current.rotation.x = -0.2;
        }
        break;

      case 'abs': // Abdominal
        if (torsoRef.current && leftLegRef.current && rightLegRef.current) {
          const crunch = Math.sin(time * speed) * 0.4;
          torsoRef.current.rotation.x = -Math.abs(crunch);
          leftLegRef.current.rotation.x = Math.abs(crunch) * 0.5;
          rightLegRef.current.rotation.x = Math.abs(crunch) * 0.5;
        }
        break;

      default: // Movimento respiratório suave
        if (torsoRef.current) {
          torsoRef.current.scale.y = 1 + Math.sin(time * 2) * 0.02;
          torsoRef.current.scale.x = 1 - Math.sin(time * 2) * 0.01;
        }
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.x = Math.sin(time * 0.8) * 0.1;
          rightArmRef.current.rotation.x = -Math.sin(time * 0.8) * 0.1;
        }
    }
  });

  return (
    <group ref={mannequinRef}>
      {/* Cabeça */}
      <Sphere args={[0.2, 24, 24]} position={[0, 1.5, 0]} castShadow>
        <meshStandardMaterial 
          color="#10b981" 
          metalness={0.4} 
          roughness={0.6}
          emissive="#10b981"
          emissiveIntensity={0.1}
        />
      </Sphere>

      {/* Pescoço */}
      <Cylinder args={[0.08, 0.08, 0.15, 16]} position={[0, 1.325, 0]} castShadow>
        <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.7} />
      </Cylinder>

      {/* Torso - grupo articulado */}
      <group ref={torsoRef} position={[0, 0.5, 0]}>
        <Box args={[0.5, 0.7, 0.3]} castShadow>
          <meshStandardMaterial 
            color="#8B5CF6" 
            metalness={0.5} 
            roughness={0.4}
            emissive="#8B5CF6"
            emissiveIntensity={0.15}
          />
        </Box>

        {/* Ombros */}
        <Sphere args={[0.12, 16, 16]} position={[-0.32, 0.25, 0]} castShadow>
          <meshStandardMaterial color="#6366f1" metalness={0.6} roughness={0.3} />
        </Sphere>
        <Sphere args={[0.12, 16, 16]} position={[0.32, 0.25, 0]} castShadow>
          <meshStandardMaterial color="#6366f1" metalness={0.6} roughness={0.3} />
        </Sphere>

        {/* Braço Esquerdo - articulado */}
        <group ref={leftArmRef} position={[-0.32, 0.15, 0]}>
          {/* Braço superior */}
          <Cylinder args={[0.07, 0.06, 0.45, 12]} castShadow>
            <meshStandardMaterial color="#10b981" metalness={0.4} roughness={0.6} />
          </Cylinder>
          {/* Cotovelo */}
          <Sphere args={[0.08, 12, 12]} position={[0, -0.25, 0]} castShadow>
            <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
          </Sphere>
          {/* Antebraço */}
          <Cylinder args={[0.06, 0.05, 0.4, 12]} position={[0, -0.45, 0]} castShadow>
            <meshStandardMaterial color="#10b981" metalness={0.4} roughness={0.6} />
          </Cylinder>
          {/* Mão */}
          <Sphere args={[0.07, 12, 12]} position={[0, -0.68, 0]} castShadow>
            <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.7} />
          </Sphere>
        </group>

        {/* Braço Direito - articulado */}
        <group ref={rightArmRef} position={[0.32, 0.15, 0]}>
          {/* Braço superior */}
          <Cylinder args={[0.07, 0.06, 0.45, 12]} castShadow>
            <meshStandardMaterial color="#10b981" metalness={0.4} roughness={0.6} />
          </Cylinder>
          {/* Cotovelo */}
          <Sphere args={[0.08, 12, 12]} position={[0, -0.25, 0]} castShadow>
            <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
          </Sphere>
          {/* Antebraço */}
          <Cylinder args={[0.06, 0.05, 0.4, 12]} position={[0, -0.45, 0]} castShadow>
            <meshStandardMaterial color="#10b981" metalness={0.4} roughness={0.6} />
          </Cylinder>
          {/* Mão */}
          <Sphere args={[0.07, 12, 12]} position={[0, -0.68, 0]} castShadow>
            <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.7} />
          </Sphere>
        </group>
      </group>

      {/* Quadril */}
      <Box args={[0.45, 0.25, 0.28]} position={[0, -0.075, 0]} castShadow>
        <meshStandardMaterial 
          color="#6366f1" 
          metalness={0.5} 
          roughness={0.4}
          emissive="#6366f1"
          emissiveIntensity={0.1}
        />
      </Box>

      {/* Perna Esquerda - articulada */}
      <group ref={leftLegRef} position={[-0.15, -0.2, 0]}>
        {/* Quadril/joelho */}
        <Sphere args={[0.09, 12, 12]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
        </Sphere>
        {/* Coxa */}
        <Cylinder args={[0.08, 0.07, 0.5, 12]} position={[0, -0.25, 0]} castShadow>
          <meshStandardMaterial color="#8B5CF6" metalness={0.4} roughness={0.6} />
        </Cylinder>
        {/* Joelho */}
        <Sphere args={[0.085, 12, 12]} position={[0, -0.52, 0]} castShadow>
          <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
        </Sphere>
        {/* Panturrilha */}
        <Cylinder args={[0.07, 0.06, 0.45, 12]} position={[0, -0.75, 0]} castShadow>
          <meshStandardMaterial color="#8B5CF6" metalness={0.4} roughness={0.6} />
        </Cylinder>
        {/* Pé */}
        <Box args={[0.12, 0.08, 0.22]} position={[0, -1.02, 0.08]} castShadow>
          <meshStandardMaterial color="#10b981" metalness={0.6} roughness={0.3} />
        </Box>
      </group>

      {/* Perna Direita - articulada */}
      <group ref={rightLegRef} position={[0.15, -0.2, 0]}>
        {/* Quadril/joelho */}
        <Sphere args={[0.09, 12, 12]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
        </Sphere>
        {/* Coxa */}
        <Cylinder args={[0.08, 0.07, 0.5, 12]} position={[0, -0.25, 0]} castShadow>
          <meshStandardMaterial color="#8B5CF6" metalness={0.4} roughness={0.6} />
        </Cylinder>
        {/* Joelho */}
        <Sphere args={[0.085, 12, 12]} position={[0, -0.52, 0]} castShadow>
          <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
        </Sphere>
        {/* Panturrilha */}
        <Cylinder args={[0.07, 0.06, 0.45, 12]} position={[0, -0.75, 0]} castShadow>
          <meshStandardMaterial color="#8B5CF6" metalness={0.4} roughness={0.6} />
        </Cylinder>
        {/* Pé */}
        <Box args={[0.12, 0.08, 0.22]} position={[0, -1.02, 0.08]} castShadow>
          <meshStandardMaterial color="#10b981" metalness={0.6} roughness={0.3} />
        </Box>
      </group>

      {/* Plataforma base */}
      <Cylinder args={[1.2, 1.2, 0.08, 32]} position={[0, -1.15, 0]} receiveShadow>
        <meshStandardMaterial 
          color="#1e293b" 
          metalness={0.8} 
          roughness={0.2}
          opacity={0.4}
          transparent
        />
      </Cylinder>
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
            <ExerciseModel 
              url="" 
              exerciseName={exerciseName}
              isPlaying={isPlaying}
            />
            <Environment preset="sunset" />
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

          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1.2} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.6} color="#10b981" />
          <pointLight position={[5, 3, 5]} intensity={0.4} color="#8B5CF6" />
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
                  <span className="text-xs">Reproduzir</span>
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
