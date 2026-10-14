import React, { useState, useEffect, useRef } from 'react';
import {
  PlayCircle,
  FileText,
  Download,
  Upload,
  ExternalLink,
  Video,
  Youtube,
  Plus,
  FileCheck,
  Loader2,
} from 'lucide-react';
import { Card, Button, Modal, Input, Badge } from '../components/ui';
import { notificationService } from '../services/notifications';
import {
  classroomService,
  VideoLesson,
  MaterialItem,
} from '../services/classroom';
import { useToast } from '../components/ToastContext';
import { User, UserRole } from '../types';

interface ClassroomPageProps {
  user: User;
}

export const ClassroomPage: React.FC<ClassroomPageProps> = ({ user }) => {
  const toast = useToast();
  const canEdit = [UserRole.ADMIN, UserRole.INSTRUCTOR].includes(user.role);

  // Estados dos dados persistidos
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);

  // Filtro de categoria
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Modais
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Estados de envio e upload
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);

  // Formulários
  const [newMaterial, setNewMaterial] = useState({ title: '' });
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newVideo, setNewVideo] = useState({
    title: '',
    url: '',
    category: 'Geral',
  });

  // Carregamento persistente ao abrir/reabrir a página
  useEffect(() => {
    let isMounted = true;

    const loadClassroomData = async () => {
      setIsLoadingVideos(true);
      setIsLoadingMaterials(true);

      try {
        const [fetchedVideos, fetchedMaterials] = await Promise.all([
          classroomService.getVideos(),
          classroomService.getMaterials(),
        ]);

        if (isMounted) {
          setVideos(fetchedVideos);
          setMaterials(fetchedMaterials);
        }
      } catch (err: any) {
        console.error('Erro ao carregar dados da sala de aula:', err);
        if (isMounted) {
          toast.error(
            'Não foi possível carregar o conteúdo da sala de aula virtual.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingVideos(false);
          setIsLoadingMaterials(false);
        }
      }
    };

    loadClassroomData();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- Helpers ---

  const getYoutubeThumbnail = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`
      : null;
  };

  const handleOpenVideo = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (material: MaterialItem) => {
    try {
      toast.info('Obtendo link seguro de download...');
      const downloadUrl = await classroomService.getDownloadUrl(material.url);
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Erro ao baixar material:', err);
      toast.error(
        `Falha ao acessar arquivo: ${err.message || 'Erro desconhecido'}`
      );
    }
  };

  // --- Ações de Envio ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de formato (PDF obrigatório)
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      toast.error('Formato inválido. Apenas arquivos PDF são permitidos.');
      e.target.value = '';
      return;
    }

    // Validação de limite de 20 MB
    const MAX_SIZE_BYTES = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast.error(
        `Arquivo de ${sizeMB}MB excede o limite máximo permitido de 20MB.`
      );
      e.target.value = '';
      return;
    }

    setSelectedPdfFile(file);
    if (!newMaterial.title.trim()) {
      setNewMaterial({ title: file.name.replace(/\.[^/.]+$/, '') });
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPdfFile) {
      toast.warning('Selecione um arquivo PDF antes de enviar.');
      return;
    }

    setIsUploadingMaterial(true);

    try {
      const savedMaterial = await classroomService.uploadMaterial(
        selectedPdfFile,
        newMaterial.title || selectedPdfFile.name,
        'Geral'
      );

      // Atualiza lista persistida na interface
      setMaterials((prev) => [savedMaterial, ...prev]);

      // Emissão de notificação somente após confirmação do upload e persistência
      try {
        await notificationService.add({
          title: 'Novo Material de Estudo',
          message: `O arquivo "${savedMaterial.title}" foi disponibilizado na sala de aula virtual.`,
          type: 'CLASSROOM',
          link: '/classroom',
          broadcast: true,
        });
      } catch (notifErr) {
        console.warn('Aviso: notificação de material não enviada:', notifErr);
      }

      toast.success('Material PDF enviado com sucesso!');
      setIsMaterialModalOpen(false);
      setNewMaterial({ title: '' });
      setSelectedPdfFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Falha no upload do material:', err);
      toast.error(`Erro no envio: ${err.message || 'Falha desconhecida'}`);
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newVideo.title.trim() || !newVideo.url.trim()) {
      toast.warning('Preencha o título e o link da videoaula.');
      return;
    }

    setIsSubmittingVideo(true);

    try {
      const savedVideo = await classroomService.addVideo({
        title: newVideo.title,
        url: newVideo.url,
        category: newVideo.category || 'Geral',
      });

      // Atualiza lista persistida na interface
      setVideos((prev) => [savedVideo, ...prev]);

      // Emissão de notificação somente após confirmação do cadastro no banco
      try {
        await notificationService.add({
          title: 'Nova Vídeo Aula',
          message: `Novo vídeo adicionado na categoria ${newVideo.category}: ${newVideo.title}`,
          type: 'CLASSROOM',
          link: '/classroom',
          broadcast: true,
        });
      } catch (notifErr) {
        console.warn('Aviso: notificação de vídeo não enviada:', notifErr);
      }

      toast.success('Vídeo-aula cadastrada com sucesso!');
      setIsVideoModalOpen(false);
      setNewVideo({ title: '', url: '', category: 'Geral' });
    } catch (err: any) {
      console.error('Falha ao adicionar vídeo:', err);
      toast.error(
        `Erro ao cadastrar vídeo: ${err.message || 'Falha desconhecida'}`
      );
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  // Lógica de categorias disponíveis
  const availableCategories = Array.from(
    new Set(videos.map((v) => v.category))
  ).sort();

  const categoriesToShow =
    selectedCategory === 'Todos'
      ? availableCategories.length > 0
        ? availableCategories
        : ['Geral']
      : [selectedCategory];

  const filterButtons = ['Todos', ...availableCategories];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Sala de Aula Virtual
          </h2>
          <p className="text-slate-500 text-sm">
            Biblioteca de vídeo aulas e materiais didáticos.
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMaterialModalOpen(true)}
            >
              <Upload size={16} className="mr-2" /> Material PDF
            </Button>
            <Button size="sm" onClick={() => setIsVideoModalOpen(true)}>
              <Plus size={16} className="mr-2" /> Link Vídeo-Aula
            </Button>
          </div>
        )}
      </div>

      {/* --- SEÇÃO DE VÍDEOS --- */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Youtube className="text-red-600" /> Biblioteca de Vídeos
          </h3>
        </div>

        {/* Filtros de Categoria */}
        {availableCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filterButtons.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {isLoadingVideos ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-brand-600" />
            <p className="text-sm">Carregando biblioteca de vídeos...</p>
          </div>
        ) : (
          <>
            {categoriesToShow.map((category) => {
              const categoryVideos = videos.filter(
                (v) => v.category === category
              );
              if (categoryVideos.length === 0) return null;

              return (
                <div
                  key={category}
                  className="space-y-3 animate-in fade-in slide-in-from-bottom-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="neutral"
                      className="text-sm px-3 py-1 bg-slate-100 border-slate-200 text-slate-700"
                    >
                      {category}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categoryVideos.map((video) => {
                      const thumbnail = getYoutubeThumbnail(video.url);
                      return (
                        <Card
                          key={video.id}
                          className="group cursor-pointer hover:shadow-md transition-all overflow-hidden border-0 bg-white ring-1 ring-slate-100"
                          onClick={() => handleOpenVideo(video.url)}
                        >
                          {/* Thumbnail */}
                          <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                              />
                            ) : (
                              <PlayCircle size={48} className="text-slate-600" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                              <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <PlayCircle
                                  size={20}
                                  className="text-brand-600 ml-0.5"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">
                              {video.title}
                            </h4>
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                              <span>
                                Adicionado em{' '}
                                {new Date(video.addedDate).toLocaleDateString(
                                  'pt-BR'
                                )}
                              </span>
                              <ExternalLink size={12} />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {videos.length === 0 && (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Video size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">
                  Nenhum vídeo cadastrado no momento.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- SEÇÃO DE MATERIAIS DE APOIO --- */}
      <div className="mt-8 pt-4">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
          <FileText className="text-blue-600" /> Materiais de Apoio
        </h3>

        {isLoadingMaterials ? (
          <div className="py-8 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-blue-600" />
            <p className="text-sm">Carregando materiais didáticos...</p>
          </div>
        ) : (
          <Card className="divide-y divide-slate-100">
            {materials.map((mat) => (
              <div
                key={mat.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{mat.title}</p>
                    <p className="text-xs text-slate-500">
                      Documento PDF • {mat.date}
                    </p>
                  </div>
                </div>
                <button
                  className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  onClick={() => handleDownload(mat)}
                  title="Baixar Arquivo com Link Seguro"
                >
                  <Download size={20} />
                </button>
              </div>
            ))}
            {materials.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                Nenhum arquivo disponível no momento.
              </div>
            )}
          </Card>
        )}
      </div>

      {/* --- MODAL VIDEO --- */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => !isSubmittingVideo && setIsVideoModalOpen(false)}
        title="Adicionar Vídeo Aula"
      >
        <form onSubmit={handleAddVideo} className="space-y-4">
          <Input
            label="Título do Vídeo"
            placeholder="Ex: Aula de Primeiros Socorros - Mod 1"
            value={newVideo.title}
            onChange={(e) =>
              setNewVideo({ ...newVideo, title: e.target.value })
            }
            required
            disabled={isSubmittingVideo}
          />
          <Input
            label="Link do YouTube / URL"
            placeholder="https://youtube.com/watch?v=..."
            value={newVideo.url}
            onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
            required
            disabled={isSubmittingVideo}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Categoria / Assunto
            </label>
            <select
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-500"
              value={newVideo.category}
              onChange={(e) =>
                setNewVideo({ ...newVideo, category: e.target.value })
              }
              required
              disabled={isSubmittingVideo}
            >
              <option value="APH - Atendimento Pré-Hospitalar">
                APH - Atendimento Pré-Hospitalar
              </option>
              <option value="Combate a Incêndio">Combate a Incêndio</option>
              <option value="Salvamento em Altura">Salvamento em Altura</option>
              <option value="Salvamento Aquático">Salvamento Aquático</option>
              <option value="Defesa Civil">Defesa Civil</option>
              <option value="Geral">Geral</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 mt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmittingVideo}
              onClick={() => setIsVideoModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmittingVideo}>
              {isSubmittingVideo ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Salvando...
                </span>
              ) : (
                'Adicionar Vídeo'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL MATERIAL DIDÁTICO (PDF) --- */}
      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => !isUploadingMaterial && setIsMaterialModalOpen(false)}
        title="Enviar Material Didático (PDF)"
      >
        <form onSubmit={handleAddMaterial} className="space-y-4">
          <Input
            label="Título do Material"
            placeholder="Ex: Apostila de Primeiros Socorros"
            value={newMaterial.title}
            onChange={(e) => setNewMaterial({ title: e.target.value })}
            required
            disabled={isUploadingMaterial}
          />

          {/* Input invisível disparado pelo container */}
          <input
            type="file"
            ref={fileInputRef}
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploadingMaterial}
          />

          <div
            onClick={() => !isUploadingMaterial && fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer group hover:border-brand-500"
          >
            {selectedPdfFile ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-2">
                  <FileCheck size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-900 break-all">
                  {selectedPdfFile.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {(selectedPdfFile.size / (1024 * 1024)).toFixed(2)} MB • Clique para trocar de arquivo
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                  <Upload className="text-slate-400 group-hover:text-brand-500" />
                </div>
                <p className="text-sm font-medium">
                  Clique para selecionar o arquivo
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Apenas documentos PDF (Máx 20MB)
                </p>
              </>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 mt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isUploadingMaterial}
              onClick={() => {
                setIsMaterialModalOpen(false);
                setSelectedPdfFile(null);
                setNewMaterial({ title: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isUploadingMaterial || !selectedPdfFile}
            >
              {isUploadingMaterial ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Enviando...
                </span>
              ) : (
                'Enviar Arquivo'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
