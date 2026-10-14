import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classroomService } from '../services/classroom';
import { supabase } from '../lib/supabase';

vi.mock('../lib/supabase', () => {
  const fromMock = vi.fn();
  const storageMock = {
    from: vi.fn(),
  };
  const authMock = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'admin-123' } },
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

describe('Problema C: Upload Real de PDF e Limite de 20 MB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve recusar arquivos que não sejam PDF', async () => {
    const invalidFile = new File(['conteúdo'], 'documento.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await expect(
      classroomService.uploadMaterial(invalidFile, 'Apostila')
    ).rejects.toThrow('Formato de arquivo inválido. Apenas arquivos PDF são aceitos.');
  });

  it('deve recusar arquivos com tamanho superior a 20 MB', async () => {
    const twentyOneMB = 21 * 1024 * 1024;
    // Cria um arquivo simulado de 21 MB
    const largeFile = new File(['x'], 'apostila_pesada.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(largeFile, 'size', { value: twentyOneMB });

    await expect(
      classroomService.uploadMaterial(largeFile, 'Apostila Grande')
    ).rejects.toThrow(/O tamanho máximo permitido é de 20MB/);
  });

  it('deve aceitar arquivo PDF com até 20 MB e realizar upload no bucket materials', async () => {
    const validFile = new File(['pdf-content'], 'manual_aph.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(validFile, 'size', { value: 15 * 1024 * 1024 }); // 15 MB

    const mockUpload = vi.fn().mockResolvedValue({ error: null });
    (supabase.storage.from as any).mockReturnValue({
      upload: mockUpload,
    });

    // Mock do curso
    const mockCourseSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'course-aph-1' },
            error: null,
          }),
        }),
      }),
    });

    // Mock do material
    const mockMaterialInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'mat-1',
            title: 'Manual de APH',
            type: 'pdf',
            url: 'materials_123_manual_aph.pdf',
            created_at: '2026-10-14T10:00:00Z',
            classroom_courses: { id: 'course-aph-1', title: 'APH' },
          },
          error: null,
        }),
      }),
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'classroom_courses') return { select: mockCourseSelect };
      if (table === 'classroom_materials') return { insert: mockMaterialInsert };
      return {};
    });

    const result = await classroomService.uploadMaterial(
      validFile,
      'Manual de APH',
      'APH'
    );

    expect(result.id).toBe('mat-1');
    expect(result.title).toBe('Manual de APH');
    expect(supabase.storage.from).toHaveBeenCalledWith('materials');
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringContaining('manual_aph.pdf'),
      validFile,
      expect.objectContaining({ contentType: 'application/pdf' })
    );
  });

  it('deve limpar arquivo órfão no Storage se a inserção de metadados no banco falhar', async () => {
    const validFile = new File(['pdf-data'], 'protocolos.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(validFile, 'size', { value: 2 * 1024 * 1024 }); // 2 MB

    const mockUpload = vi.fn().mockResolvedValue({ error: null });
    const mockRemove = vi.fn().mockResolvedValue({ error: null });

    (supabase.storage.from as any).mockReturnValue({
      upload: mockUpload,
      remove: mockRemove,
    });

    const mockCourseSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'course-1' },
            error: null,
          }),
        }),
      }),
    });

    // Simula falha ao inserir metadados na tabela classroom_materials
    const mockMaterialInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: new Error('Database failure on metadata insert'),
        }),
      }),
    });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'classroom_courses') return { select: mockCourseSelect };
      if (table === 'classroom_materials') return { insert: mockMaterialInsert };
      return {};
    });

    await expect(
      classroomService.uploadMaterial(validFile, 'Protocolos', 'Geral')
    ).rejects.toThrow('Database failure on metadata insert');

    // Confirma limpeza do arquivo órfão
    expect(mockRemove).toHaveBeenCalledWith(
      expect.arrayContaining([expect.stringContaining('protocolos.pdf')])
    );
  });

  it('deve gerar URL assinada temporária para download em bucket privado', async () => {
    const mockCreateSignedUrl = vi.fn().mockResolvedValue({
      data: {
        signedUrl: 'https://supabase.co/storage/v1/object/sign/materials/test.pdf?token=abc',
      },
      error: null,
    });

    (supabase.storage.from as any).mockReturnValue({
      createSignedUrl: mockCreateSignedUrl,
    });

    const url = await classroomService.getDownloadUrl('materials_123.pdf');

    expect(url).toBe(
      'https://supabase.co/storage/v1/object/sign/materials/test.pdf?token=abc'
    );
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('materials_123.pdf', 3600);
  });
});
