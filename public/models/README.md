# Modelos 3D de Exercícios

Este diretório contém os modelos 3D (.glb/.gltf) usados para demonstrar a execução correta dos exercícios.

## Estrutura de Arquivos

```
public/models/
├── README.md
├── bench_press.glb          # Supino
├── leg_press.glb            # Leg Press
├── lat_pulldown.glb         # Puxada Alta
├── squat.glb                # Agachamento
├── bicep_curl.glb           # Rosca Bíceps
├── triceps.glb              # Tríceps
├── shoulder_press.glb       # Desenvolvimento
├── leg_extension.glb        # Extensão de Pernas
└── default_exercise.glb     # Modelo padrão
```

## Como Adicionar Novos Modelos

### 1. Preparação do Modelo

- **Formato**: Use `.glb` (recomendado) ou `.gltf`
- **Otimização**: Comprima com Draco ou Meshopt
- **Tamanho**: Mantenha < 2MB por modelo
- **Detalhes**: Foco em anatomia e movimento correto

### 2. Ferramentas Recomendadas

- **Modelagem**: Blender (gratuito), Maya, 3ds Max
- **Compressão**: [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline)
- **Visualização**: [gltf.report](https://gltf.report/)

### 3. Adicionar ao Projeto

1. Coloque o arquivo `.glb` neste diretório
2. Atualize o mapeamento em `src/hooks/use3DLoader.tsx`:

```typescript
const exerciseModels: Record<string, string> = {
  'novo_exercicio': '/models/novo_exercicio.glb',
  // ... outros exercícios
};
```

### 4. Boas Práticas

- **Animações**: Inclua loop de movimento completo
- **Escala**: Normalize para aproximadamente 2 unidades de altura
- **Origem**: Centro da cena (0, 0, 0)
- **Orientação**: Frente para +Z, direita para +X
- **Materiais**: Use PBR (Metalness/Roughness)

## Compressão de Modelos

### Usando gltf-pipeline

```bash
# Instalar
npm install -g gltf-pipeline

# Comprimir com Draco
gltf-pipeline -i input.glb -o output.glb -d

# Comprimir com configurações otimizadas
gltf-pipeline -i input.glb -o output.glb -d --draco.compressionLevel 10
```

## Fontes de Modelos 3D

### Gratuitas
- [Mixamo](https://www.mixamo.com/) - Personagens animados
- [Sketchfab](https://sketchfab.com/) - Modelos diversos (verificar licença)
- [TurboSquid Free](https://www.turbosquid.com/Search/3D-Models/free) - Modelos gratuitos

### Pagas
- [TurboSquid](https://www.turbosquid.com/)
- [CGTrader](https://www.cgtrader.com/)
- [Renderpeople](https://renderpeople.com/)

## Requisitos Técnicos

- **Polígonos**: < 50k triângulos por modelo
- **Texturas**: 1024x1024 ou 2048x2048 (comprimidas)
- **Formato de Textura**: KTX2 (recomendado) ou JPG/PNG
- **Bones**: < 50 (se houver rigging)
- **Animações**: 2-5 segundos de loop

## Fallback

Se um modelo não existir, o sistema exibe automaticamente um manequim 3D simples como placeholder.

## Performance

- Modelos são carregados sob demanda (lazy loading)
- Cache automático após primeiro carregamento
- Otimização para mobile e desktop
- Suporte a WebGL 1.0 e 2.0

## Teste de Modelos

Antes de adicionar ao app:

1. Valide em [gltf.report](https://gltf.report/)
2. Teste performance em [gltf-viewer](https://gltf-viewer.donmccurdy.com/)
3. Verifique compatibilidade mobile
4. Confirme animações funcionam em loop

## Contato

Para dúvidas sobre modelos 3D, consulte a documentação do Three.js:
https://threejs.org/docs/#manual/en/introduction/Loading-3D-models
