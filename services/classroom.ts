import { supabase } from '../lib/supabase';

export interface VideoLesson {
  id: string;
  title: string;
  url: string;
  category: string;
  addedDate: string;
}

export interface MaterialItem {
  id: string;
  title: string;
  url: string; // Caminho do arquivo no bucket 'materials'
  date: string;
  category: string;
}

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const classroomService = {
  /**
   * Garante a existência de um curso/categoria correspondente na tabela classroom_courses.
   * Se já existir, retorna o id existente. Caso contrário, cadastra um novo curso.
   */
  async ensureCourse(categoryTitle: string): Promise<string> {
    const cleanTitle = (categoryTitle || 'Geral').trim();

    // 1. Tenta encontrar curso existente com o mesmo título
    const { data: existingCourse, error: searchError } = await supabase
      .from('classroom_courses')
      .select('id')
      .eq('title', cleanTitle)
      .limit(1)
      .maybeSingle();

    if (!searchError && existingCourse?.id) {
      return existingCourse.id;
    }

    // 2. Se não existir, cria o curso com o usuário autenticado como instrutor
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: newCourse, error: insertError } = await supabase
      .from('classroom_courses')
      .insert({
        title: cleanTitle,
        description: `Módulo / Categoria: ${cleanTitle}`,
        instructor_id: user?.id || null,
        status: 'ACTIVE',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Erro ao registrar curso/categoria na sala de aula:', insertError);
      throw insertError;
    }

    return newCourse.id;
  },

  /**
   * Consulta a lista persistente de videoaulas.
   */
  async getVideos(): Promise<VideoLesson[]> {
    const { data, error } = await supabase
      .from('classroom_materials')
      .select('id, title, type, url, created_at, classroom_courses(id, title)')
      .eq('type', 'video')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao consultar videoaulas:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      category: row.classroom_courses?.title || 'Geral',
      addedDate: row.created_at
        ? row.created_at.split('T')[0]
        : new Date().toISOString().split('T')[0],
    }));
  },

  /**
   * Salva uma nova videoaula no banco de dados.
   */
  async addVideo(data: {
    title: string;
    url: string;
    category: string;
  }): Promise<VideoLesson> {
    if (!data.title?.trim()) {
      throw new Error('O título da videoaula é obrigatório.');
    }
    if (!data.url?.trim()) {
      throw new Error('A URL da videoaula é obrigatória.');
    }

    // Garante que o curso/categoria pai exista
    const courseId = await this.ensureCourse(data.category);

    const { data: savedMaterial, error: insertError } = await supabase
      .from('classroom_materials')
      .insert({
        course_id: courseId,
        title: data.title.trim(),
        type: 'video',
        url: data.url.trim(),
      })
      .select('id, title, type, url, created_at, classroom_courses(id, title)')
      .single();

    if (insertError) {
      console.error('Erro ao persistir videoaula:', insertError);
      throw insertError;
    }

    return {
      id: savedMaterial.id,
      title: savedMaterial.title,
      url: savedMaterial.url,
      category: savedMaterial.classroom_courses?.title || data.category || 'Geral',
      addedDate: savedMaterial.created_at
        ? savedMaterial.created_at.split('T')[0]
        : new Date().toISOString().split('T')[0],
    };
  },

  /**
   * Consulta a lista de materiais em PDF cadastrados.
   */
  async getMaterials(): Promise<MaterialItem[]> {
    const { data, error } = await supabase
      .from('classroom_materials')
      .select('id, title, type, url, created_at, classroom_courses(id, title)')
      .eq('type', 'pdf')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao consultar materiais:', error);
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      date: row.created_at
        ? new Date(row.created_at).toLocaleDateString('pt-BR')
        : 'Adicionado recentemente',
      category: row.classroom_courses?.title || 'Geral',
    }));
  },

  /**
   * Valida e realiza upload de um arquivo PDF para o bucket privado 'materials'
   * e persiste os metadados em classroom_materials.
   */
  async uploadMaterial(
    file: File,
    title?: string,
    categoryTitle: string = 'Geral'
  ): Promise<MaterialItem> {
    if (!file) {
      throw new Error('Nenhum arquivo selecionado.');
    }

    // 1. Validação de formato (apenas PDF)
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      throw new Error('Formato de arquivo inválido. Apenas arquivos PDF são aceitos.');
    }

    // 2. Validação de tamanho (máximo 20 MB)
    if (file.size > MAX_PDF_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      throw new Error(
        `Arquivo muito grande (${fileSizeMB}MB). O tamanho máximo permitido é de 20MB.`
      );
    }

    // 3. Gerar caminho único seguro no bucket
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `materials_${Date.now()}_${cleanFileName}`;

    // 4. Upload para o bucket privado 'materials'
    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(storagePath, file, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Erro no upload para o Supabase Storage:', uploadError);
      throw uploadError;
    }

    // 5. Garantir curso/categoria e salvar metadados no banco
    try {
      const courseId = await this.ensureCourse(categoryTitle);

      const displayTitle = (title || file.name).trim();

      const { data: savedMaterial, error: dbError } = await supabase
        .from('classroom_materials')
        .insert({
          course_id: courseId,
          title: displayTitle,
          type: 'pdf',
          url: storagePath,
        })
        .select('id, title, type, url, created_at, classroom_courses(id, title)')
        .single();

      if (dbError) throw dbError;

      return {
        id: savedMaterial.id,
        title: savedMaterial.title,
        url: savedMaterial.url,
        date: savedMaterial.created_at
          ? new Date(savedMaterial.created_at).toLocaleDateString('pt-BR')
          : 'Adicionado agora',
        category: savedMaterial.classroom_courses?.title || categoryTitle,
      };
    } catch (dbError) {
      // 6. Limpeza de arquivo órfão caso a gravação dos metadados falhe
      console.warn(
        `Falha na persistência dos metadados do material. Limpando arquivo órfão no Storage: ${storagePath}`,
        dbError
      );
      try {
        await supabase.storage.from('materials').remove([storagePath]);
      } catch (cleanupError) {
        console.error('Falha ao remover arquivo órfão no Storage:', cleanupError);
      }
      throw dbError;
    }
  },

  /**
   * Gera URL assinada temporária para download seguro do arquivo em bucket privado.
   */
  async getDownloadUrl(storagePath: string): Promise<string> {
    if (!storagePath) {
      throw new Error('Caminho do arquivo não informado.');
    }

    // Se já for uma URL externa completa (ex: link http), retorna diretamente
    if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
      return storagePath;
    }

    const { data, error } = await supabase.storage
      .from('materials')
      .createSignedUrl(storagePath, 3600); // 1 hora de validade

    if (error || !data?.signedUrl) {
      console.error('Erro ao gerar URL assinada do material:', error);
      throw error || new Error('Não foi possível gerar link de acesso ao material.');
    }

    return data.signedUrl;
  },
};
