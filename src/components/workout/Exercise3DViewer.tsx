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

// Componente da máquina de exercício
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
  const mannequinRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftShoulderRef = useRef<THREE.Mesh>(null);
  const rightShoulderRef = useRef<THREE.Mesh>(null);
  const chestRef = useRef<THREE.Mesh>(null);
  const backRef = useRef<THREE.Mesh>(null);
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

  // Cores dos músculos baseadas no exercício
  const getMuscleColors = () => {
    const activeColor = '#ef4444'; // Vermelho para músculos ativos
    const inactiveColor = '#8B5CF6'; // Roxo para músculos inativos

    switch (exerciseType) {
      case 'pulldown':
        return {
          back: activeColor,
          shoulder: activeColor,
          chest: inactiveColor,
          arms: activeColor,
          legs: inactiveColor
        };
      case 'bench':
        return {
          back: inactiveColor,
          shoulder: activeColor,
          chest: activeColor,
          arms: activeColor,
          legs: inactiveColor
        };
      case 'squat':
        return {
          back: inactiveColor,
          shoulder: inactiveColor,
          chest: inactiveColor,
          arms: inactiveColor,
          legs: activeColor
        };
      case 'shoulder':
        return {
          back: inactiveColor,
          shoulder: activeColor,
          chest: inactiveColor,
          arms: activeColor,
          legs: inactiveColor
        };
      case 'curl':
        return {
          back: inactiveColor,
          shoulder: inactiveColor,
          chest: inactiveColor,
          arms: activeColor,
          legs: inactiveColor
        };
      default:
        return {
          back: inactiveColor,
          shoulder: inactiveColor,
          chest: inactiveColor,
          arms: inactiveColor,
          legs: inactiveColor
        };
    }
  };

  const muscleColors = getMuscleColors();

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
      {/* Máquina do exercício */}
      <ExerciseMachine type={exerciseType} />
      
      {/* Setas de movimento */}
      <MovementArrows type={exerciseType} phase={timeRef.current} />

      {/* Cabeça */}
      <Sphere args={[0.2, 24, 24]} position={[0, 1.5, 0]} castShadow>
        <meshStandardMaterial 
          color="#fbbf24" 
          metalness={0.3} 
          roughness={0.8}
        />
      </Sphere>

      {/* Pescoço */}
      <Cylinder args={[0.08, 0.08, 0.15, 16]} position={[0, 1.325, 0]} castShadow>
        <meshStandardMaterial color="#f59e0b" metalness={0.2} roughness={0.9} />
      </Cylinder>

      {/* Torso - grupo articulado */}
      <group ref={torsoRef} position={[0, 0.5, 0]}>
        {/* Peito - destacado quando ativo */}
        <Box ref={chestRef} args={[0.5, 0.35, 0.25]} position={[0, 0.2, 0.05]} castShadow>
          <meshStandardMaterial 
            color={muscleColors.chest}
            metalness={0.4} 
            roughness={0.6}
            emissive={muscleColors.chest === '#ef4444' ? '#ef4444' : '#8B5CF6'}
            emissiveIntensity={muscleColors.chest === '#ef4444' ? 0.3 : 0.1}
          />
        </Box>

        {/* Costas - destacado quando ativo */}
        <Box ref={backRef} args={[0.5, 0.5, 0.22]} position={[0, 0.1, -0.15]} castShadow>
          <meshStandardMaterial 
            color={muscleColors.back}
            metalness={0.4} 
            roughness={0.6}
            emissive={muscleColors.back === '#ef4444' ? '#ef4444' : '#8B5CF6'}
            emissiveIntensity={muscleColors.back === '#ef4444' ? 0.3 : 0.1}
          />
        </Box>

        {/* Abdomen */}
        <Box args={[0.42, 0.3, 0.22]} position={[0, -0.25, 0]} castShadow>
          <meshStandardMaterial color="#6366f1" metalness={0.4} roughness={0.6} />
        </Box>

        {/* Ombros - destacados quando ativos */}
        <Sphere ref={leftShoulderRef} args={[0.14, 16, 16]} position={[-0.35, 0.28, 0]} castShadow>
          <meshStandardMaterial 
            color={muscleColors.shoulder}
            metalness={0.5} 
            roughness={0.5}
            emissive={muscleColors.shoulder === '#ef4444' ? '#ef4444' : '#6366f1'}
            emissiveIntensity={muscleColors.shoulder === '#ef4444' ? 0.3 : 0.1}
          />
        </Sphere>
        <Sphere ref={rightShoulderRef} args={[0.14, 16, 16]} position={[0.35, 0.28, 0]} castShadow>
          <meshStandardMaterial 
            color={muscleColors.shoulder}
            metalness={0.5} 
            roughness={0.5}
            emissive={muscleColors.shoulder === '#ef4444' ? '#ef4444' : '#6366f1'}
            emissiveIntensity={muscleColors.shoulder === '#ef4444' ? 0.3 : 0.1}
          />
        </Sphere>

        {/* Braço Esquerdo - articulado com músculos destacados */}
        <group ref={leftArmRef} position={[-0.35, 0.18, 0]}>
          {/* Bíceps */}
          <Cylinder args={[0.075, 0.065, 0.45, 12]} castShadow>
            <meshStandardMaterial 
              color={muscleColors.arms}
              metalness={0.4} 
              roughness={0.6}
              emissive={muscleColors.arms === '#ef4444' ? '#ef4444' : '#10b981'}
              emissiveIntensity={muscleColors.arms === '#ef4444' ? 0.3 : 0.1}
            />
          </Cylinder>
          <Sphere args={[0.09, 12, 12]} position={[0, -0.25, 0]} castShadow>
            <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.6} />
          </Sphere>
          {/* Antebraço */}
          <Cylinder args={[0.065, 0.055, 0.4, 12]} position={[0, -0.45, 0]} castShadow>
            <meshStandardMaterial 
              color={muscleColors.arms}
              metalness={0.3} 
              roughness={0.7}
              emissive={muscleColors.arms === '#ef4444' ? '#ef4444' : '#10b981'}
              emissiveIntensity={muscleColors.arms === '#ef4444' ? 0.2 : 0.05}
            />
          </Cylinder>
          <Sphere args={[0.075, 12, 12]} position={[0, -0.68, 0]} castShadow>
            <meshStandardMaterial color="#f59e0b" metalness={0.2} roughness={0.8} />
          </Sphere>
        </group>

        {/* Braço Direito - articulado com músculos destacados */}
        <group ref={rightArmRef} position={[0.35, 0.18, 0]}>
          <Cylinder args={[0.075, 0.065, 0.45, 12]} castShadow>
            <meshStandardMaterial 
              color={muscleColors.arms}
              metalness={0.4} 
              roughness={0.6}
              emissive={muscleColors.arms === '#ef4444' ? '#ef4444' : '#10b981'}
              emissiveIntensity={muscleColors.arms === '#ef4444' ? 0.3 : 0.1}
            />
          </Cylinder>
          <Sphere args={[0.09, 12, 12]} position={[0, -0.25, 0]} castShadow>
            <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.6} />
          </Sphere>
          <Cylinder args={[0.065, 0.055, 0.4, 12]} position={[0, -0.45, 0]} castShadow>
            <meshStandardMaterial 
              color={muscleColors.arms}
              metalness={0.3} 
              roughness={0.7}
              emissive={muscleColors.arms === '#ef4444' ? '#ef4444' : '#10b981'}
              emissiveIntensity={muscleColors.arms === '#ef4444' ? 0.2 : 0.05}
            />
          </Cylinder>
          <Sphere args={[0.075, 12, 12]} position={[0, -0.68, 0]} castShadow>
            <meshStandardMaterial color="#f59e0b" metalness={0.2} roughness={0.8} />
          </Sphere>
        </group>
      </group>

      {/* Quadril */}
      <Box args={[0.45, 0.25, 0.28]} position={[0, -0.075, 0]} castShadow>
        <meshStandardMaterial color="#6366f1" metalness={0.4} roughness={0.6} />
      </Box>

      {/* Perna Esquerda - articulada com músculos destacados */}
      <group ref={leftLegRef} position={[-0.15, -0.2, 0]}>
        <Sphere args={[0.10, 12, 12]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.6} />
        </Sphere>
        {/* Coxa - quadríceps */}
        <Cylinder args={[0.09, 0.075, 0.5, 12]} position={[0, -0.25, 0]} castShadow>
          <meshStandardMaterial 
            color={muscleColors.legs}
            metalness={0.4} 
            roughness={0.6}
            emissive={muscleColors.legs === '#ef4444' ? '#ef4444' : '#8B5CF6'}
            emissiveIntensity={muscleColors.legs === '#ef4444' ? 0.3 : 0.1}
          />
        </Cylinder>
        <Sphere args={[0.09, 12, 12]} position={[0, -0.52, 0]} castShadow>
          <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.6} />
        </Sphere>
        {/* Panturrilha */}
        <Cylinder args={[0.075, 0.065, 0.45, 12]} position={[0, -0.75, 0]} castShadow>
          <meshStandardMaterial 
            color={muscleColors.legs}
            metalness={0.3} 
            roughness={0.7}
            emissive={muscleColors.legs === '#ef4444' ? '#ef4444' : '#8B5CF6'}
            emissiveIntensity={muscleColors.legs === '#ef4444' ? 0.2 : 0.05}
          />
        </Cylinder>
        <Box args={[0.14, 0.08, 0.24]} position={[0, -1.02, 0.1]} castShadow>
          <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
        </Box>
      </group>

      {/* Perna Direita - articulada com músculos destacados */}
      <group ref={rightLegRef} position={[0.15, -0.2, 0]}>
        <Sphere args={[0.10, 12, 12]} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.6} />
        </Sphere>
        <Cylinder args={[0.09, 0.075, 0.5, 12]} position={[0, -0.25, 0]} castShadow>
          <meshStandardMaterial 
            color={muscleColors.legs}
            metalness={0.4} 
            roughness={0.6}
            emissive={muscleColors.legs === '#ef4444' ? '#ef4444' : '#8B5CF6'}
            emissiveIntensity={muscleColors.legs === '#ef4444' ? 0.3 : 0.1}
          />
        </Cylinder>
        <Sphere args={[0.09, 12, 12]} position={[0, -0.52, 0]} castShadow>
          <meshStandardMaterial color="#f59e0b" metalness={0.4} roughness={0.6} />
        </Sphere>
        <Cylinder args={[0.075, 0.065, 0.45, 12]} position={[0, -0.75, 0]} castShadow>
          <meshStandardMaterial 
            color={muscleColors.legs}
            metalness={0.3} 
            roughness={0.7}
            emissive={muscleColors.legs === '#ef4444' ? '#ef4444' : '#8B5CF6'}
            emissiveIntensity={muscleColors.legs === '#ef4444' ? 0.2 : 0.05}
          />
        </Cylinder>
        <Box args={[0.14, 0.08, 0.24]} position={[0, -1.02, 0.1]} castShadow>
          <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
        </Box>
      </group>

      {/* Plataforma base com grid */}
      <Cylinder args={[1.4, 1.4, 0.08, 32]} position={[0, -1.15, 0]} receiveShadow>
        <meshStandardMaterial 
          color="#1e293b" 
          metalness={0.7} 
          roughness={0.3}
          opacity={0.5}
          transparent
        />
      </Cylinder>

      {/* Label informativo dos músculos trabalhados */}
      <Html position={[1.8, 1.5, 0]} center>
        <div className="bg-background/95 backdrop-blur-sm border-2 border-primary/30 rounded-lg p-3 shadow-2xl min-w-[180px]">
          <h4 className="text-xs font-bold text-primary mb-2">Músculos Trabalhados:</h4>
          <ul className="text-[10px] space-y-1">
            {muscleColors.chest === '#ef4444' && <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>Peitoral</li>}
            {muscleColors.back === '#ef4444' && <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>Costas</li>}
            {muscleColors.shoulder === '#ef4444' && <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>Ombros</li>}
            {muscleColors.arms === '#ef4444' && <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>Braços</li>}
            {muscleColors.legs === '#ef4444' && <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span>Pernas</li>}
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
