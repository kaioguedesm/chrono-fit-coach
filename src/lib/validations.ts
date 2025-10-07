import { z } from 'zod';

// Authentication validation
export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(255, 'Email muito longo'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(72, 'Senha muito longa'),
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo')
    .optional(),
});

// Profile validation
export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo'),
  age: z
    .number()
    .int('Idade deve ser um número inteiro')
    .min(13, 'Idade mínima: 13 anos')
    .max(120, 'Idade máxima: 120 anos')
    .optional()
    .nullable(),
  weight: z
    .number()
    .min(20, 'Peso mínimo: 20kg')
    .max(500, 'Peso máximo: 500kg')
    .optional()
    .nullable(),
  height: z
    .number()
    .min(50, 'Altura mínima: 50cm')
    .max(300, 'Altura máxima: 300cm')
    .optional()
    .nullable(),
  gender: z
    .enum(['masculino', 'feminino', 'outro'])
    .optional()
    .nullable(),
  goal: z
    .enum(['emagrecimento', 'hipertrofia', 'resistencia', 'mobilidade'])
    .optional()
    .nullable(),
  experience_level: z
    .enum(['iniciante', 'intermediario', 'avancado'])
    .optional()
    .nullable(),
});

// Body measurements validation
export const measurementSchema = z.object({
  weight: z
    .number()
    .min(20, 'Peso mínimo: 20kg')
    .max(500, 'Peso máximo: 500kg')
    .optional()
    .nullable(),
  body_fat_percentage: z
    .number()
    .min(1, 'Percentual mínimo: 1%')
    .max(70, 'Percentual máximo: 70%')
    .optional()
    .nullable(),
  muscle_mass: z
    .number()
    .min(1, 'Massa muscular mínima: 1kg')
    .max(300, 'Massa muscular máxima: 300kg')
    .optional()
    .nullable(),
  chest: z
    .number()
    .min(30, 'Medida mínima: 30cm')
    .max(300, 'Medida máxima: 300cm')
    .optional()
    .nullable(),
  waist: z
    .number()
    .min(30, 'Medida mínima: 30cm')
    .max(300, 'Medida máxima: 300cm')
    .optional()
    .nullable(),
  hips: z
    .number()
    .min(30, 'Medida mínima: 30cm')
    .max(300, 'Medida máxima: 300cm')
    .optional()
    .nullable(),
  arm: z
    .number()
    .min(10, 'Medida mínima: 10cm')
    .max(100, 'Medida máxima: 100cm')
    .optional()
    .nullable(),
  thigh: z
    .number()
    .min(20, 'Medida mínima: 20cm')
    .max(150, 'Medida máxima: 150cm')
    .optional()
    .nullable(),
});

// Photo upload validation
export const photoUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Arquivo muito grande (máx 10MB)')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Tipo de arquivo inválido (apenas JPG, PNG, WEBP)'
    ),
  photo_type: z.enum(['frente', 'lado', 'costas'], {
    errorMap: () => ({ message: 'Tipo de foto inválido' }),
  }),
  description: z
    .string()
    .trim()
    .max(500, 'Descrição muito longa (máx 500 caracteres)')
    .optional(),
});

// AI workout generation validation
export const workoutGenerationSchema = z.object({
  goal: z
    .string()
    .trim()
    .min(1, 'Objetivo é obrigatório')
    .max(100, 'Objetivo muito longo'),
  experience: z
    .string()
    .trim()
    .min(1, 'Nível de experiência é obrigatório'),
  equipment: z
    .string()
    .trim()
    .min(1, 'Equipamentos disponíveis é obrigatório')
    .max(500, 'Lista de equipamentos muito longa'),
  restrictions: z
    .string()
    .trim()
    .max(500, 'Restrições muito longas')
    .optional(),
  daysPerWeek: z
    .number()
    .int('Dias por semana deve ser um número inteiro')
    .min(1, 'Mínimo 1 dia por semana')
    .max(7, 'Máximo 7 dias por semana'),
});

// AI nutrition generation validation
export const nutritionGenerationSchema = z.object({
  diet_type: z
    .string()
    .trim()
    .min(1, 'Tipo de dieta é obrigatório')
    .max(50, 'Tipo de dieta muito longo'),
  restrictions: z
    .array(z.string())
    .max(20, 'Máximo 20 restrições')
    .optional(),
  preferences: z
    .string()
    .trim()
    .max(1000, 'Preferências muito longas')
    .optional(),
});
