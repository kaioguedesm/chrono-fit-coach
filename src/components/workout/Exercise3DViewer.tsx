import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, useGLTF, Sphere, Box, Cylinder, Text, Html } from '@react-three/drei';
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

// Componente de manequim anatômico realista
function AnatomicalMannequin({ 
  exerciseType,
  isPlaying,
  timeRef 
}: { 
  exerciseType: string;
  isPlaying: boolean;
  timeRef: React.MutableRefObject<number>;
}) {
  const torsoRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  // Cores dos músculos baseadas no exercício
  const getMuscleColors = () => {
    const activeColor = '#dc2626'; // Vermelho forte para músculos ativos
    const inactiveColor = '#94a3b8'; // Cinza claro para inativos
    const skinColor = '#fcd5b4'; // Tom de pele realista

    switch (exerciseType) {
      case 'pulldown':
        return {
          pecs: inactiveColor,
          lats: activeColor,
          delts: activeColor,
          biceps: activeColor,
          triceps: inactiveColor,
          abs: inactiveColor,
          quads: inactiveColor,
          skin: skinColor
        };
      case 'bench':
        return {
          pecs: activeColor,
          lats: inactiveColor,
          delts: activeColor,
          biceps: inactiveColor,
          triceps: activeColor,
          abs: inactiveColor,
          quads: inactiveColor,
          skin: skinColor
        };
      case 'squat':
        return {
          pecs: inactiveColor,
          lats: inactiveColor,
          delts: inactiveColor,
          biceps: inactiveColor,
          triceps: inactiveColor,
          abs: activeColor,
          quads: activeColor,
          skin: skinColor
        };
      default:
        return {
          pecs: inactiveColor,
          lats: inactiveColor,
          delts: inactiveColor,
          biceps: inactiveColor,
          triceps: inactiveColor,
          abs: inactiveColor,
          quads: inactiveColor,
          skin: skinColor
        };
    }
  };

  const colors = getMuscleColors();

  // Animação do exercício
  useFrame((state, delta) => {
    if (!isPlaying) return;
    
    timeRef.current += delta;
    const time = timeRef.current;
    const speed = 1.2;

    switch (exerciseType) {
      case 'pulldown':
        if (leftArmRef.current && rightArmRef.current && torsoRef.current) {
          const pull = Math.sin(time * speed) * 0.7;
          leftArmRef.current.rotation.x = -0.4 + pull;
          rightArmRef.current.rotation.x = -0.4 + pull;
          leftArmRef.current.rotation.z = 0.5;
          rightArmRef.current.rotation.z = -0.5;
          torsoRef.current.rotation.x = Math.sin(time * speed) * 0.08;
        }
        break;

      case 'bench':
        if (leftArmRef.current && rightArmRef.current) {
          const press = Math.sin(time * speed) * 0.9;
          leftArmRef.current.rotation.x = -0.1 + press;
          rightArmRef.current.rotation.x = -0.1 + press;
          leftArmRef.current.rotation.z = 0.4;
          rightArmRef.current.rotation.z = -0.4;
        }
        break;

      case 'squat':
        if (torsoRef.current && leftLegRef.current && rightLegRef.current) {
          const squat = Math.sin(time * speed) * 0.5;
          torsoRef.current.position.y = 0.6 - Math.abs(squat * 0.4);
          leftLegRef.current.rotation.x = squat;
          rightLegRef.current.rotation.x = squat;
        }
        break;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Cabeça realista */}
      <group position={[0, 1.6, 0]}>
        <Sphere args={[0.18, 32, 32]}>
          <meshStandardMaterial color={colors.skin} roughness={0.6} metalness={0.1} />
        </Sphere>
        {/* Pescoço */}
        <Cylinder args={[0.07, 0.09, 0.18, 16]} position={[0, -0.15, 0]}>
          <meshStandardMaterial color={colors.skin} roughness={0.6} metalness={0.1} />
        </Cylinder>
      </group>

      {/* Torso anatômico */}
      <group ref={torsoRef} position={[0, 0.6, 0]}>
        {/* Peitoral (Pecs) - dividido em partes */}
        <Box args={[0.35, 0.25, 0.16]} position={[0, 0.25, 0.12]} castShadow>
          <meshStandardMaterial 
            color={colors.pecs}
            roughness={0.7} 
            metalness={0.2}
            emissive={colors.pecs === '#dc2626' ? '#dc2626' : '#000000'}
            emissiveIntensity={colors.pecs === '#dc2626' ? 0.4 : 0}
          />
        </Box>

        {/* Costas/Dorsais (Lats) */}
        <Box args={[0.48, 0.55, 0.18]} position={[0, 0.15, -0.13]} castShadow>
          <meshStandardMaterial 
            color={colors.lats}
            roughness={0.7} 
            metalness={0.2}
            emissive={colors.lats === '#dc2626' ? '#dc2626' : '#000000'}
            emissiveIntensity={colors.lats === '#dc2626' ? 0.4 : 0}
          />
        </Box>

        {/* Abdômen com definição */}
        <group position={[0, -0.2, 0.08]}>
          <Box args={[0.32, 0.15, 0.12]} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color={colors.abs} roughness={0.8} metalness={0.1} 
              emissive={colors.abs === '#dc2626' ? '#dc2626' : '#000000'}
              emissiveIntensity={colors.abs === '#dc2626' ? 0.3 : 0}
            />
          </Box>
          {/* Linhas do abdômen */}
          <Box args={[0.28, 0.12, 0.10]} position={[0, -0.12, 0.01]} castShadow>
            <meshStandardMaterial color={colors.abs} roughness={0.8} metalness={0.1} />
          </Box>
        </group>

        {/* Ombros (Deltoides) */}
        <Sphere args={[0.13, 16, 16]} position={[-0.30, 0.32, 0]} castShadow>
          <meshStandardMaterial 
            color={colors.delts}
            roughness={0.7} 
            metalness={0.2}
            emissive={colors.delts === '#dc2626' ? '#dc2626' : '#000000'}
            emissiveIntensity={colors.delts === '#dc2626' ? 0.5 : 0}
          />
        </Sphere>
        <Sphere args={[0.13, 16, 16]} position={[0.30, 0.32, 0]} castShadow>
          <meshStandardMaterial 
            color={colors.delts}
            roughness={0.7} 
            metalness={0.2}
            emissive={colors.delts === '#dc2626' ? '#dc2626' : '#000000'}
            emissiveIntensity={colors.delts === '#dc2626' ? 0.5 : 0}
          />
        </Sphere>

        {/* Braço Esquerdo Anatômico */}
        <group ref={leftArmRef} position={[-0.30, 0.22, 0]}>
          {/* Bíceps */}
          <Cylinder args={[0.07, 0.06, 0.40, 16]} position={[0, -0.20, 0]} castShadow>
            <meshStandardMaterial 
              color={colors.biceps}
              roughness={0.7} 
              metalness={0.2}
              emissive={colors.biceps === '#dc2626' ? '#dc2626' : '#000000'}
              emissiveIntensity={colors.biceps === '#dc2626' ? 0.4 : 0}
            />
          </Cylinder>
          {/* Cotovelo */}
          <Sphere args={[0.075, 12, 12]} position={[0, -0.42, 0]} castShadow>
            <meshStandardMaterial color={colors.skin} roughness={0.6} metalness={0.1} />
          </Sphere>
          {/* Antebraço */}
          <Cylinder args={[0.055, 0.045, 0.38, 16]} position={[0, -0.62, 0]} castShadow>
            <meshStandardMaterial color={colors.skin} roughness={0.7} metalness={0.1} />
          </Cylinder>
          {/* Mão */}
          <Box args={[0.08, 0.12, 0.04]} position={[0, -0.86, 0]} castShadow>
            <meshStandardMaterial color={colors.skin} roughness={0.8} metalness={0.1} />
          </Box>
        </group>

        {/* Braço Direito Anatômico */}
        <group ref={rightArmRef} position={[0.30, 0.22, 0]}>
          <Cylinder args={[0.07, 0.06, 0.40, 16]} position={[0, -0.20, 0]} castShadow>
            <meshStandardMaterial 
              color={colors.biceps}
              roughness={0.7} 
              metalness={0.2}
              emissive={colors.biceps === '#dc2626' ? '#dc2626' : '#000000'}
              emissiveIntensity={colors.biceps === '#dc2626' ? 0.4 : 0}
            />
          </Cylinder>
          <Sphere args={[0.075, 12, 12]} position={[0, -0.42, 0]} castShadow>
            <meshStandardMaterial color={colors.skin} roughness={0.6} metalness={0.1} />
          </Sphere>
          <Cylinder args={[0.055, 0.045, 0.38, 16]} position={[0, -0.62, 0]} castShadow>
            <meshStandardMaterial color={colors.skin} roughness={0.7} metalness={0.1} />
          </Cylinder>
          <Box args={[0.08, 0.12, 0.04]} position={[0, -0.86, 0]} castShadow>
            <meshStandardMaterial color={colors.skin} roughness={0.8} metalness={0.1} />
          </Box>
        </group>
      </group>

      {/* Quadril/Pelve */}
      <Box args={[0.38, 0.22, 0.24]} position={[0, 0.05, 0]} castShadow>
        <meshStandardMaterial color="#64748b" roughness={0.7} metalness={0.2} />
      </Box>

      {/* Perna Esquerda Anatômica */}
      <group ref={leftLegRef} position={[-0.13, -0.05, 0]}>
        {/* Quadríceps */}
        <Cylinder args={[0.09, 0.075, 0.50, 16]} position={[0, -0.25, 0]} castShadow>
          <meshStandardMaterial 
            color={colors.quads}
            roughness={0.7} 
            metalness={0.2}
            emissive={colors.quads === '#dc2626' ? '#dc2626' : '#000000'}
            emissiveIntensity={colors.quads === '#dc2626' ? 0.4 : 0}
          />
        </Cylinder>
        {/* Joelho */}
        <Sphere args={[0.09, 14, 14]} position={[0, -0.52, 0]} castShadow>
          <meshStandardMaterial color={colors.skin} roughness={0.6} metalness={0.1} />
        </Sphere>
        {/* Panturrilha */}
        <Cylinder args={[0.075, 0.06, 0.42, 16]} position={[0, -0.75, 0]} castShadow>
          <meshStandardMaterial color={colors.quads} roughness={0.7} metalness={0.2} />
        </Cylinder>
        {/* Pé */}
        <Box args={[0.12, 0.08, 0.24]} position={[0, -1.00, 0.08]} castShadow>
          <meshStandardMaterial color={colors.skin} roughness={0.8} metalness={0.1} />
        </Box>
      </group>

      {/* Perna Direita Anatômica */}
      <group ref={rightLegRef} position={[0.13, -0.05, 0]}>
        <Cylinder args={[0.09, 0.075, 0.50, 16]} position={[0, -0.25, 0]} castShadow>
          <meshStandardMaterial 
            color={colors.quads}
            roughness={0.7} 
            metalness={0.2}
            emissive={colors.quads === '#dc2626' ? '#dc2626' : '#000000'}
            emissiveIntensity={colors.quads === '#dc2626' ? 0.4 : 0}
          />
        </Cylinder>
        <Sphere args={[0.09, 14, 14]} position={[0, -0.52, 0]} castShadow>
          <meshStandardMaterial color={colors.skin} roughness={0.6} metalness={0.1} />
        </Sphere>
        <Cylinder args={[0.075, 0.06, 0.42, 16]} position={[0, -0.75, 0]} castShadow>
          <meshStandardMaterial color={colors.quads} roughness={0.7} metalness={0.2} />
        </Cylinder>
        <Box args={[0.12, 0.08, 0.24]} position={[0, -1.00, 0.08]} castShadow>
          <meshStandardMaterial color={colors.skin} roughness={0.8} metalness={0.1} />
        </Box>
      </group>
    </group>
  );
}
function ExerciseMachine({ type }: { type: string }) {
  switch (type) {
    case 'pulldown': // Máquina de puxada
      return (
        <group>
          {/* Estrutura principal */}
          <Box args={[0.1, 3, 0.1]} position={[-1.5, 1, 0]}>
            <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[0.1, 3, 0.1]} position={[1.5, 1, 0]}>
            <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
          </Box>
          
          {/* Barra superior */}
          <Box args={[3.2, 0.12, 0.12]} position={[0, 2.5, 0]}>
            <meshStandardMaterial color="#34495e" metalness={0.8} roughness={0.2} />
          </Box>
          
          {/* Cabo/Polia */}
          <Cylinder args={[0.15, 0.15, 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} position={[0, 2.4, 0]}>
            <meshStandardMaterial color="#95a5a6" metalness={0.9} roughness={0.1} />
          </Cylinder>
          
          {/* Barra de puxada */}
          <Box args={[1.2, 0.08, 0.08]} position={[0, 1.8, 0]}>
            <meshStandardMaterial color="#7f8c8d" metalness={0.7} roughness={0.3} />
          </Box>
          
          {/* Banco */}
          <Box args={[0.5, 0.12, 0.5]} position={[0, 0.5, 0]}>
            <meshStandardMaterial color="#2c3e50" metalness={0.3} roughness={0.7} />
          </Box>
          <Box args={[0.08, 0.5, 0.08]} position={[-0.2, 0.25, -0.2]}>
            <meshStandardMaterial color="#34495e" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[0.08, 0.5, 0.08]} position={[0.2, 0.25, -0.2]}>
            <meshStandardMaterial color="#34495e" metalness={0.8} roughness={0.2} />
          </Box>
        </group>
      );

    case 'bench': // Supino
      return (
        <group>
          {/* Banco */}
          <Box args={[0.5, 0.15, 1.5]} position={[0, 0.4, 0]}>
            <meshStandardMaterial color="#2c3e50" metalness={0.3} roughness={0.7} />
          </Box>
          
          {/* Suportes da barra */}
          <Box args={[0.1, 1, 0.1]} position={[-0.6, 1.3, 0.5]}>
            <meshStandardMaterial color="#34495e" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[0.1, 1, 0.1]} position={[0.6, 1.3, 0.5]}>
            <meshStandardMaterial color="#34495e" metalness={0.8} roughness={0.2} />
          </Box>
          
          {/* Barra */}
          <Cylinder args={[0.05, 0.05, 1.8, 16]} rotation={[0, 0, Math.PI / 2]} position={[0, 1.6, 0.5]}>
            <meshStandardMaterial color="#7f8c8d" metalness={0.9} roughness={0.1} />
          </Cylinder>
        </group>
      );

    case 'squat': // Leg Press
      return (
        <group>
          {/* Plataforma inclinada */}
          <Box args={[1.2, 0.15, 1.2]} position={[0, 1, 0.8]} rotation={[0.3, 0, 0]}>
            <meshStandardMaterial color="#2c3e50" metalness={0.5} roughness={0.5} />
          </Box>
          
          {/* Estrutura lateral */}
          <Box args={[0.1, 2, 0.1]} position={[-0.7, 0.8, 0]}>
            <meshStandardMaterial color="#34495e" metalness={0.8} roughness={0.2} />
          </Box>
          <Box args={[0.1, 2, 0.1]} position={[0.7, 0.8, 0]}>
            <meshStandardMaterial color="#34495e" metalness={0.8} roughness={0.2} />
          </Box>
          
          {/* Banco/Assento */}
          <Box args={[0.6, 0.15, 0.6]} position={[0, 0.3, -0.5]}>
            <meshStandardMaterial color="#2c3e50" metalness={0.3} roughness={0.7} />
          </Box>
        </group>
      );

    default:
      return null;
  }
}

// Componente de setas indicadoras de movimento
function MovementArrows({ type, phase }: { type: string; phase: number }) {
  const arrowRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (arrowRef.current) {
      arrowRef.current.position.y = Math.sin(phase * 2) * 0.1;
    }
  });

  const getArrowPosition = () => {
    switch (type) {
      case 'pulldown':
        return [0, 1.5, 0.5] as [number, number, number];
      case 'bench':
        return [0, 1.2, 0.8] as [number, number, number];
      case 'squat':
        return [0, 0.8, 0] as [number, number, number];
      default:
        return [0, 1, 0.5] as [number, number, number];
    }
  };

  return (
    <group ref={arrowRef} position={getArrowPosition()}>
      <Html center>
        <div className="text-primary font-bold text-sm bg-background/90 px-2 py-1 rounded-md shadow-lg backdrop-blur-sm border border-primary/20">
          ↕️ Movimento
        </div>
      </Html>
    </group>
  );
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

  // Lista de músculos trabalhados
  const getActiveMuscles = () => {
    switch (exerciseType) {
      case 'pulldown':
        return ['Dorsais (Costas)', 'Deltoides (Ombros)', 'Bíceps'];
      case 'bench':
        return ['Peitoral', 'Deltoides (Ombros)', 'Tríceps'];
      case 'squat':
        return ['Quadríceps', 'Glúteos', 'Panturrilhas'];
      case 'shoulder':
        return ['Deltoides (Ombros)', 'Trapézio'];
      case 'curl':
        return ['Bíceps', 'Antebraços'];
      case 'abs':
        return ['Abdômen', 'Oblíquos'];
      default:
        return ['Corpo todo'];
    }
  };

  const activeMuscles = getActiveMuscles();

  return (
    <group>
      {/* Máquina do exercício */}
      <ExerciseMachine type={exerciseType} />
      
      {/* Manequim Anatômico */}
      <AnatomicalMannequin 
        exerciseType={exerciseType}
        isPlaying={isPlaying}
        timeRef={timeRef}
      />
      
      {/* Setas de movimento */}
      <MovementArrows type={exerciseType} phase={timeRef.current} />

      {/* Plataforma base realista */}
      <Cylinder args={[1.6, 1.6, 0.10, 48]} position={[0, -1.18, 0]} receiveShadow>
        <meshStandardMaterial 
          color="#1e293b" 
          metalness={0.6} 
          roughness={0.4}
          opacity={0.6}
          transparent
        />
      </Cylinder>

      {/* Grid no chão */}
      <gridHelper args={[10, 10, '#64748b', '#334155']} position={[0, -1.15, 0]} />

      {/* Label informativo dos músculos trabalhados */}
      <Html position={[2, 1.2, 0]} center>
        <div className="bg-background/95 backdrop-blur-md border-2 border-red-500/40 rounded-xl p-4 shadow-2xl min-w-[200px]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <h4 className="text-sm font-bold text-foreground">Músculos Ativos</h4>
          </div>
          <ul className="text-xs space-y-2">
            {activeMuscles.map((muscle, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-foreground/90">{muscle}</span>
              </li>
            ))}
          </ul>
        </div>
      </Html>
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
    front: [0, 0.8, 4.5] as [number, number, number],
    side: [4.5, 0.8, 0] as [number, number, number],
    top: [0, 4, 0.5] as [number, number, number],
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
            maxPolarAngle={Math.PI / 1.6}
            minPolarAngle={Math.PI / 8}
            minDistance={3}
            maxDistance={8}
            autoRotate={isPlaying}
            autoRotateSpeed={1.5}
            target={[0, 0.3, 0]}
          />

          <ambientLight intensity={0.7} />
          
          {/* Luz principal (sol) */}
          <directionalLight 
            position={[10, 12, 8]} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          
          {/* Luzes de preenchimento coloridas */}
          <pointLight position={[-6, 4, -4]} intensity={0.8} color="#ef4444" />
          <pointLight position={[6, 4, 4]} intensity={0.6} color="#8B5CF6" />
          <pointLight position={[0, 2, 6]} intensity={0.5} color="#10b981" />
          
          {/* Luz de contorno */}
          <spotLight
            position={[0, 8, -5]}
            angle={0.5}
            penumbra={1}
            intensity={0.8}
            castShadow
          />
          
          {/* Grid helper no chão */}
          <gridHelper args={[12, 12, '#8B5CF6', '#374151']} position={[0, -1.2, 0]} />
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
          🔴 Vermelho = Músculos ativos • Arraste para rotacionar • Scroll para zoom
        </p>
      </div>
    </Card>
  );
}
