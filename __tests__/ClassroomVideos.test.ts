import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classroomService } from '../services/classroom';
import { supabase } from '../lib/supabase';
import { notificationService } from '../services/notifications';

vi.mock('../lib/supabase', () => {
  const fromMock = vi.fn();
  const storageMock = {
    from: vi.fn(),
  };
  const authMock = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'instructor-123' } },
    }),
  };

  return {
    supabase: {
      from: fromMock,
      storage: storageMock,
      auth: authMock,
    },
  };
});

vi.mock('../services/notifications', () => ({
  notificationService: {
    add: vi.fn().mockResolvedValue('notif-123'),
  },
}));

describe('Problema B: Persistência de Videoaulas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve recusar cadastro de videoaula se título ou URL estiverem vazios', async () => {
    await expect(
      classroomService.addVideo({
        title: '',
        url: 'https://youtube.com/watch?v=123',
        category: 'APH',
      })
    ).rejects.toThrow('O título da videoaula é obrigatório.');

    await expect(
      classroomService.addVideo({
        title: 'Aula de APH',
        url: '',
        category: 'APH',
      })
    ).rejects.toThrow('A URL da videoaula é obrigatória.');
  });

  it('deve persistir a videoaula na tabela classroom_materials vinculada ao curso', async () => {
    // 1. Mock do supabase.from('classroom_courses')
    const mockCourseSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'course-uuid-1' },
            error: null,
          }),
        }),
      }),
    });

    // 2. Mock do supabase.from('classroom_materials')
    const mockMaterialInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'material-uuid-1',
            title: 'Resgate em Áreas Remotas',
            type: 'video',
            url: 'https://youtube.com/watch?v=resgate',
            created_at: '2026-10-14T10:00:00.000Z',
            classroom_courses: { id: 'course-uuid-1', title: 'Salvamento' },
          },
          error: null,
        }),
      }),
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'classroom_courses') {
        return { select: mockCourseSelect };
      }
      if (table === 'classroom_materials') {
        return { insert: mockMaterialInsert };
      }
      return {};
    });

    const result = await classroomService.addVideo({
      title: 'Resgate em Áreas Remotas',
      url: 'https://youtube.com/watch?v=resgate',
      category: 'Salvamento',
    });

    expect(result.id).toBe('material-uuid-1');
    expect(result.title).toBe('Resgate em Áreas Remotas');
    expect(result.category).toBe('Salvamento');
    expect(mockMaterialInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        course_id: 'course-uuid-1',
        title: 'Resgate em Áreas Remotas',
        type: 'video',
        url: 'https://youtube.com/watch?v=resgate',
      })
    );
  });

  it('deve propagar erro quando a gravação da videoaula no banco falhar', async () => {
    const mockCourseSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'course-uuid-1' },
            error: null,
          }),
        }),
      }),
    });

    const mockMaterialInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed'),
        }),
      }),
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'classroom_courses') return { select: mockCourseSelect };
      if (table === 'classroom_materials') return { insert: mockMaterialInsert };
      return {};
    });

    await expect(
      classroomService.addVideo({
        title: 'Aula com Erro',
        url: 'https://youtube.com/watch?v=erro',
        category: 'Geral',
      })
    ).rejects.toThrow('Database connection failed');

    // A notificação NÃO deve ser chamada se o cadastro falhar
    expect(notificationService.add).not.toHaveBeenCalled();
  });

  it('deve listar as videoaulas salvas filtrando por type=video', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'v1',
          title: 'Primeiros Socorros I',
          type: 'video',
          url: 'https://youtube.com/v1',
          created_at: '2026-10-10T12:00:00Z',
          classroom_courses: { id: 'c1', title: 'APH' },
        },
      ],
      error: null,
    });

    const mockEq = vi.fn().mockReturnValue({
      order: mockOrder,
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'classroom_materials') {
        return {
          select: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        };
      }
      return {};
    });

    const videos = await classroomService.getVideos();
    expect(videos).toHaveLength(1);
    expect(videos[0].title).toBe('Primeiros Socorros I');
    expect(videos[0].category).toBe('APH');
    expect(mockEq).toHaveBeenCalledWith('type', 'video');
  });
});
