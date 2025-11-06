import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  User, 
  Search, 
  Dumbbell,
  Apple,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { LoadingState } from '@/components/common/LoadingState';

interface StudentProfile {
  user_id: string;
  name: string;
  avatar_url?: string;
  goal?: string;
  experience_level?: string;
  weight?: number;
  height?: number;
  age?: number;
  created_at: string;
  gender?: string;
  id: string;
  updated_at: string;
  dietary_preferences?: string[];
  dietary_restrictions?: string[];
  stats?: {
    totalWorkouts: number;
    pendingWorkouts: number;
    approvedWorkouts: number;
    rejectedWorkouts: number;
    totalNutrition: number;
    pendingNutrition: number;
  };
}

export default function PersonalStudents() {
  const navigate = useNavigate();
  const { isPersonal, loading: roleLoading } = useUserRole();
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!roleLoading && !isPersonal) {
      toast.error('Acesso negado', {
        description: 'Você não tem permissão para acessar esta área.'
      });
      navigate('/dashboard');
    }
  }, [isPersonal, roleLoading, navigate]);

  useEffect(() => {
    if (isPersonal) {
      fetchStudents();
    }
  }, [isPersonal]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(student => 
          student.name.toLowerCase().includes(query) ||
          student.goal?.toLowerCase().includes(query) ||
          student.experience_level?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os perfis de usuários (exceto personal trainers)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Para cada perfil, buscar estatísticas de treinos e dietas
      const studentsWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Verificar se não é personal trainer
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .single();

          if (roleData?.role === 'personal') {
            return null; // Pular personal trainers
          }

          // Buscar estatísticas de treinos
          const { data: workouts } = await supabase
            .from('workout_plans')
            .select('approval_status')
            .eq('user_id', profile.user_id)
            .eq('created_by', 'ai');

          // Buscar estatísticas de nutrição
          const { data: nutrition } = await supabase
            .from('nutrition_plans')
            .select('approval_status')
            .eq('user_id', profile.user_id)
            .eq('created_by', 'ai');

          const workoutStats = {
            totalWorkouts: workouts?.length || 0,
            pendingWorkouts: workouts?.filter(w => w.approval_status === 'pending').length || 0,
            approvedWorkouts: workouts?.filter(w => w.approval_status === 'approved').length || 0,
            rejectedWorkouts: workouts?.filter(w => w.approval_status === 'rejected').length || 0,
            totalNutrition: nutrition?.length || 0,
            pendingNutrition: nutrition?.filter(n => n.approval_status === 'pending').length || 0,
          };

          return {
            ...profile,
            stats: workoutStats
          };
        })
      );

      // Filtrar nulls (personal trainers) e ordenar por pendências
      const validStudents = studentsWithStats
        .filter((s): s is NonNullable<typeof s> => s !== null)
        .sort((a, b) => {
          const aPending = (a.stats?.pendingWorkouts || 0) + (a.stats?.pendingNutrition || 0);
          const bPending = (b.stats?.pendingWorkouts || 0) + (b.stats?.pendingNutrition || 0);
          return bPending - aPending;
        });

      setStudents(validStudents as StudentProfile[]);
      setFilteredStudents(validStudents as StudentProfile[]);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Header title="Meus Alunos" />
        <div className="container mx-auto px-4 pt-28 py-8 pb-20">
          <LoadingState />
        </div>
      </div>
    );
  }

  if (!isPersonal) {
    return null;
  }

  const totalPending = students.reduce((sum, s) => 
    sum + (s.stats?.pendingWorkouts || 0) + (s.stats?.pendingNutrition || 0), 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header title="Meus Alunos" />
      
      <div className="container mx-auto px-4 pt-28 py-8 pb-20 max-w-7xl space-y-6">
        {/* Header com estatísticas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Alunos</h1>
            <p className="text-muted-foreground">
              {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
              {totalPending > 0 && ` • ${totalPending} pendência${totalPending !== 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1 text-orange-600 border-orange-500/50">
              <Clock className="h-3 w-3" />
              {totalPending} Pendentes
            </Badge>
          </div>
        </div>

        {/* Barra de pesquisa */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno por nome, objetivo ou nível..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de alunos */}
        {loading ? (
          <LoadingState />
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchQuery 
                  ? 'Nenhum aluno encontrado com esse critério de busca.'
                  : 'Nenhum aluno cadastrado ainda.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => {
              const hasPending = (student.stats?.pendingWorkouts || 0) + (student.stats?.pendingNutrition || 0) > 0;
              
              return (
                <Card 
                  key={student.user_id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    hasPending ? 'border-orange-500/50 bg-orange-500/5' : ''
                  }`}
                  onClick={() => navigate(`/personal-students/${student.user_id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{student.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">
                            Desde {new Date(student.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </CardDescription>
                      </div>
                      {hasPending && (
                        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-500/50 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          {(student.stats?.pendingWorkouts || 0) + (student.stats?.pendingNutrition || 0)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Informações do perfil */}
                    <div className="flex flex-wrap gap-2">
                      {student.goal && (
                        <Badge variant="secondary" className="text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {student.goal}
                        </Badge>
                      )}
                      {student.experience_level && (
                        <Badge variant="secondary" className="text-xs">
                          {student.experience_level}
                        </Badge>
                      )}
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Dumbbell className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-semibold">{student.stats?.totalWorkouts || 0}</p>
                          <p className="text-xs text-muted-foreground">Treinos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Apple className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-semibold">{student.stats?.totalNutrition || 0}</p>
                          <p className="text-xs text-muted-foreground">Dietas</p>
                        </div>
                      </div>
                    </div>

                    {/* Status de aprovações */}
                    {student.stats && (student.stats.totalWorkouts > 0 || student.stats.totalNutrition > 0) && (
                      <div className="flex gap-2 text-xs pt-2">
                        {student.stats.pendingWorkouts > 0 && (
                          <Badge variant="outline" className="gap-1 text-orange-600 border-orange-500/50">
                            <Clock className="h-3 w-3" />
                            {student.stats.pendingWorkouts} pendente{student.stats.pendingWorkouts !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {student.stats.approvedWorkouts > 0 && (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-500/50">
                            <CheckCircle className="h-3 w-3" />
                            {student.stats.approvedWorkouts}
                          </Badge>
                        )}
                        {student.stats.rejectedWorkouts > 0 && (
                          <Badge variant="outline" className="gap-1 text-red-600 border-red-500/50">
                            <XCircle className="h-3 w-3" />
                            {student.stats.rejectedWorkouts}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/personal-students/${student.user_id}`);
                      }}
                    >
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
