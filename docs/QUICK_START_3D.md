# 🚀 Quick Start - Visualização 3D

Guia rápido para começar a usar a visualização 3D de exercícios.

## ✅ Status Atual

A infraestrutura está **100% implementada e funcional**:

- ✅ Three.js instalado e configurado
- ✅ Componente `Exercise3DViewer` pronto
- ✅ Sistema de cache e loading
- ✅ Integrado no treino ativo
- ✅ Controles interativos funcionando
- ✅ Fallbacks implementados

## 🎯 O Que Você Vê Agora

Atualmente, um **manequim 3D animado** é exibido como placeholder para todos os exercícios. Este manequim serve como demonstração da funcionalidade enquanto você não adiciona modelos reais.

### Como Testar Agora Mesmo

1. Vá para **Treinos** no app
2. Clique em **Iniciar Treino**
3. Escolha qualquer treino
4. Durante o treino, você verá o **visualizador 3D** com:
   - Manequim 3D animado
   - Controles de rotação (arraste)
   - Zoom (scroll/pinch)
   - Botões de ângulo (Frontal, Lateral, Superior)
   - Play/Pause da rotação automática

## 📦 Adicionar Modelos Reais

### Opção 1: Modelos Gratuitos (Rápido)

```bash
# 1. Baixe modelos de exercícios de:
# - Mixamo (personagens com animações)
# - Sketchfab (busque por "gym exercise")

# 2. Coloque em public/models/
public/models/
  ├── bench_press.glb
  ├── leg_press.glb
  └── squat.glb

# 3. Atualize o mapeamento (src/hooks/use3DLoader.tsx):
const exerciseModels: Record<string, string> = {
  'supino': '/models/bench_press.glb',
  'leg press': '/models/leg_press.glb',
  'agachamento': '/models/squat.glb',
};

# 4. Pronto! Os modelos aparecerão automaticamente
```

### Opção 2: Criar Seus Próprios Modelos

```bash
# 1. Use Blender (gratuito)
# - Modele o exercício ou use personagem base
# - Adicione animação de movimento correto
# - Exporte como .glb

# 2. Otimize o modelo
npm install -g gltf-pipeline
gltf-pipeline -i input.glb -o output.glb -d

# 3. Coloque em public/models/
# 4. Atualize o mapeamento
```

## 🎨 Exemplo Completo

### Adicionar "Supino Reto"

```typescript
// 1. src/hooks/use3DLoader.tsx
const exerciseModels: Record<string, string> = {
  'supino': '/models/bench_press.glb',
  'supino reto': '/models/bench_press.glb',
  'bench press': '/models/bench_press.glb',
  // ... outros exercícios
};

// 2. O componente automaticamente:
// - Detecta "Supino Reto" no nome do exercício
// - Carrega /models/bench_press.glb
// - Exibe com controles interativos
// - Faz cache para próximas visualizações
```

## 🔍 Lógica de Matching

O sistema busca palavras-chave no nome do exercício:

```typescript
// Se o exercício se chama "Supino Reto na Máquina"
// O sistema procura por:
'supino' → '/models/bench_press.glb' ✅

// Se não encontrar, usa o modelo padrão:
'exercício desconhecido' → '/models/default_exercise.glb'
```

## 📱 Onde Aparece

### ✅ Já Implementado
- Durante treino ativo (`ActiveWorkoutSession`)

### 🔮 Fácil de Adicionar
```tsx
// Em qualquer componente:
import { Exercise3DViewer } from '@/components/workout/Exercise3DViewer';

<Exercise3DViewer 
  exerciseName="Nome do Exercício"
  exerciseDescription="Texto opcional"
  compact={true} // true = menor, false = maior
/>
```

## 🎯 Casos de Uso

### 1. Durante o Treino (Atual)
```tsx
// ActiveWorkoutSession.tsx
<Exercise3DViewer 
  exerciseName={currentExercise.name}
  compact
/>
```

### 2. Biblioteca de Exercícios
```tsx
// ExerciseLibrary.tsx
<Exercise3DViewer 
  exerciseName={exercise.name}
  exerciseDescription="Preview do movimento"
/>
```

### 3. Criação de Treino
```tsx
// CreateWorkout.tsx
<Exercise3DViewer 
  exerciseName={selectedExercise}
  compact
/>
```

## ⚡ Performance

### Com Placeholder (Agora)
- Carga instantânea
- 60 FPS em qualquer dispositivo
- Sem requisições de rede

### Com Modelos Reais
- Primeira carga: ~1-2s (dependendo do modelo)
- Cargas seguintes: instantâneo (cache)
- Recomendado: modelos < 2MB

## 🐛 Troubleshooting

### Problema: Não vejo o visualizador 3D

**Solução:**
1. Inicie um treino
2. O visualizador aparece abaixo das notas do exercício
3. Se não aparecer, verifique console (F12)

### Problema: WebGL não suportado

**Solução:**
- O app detecta automaticamente
- Mostra mensagem amigável
- Fallback: sem visualização 3D

### Problema: Modelo não carrega

**Solução:**
1. Verifique se arquivo existe em `public/models/`
2. Confirme nome no mapeamento
3. Teste modelo em https://gltf.report/

## 📈 Próximos Passos Recomendados

### 1. Adicionar 5-10 Modelos Principais
- Supino (peito)
- Leg Press (pernas)
- Puxada (costas)
- Desenvolvimento (ombros)
- Agachamento (pernas)

### 2. Criar Animações
- Movimento de repetição completa
- 2-5 segundos de loop
- Destacar músculos trabalhados

### 3. Expandir Funcionalidades
- Modo AR (Realidade Aumentada)
- Comparação correto vs incorreto
- Tutorial interativo
- Replay de treino em 3D

## 🎓 Recursos para Aprender

### Modelagem 3D
- [Blender Guru - YouTube](https://www.youtube.com/user/AndrewPPrice)
- [Blender Fundamentals](https://www.youtube.com/playlist?list=PLa1F2ddGya_-UvuAqHAksYnB0qL9yWDO6)

### Three.js
- [Three.js Journey](https://threejs-journey.com/)
- [Discover Three.js](https://discoverthreejs.com/)

### React Three Fiber
- [Official Docs](https://docs.pmnd.rs/react-three-fiber/)
- [Codrops Tutorial](https://tympanus.net/codrops/2023/08/02/getting-started-with-three-js-and-react-three-fiber/)

## 💡 Dicas de Ouro

1. **Comece Simples**: Use modelos existentes antes de criar próprios
2. **Otimize Sempre**: Comprima modelos com Draco
3. **Teste Mobile**: Sempre teste em dispositivos reais
4. **Cache é Rei**: Aproveite o cache automático
5. **Fallback**: Sempre tenha um plano B (placeholder atual)

## 🤝 Precisa de Ajuda?

- Verifique `docs/3D_IMPLEMENTATION.md` para detalhes técnicos
- Leia `public/models/README.md` para guia de modelos
- Consulte Three.js docs para funcionalidades avançadas

---

**Pronto para usar! 🎉**

O sistema está funcionando. Agora é só adicionar os modelos 3D reais conforme necessário.
