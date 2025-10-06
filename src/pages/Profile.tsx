import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { Camera, Upload } from 'lucide-react';

export default function Profile() {
  const { toast } = useToast();
  const { profile, loading, updateProfile, calculateIMC } = useProfile();
  const [saving, setSaving] = useState(false);
  const [localProfile, setLocalProfile] = useState({
    name: '',
    age: null as number | null,
    gender: null as string | null,
    weight: null as number | null,
    height: null as number | null,
    goal: null as string | null,
    experience_level: null as string | null,
  });

  // Atualizar estado local quando perfil carregar
  useEffect(() => {
    if (profile) {
      setLocalProfile({
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        weight: profile.weight,
        height: profile.height,
        goal: profile.goal,
        experience_level: profile.experience_level,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);

    try {
      const { error } = await updateProfile(localProfile);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Perfil" />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        <div className="space-y-6">
          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                <Camera className="w-4 h-4 mr-2" />
                Alterar Foto
              </Button>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    value={localProfile.name}
                    onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                    placeholder="Seu nome"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    type="number"
                    value={localProfile.age || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, age: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Sua idade"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select value={localProfile.gender || ''} onValueChange={(value) => setLocalProfile({ ...localProfile, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={localProfile.weight || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, weight: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Seu peso"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={localProfile.height || ''}
                    onChange={(e) => setLocalProfile({ ...localProfile, height: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Sua altura"
                  />
                </div>

                <div className="space-y-2">
                  <Label>IMC</Label>
                  <div className="p-2 bg-muted rounded-md text-sm">
                    {calculateIMC() ? `${calculateIMC()} kg/m²` : 'Informe peso e altura'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals & Experience */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivos e Experiência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Objetivo Principal</Label>
                  <Select value={localProfile.goal || ''} onValueChange={(value) => setLocalProfile({ ...localProfile, goal: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                      <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                      <SelectItem value="resistencia">Resistência</SelectItem>
                      <SelectItem value="mobilidade">Mobilidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nível de Experiência</Label>
                  <Select value={localProfile.experience_level || ''} onValueChange={(value) => setLocalProfile({ ...localProfile, experience_level: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Fotos de Evolução</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {['Frente', 'Lado', 'Costas'].map((type) => (
                  <div key={type} className="text-center">
                    <div className="w-full aspect-[3/4] bg-muted rounded-lg flex items-center justify-center mb-2">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{type}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <Camera className="w-4 h-4 mr-2" />
                Adicionar Fotos
              </Button>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        </div>
      </div>
    </div>
  );
}