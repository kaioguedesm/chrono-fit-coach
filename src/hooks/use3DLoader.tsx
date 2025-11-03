import { useState, useEffect, useCallback } from 'react';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

interface Use3DLoaderResult {
  model: GLTF | null;
  loading: boolean;
  error: Error | null;
  progress: number;
}

// Cache em memória para modelos já carregados
const modelCache = new Map<string, GLTF>();

// Mapeamento de exercícios para URLs de modelos 3D
// Aqui você pode adicionar URLs reais dos seus modelos
const exerciseModels: Record<string, string> = {
  // Exemplos - adicione os modelos reais conforme necessário
  'supino': '/models/bench_press.glb',
  'leg_press': '/models/leg_press.glb',
  'puxada': '/models/lat_pulldown.glb',
  'agachamento': '/models/squat.glb',
  'rosca': '/models/bicep_curl.glb',
  'tríceps': '/models/triceps.glb',
  'desenvolvimento': '/models/shoulder_press.glb',
  'leg': '/models/leg_extension.glb',
  'default': '/models/default_exercise.glb', // Modelo padrão
};

// Função para encontrar modelo baseado no nome do exercício
function getModelUrl(exerciseName: string): string {
  const normalizedName = exerciseName.toLowerCase();
  
  // Busca por palavras-chave no nome do exercício
  for (const [key, url] of Object.entries(exerciseModels)) {
    if (normalizedName.includes(key)) {
      return url;
    }
  }
  
  return exerciseModels.default;
}

export function use3DLoader(exerciseName: string): Use3DLoaderResult {
  const [model, setModel] = useState<GLTF | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const loadModel = useCallback(async () => {
    const modelUrl = getModelUrl(exerciseName);

    // Verificar cache primeiro
    if (modelCache.has(modelUrl)) {
      setModel(modelCache.get(modelUrl)!);
      setLoading(false);
      setProgress(100);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      // Configurar loaders
      const loader = new GLTFLoader();
      
      // Configurar Draco loader para compressão (opcional)
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      loader.setDRACOLoader(dracoLoader);

      // Carregar modelo
      const gltf = await new Promise<GLTF>((resolve, reject) => {
        loader.load(
          modelUrl,
          (gltf) => resolve(gltf),
          (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const percentComplete = (progressEvent.loaded / progressEvent.total) * 100;
              setProgress(percentComplete);
            }
          },
          (error) => reject(error)
        );
      });

      // Salvar no cache
      modelCache.set(modelUrl, gltf);
      
      setModel(gltf);
      setProgress(100);
    } catch (err) {
      console.error('Erro ao carregar modelo 3D:', err);
      setError(err instanceof Error ? err : new Error('Erro desconhecido ao carregar modelo'));
    } finally {
      setLoading(false);
    }
  }, [exerciseName]);

  useEffect(() => {
    loadModel();
  }, [loadModel]);

  return { model, loading, error, progress };
}

// Hook para verificar suporte a WebGL
export function useWebGLSupport(): boolean {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setSupported(!!gl);
    } catch (e) {
      setSupported(false);
    }
  }, []);

  return supported;
}
