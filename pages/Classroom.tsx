import React, { useState } from 'react';
import { PlayCircle, FileText, Download, Upload, ExternalLink, Video, Youtube, Plus, Filter } from 'lucide-react';
import { Card, Button, Modal, Input, Badge } from '../components/ui';
import { notificationService } from '../services/notifications';

interface VideoLink {
  id: string;
  title: string;
  url: string;
  category: string;
  addedDate: string;
}

interface Material {
  id: number;
  title: string;
  size: string;
  date: string;
}

import { User, UserRole } from '../types';

interface ClassroomPageProps {
  user: User;
}

export const ClassroomPage: React.FC<ClassroomPageProps> = ({ user }) => {
  const canEdit = [UserRole.ADMIN, UserRole.INSTRUCTOR].includes(user.role);
  const [videos, setVideos] = useState<VideoLink[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Modals
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Forms
  const [newMaterial, setNewMaterial] = useState({ title: '' });
  const [newVideo, setNewVideo] = useState({ title: '', url: '', category: 'Geral' });

  // --- Helpers ---

  const getYoutubeThumbnail = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg`
      : null;
  };

  const handleOpenVideo = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (filename: string) => {
    alert(`Baixando arquivo: ${filename}`);
  };

  // --- Actions ---

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMaterial.title) {
      setMaterials([{
        id: Date.now(),
        title: newMaterial.title,
        size: '1.0 MB',
        date: 'Adicionado agora'
      }, ...materials]);

      notificationService.add({
        title: 'Novo Material de Estudo',
        message: `O arquivo "${newMaterial.title}" foi disponibilizado na sala de aula virtual.`,
        type: 'CLASSROOM',
        link: '/classroom'
      });

      setIsMaterialModalOpen(false);
      setNewMaterial({ title: '' });
    }
  };

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVideo.title && newVideo.url) {
      setVideos([...videos, {
        id: Math.random().toString(36).substr(2, 9),
        title: newVideo.title,
        url: newVideo.url,
        category: newVideo.category,
        addedDate: new Date().toISOString().split('T')[0]
      }]);

      notificationService.add({
        title: 'Nova Vídeo Aula',
        message: `Novo vídeo adicionado na categoria ${newVideo.category}: ${newVideo.title}`,
        type: 'CLASSROOM',
        link: '/classroom'
      });

      setIsVideoModalOpen(false);
      setNewVideo({ title: '', url: '', category: 'Geral' });
    }
  };

  // Logic for filtering
  const availableCategories = Array.from(new Set(videos.map(v => v.category))).sort();
  const categoriesToShow = selectedCategory === 'Todos' ? availableCategories : [selectedCategory];
  const filterButtons = ['Todos', ...availableCategories];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sala de Aula Virtual</h2>
          <p className="text-slate-500 text-sm">Biblioteca de vídeo aulas e materiais didáticos.</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsMaterialModalOpen(true)}>
              <Upload size={16} className="mr-2" /> Material PDF
            </Button>
            <Button size="sm" onClick={() => setIsVideoModalOpen(true)}>
              <Plus size={16} className="mr-2" /> Link Vídeo-Aula
            </Button>
          </div>
        )}
      </div>

      {/* --- VIDEO SECTION --- */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Youtube className="text-red-600" /> Biblioteca de Vídeos
          </h3>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterButtons.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${selectedCategory === cat
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {categoriesToShow.map(category => (
          <div key={category} className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2">
              <Badge variant="neutral" className="text-sm px-3 py-1 bg-slate-100 border-slate-200 text-slate-700">
                {category}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {videos.filter(v => v.category === category).map(video => {
                const thumbnail = getYoutubeThumbnail(video.url);
                return (
                  <Card key={video.id} className="group cursor-pointer hover:shadow-md transition-all overflow-hidden border-0 bg-white ring-1 ring-slate-100" onClick={() => handleOpenVideo(video.url)}>
                    {/* Thumbnail Container */}
                    <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                      {thumbnail ? (
                        <img src={thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                      ) : (
                        <PlayCircle size={48} className="text-slate-600" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <PlayCircle size={20} className="text-brand-600 ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">
                        {video.title}
                      </h4>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>Adicionado em {new Date(video.addedDate).toLocaleDateString('pt-BR')}</span>
                        <ExternalLink size={12} />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {videos.length === 0 && (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Video size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Nenhum vídeo cadastrado no momento.</p>
          </div>
        )}
      </div>

      {/* --- MATERIALS SECTION --- */}
      <div className="mt-8 pt-4">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
          <FileText className="text-blue-600" /> Materiais de Apoio
        </h3>
        <Card className="divide-y divide-slate-100">
          {materials.map(mat => (
            <div key={mat.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FileText size={20} /></div>
                <div>
                  <p className="font-medium text-slate-900">{mat.title}</p>
                  <p className="text-xs text-slate-500">{mat.size} • {mat.date}</p>
                </div>
              </div>
              <button
                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                onClick={() => handleDownload(mat.title)}
                title="Baixar Arquivo"
              >
                <Download size={20} />
              </button>
            </div>
          ))}
          {materials.length === 0 && (
            <div className="p-8 text-center text-slate-500">Nenhum arquivo disponível.</div>
          )}
        </Card>
      </div>

      {/* --- MODAL VIDEO --- */}
      <Modal isOpen={isVideoModalOpen} onClose={() => setIsVideoModalOpen(false)} title="Adicionar Vídeo Aula">
        <form onSubmit={handleAddVideo} className="space-y-4">
          <Input
            label="Título do Vídeo"
            placeholder="Ex: Aula de Primeiros Socorros - Mod 1"
            value={newVideo.title}
            onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
            required
          />
          <Input
            label="Link do YouTube / URL"
            placeholder="https://youtube.com/watch?v=..."
            value={newVideo.url}
            onChange={e => setNewVideo({ ...newVideo, url: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria / Assunto</label>
            <select
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-500"
              value={newVideo.category}
              onChange={e => setNewVideo({ ...newVideo, category: e.target.value })}
              required
            >
              <option value="" disabled>Selecione uma categoria...</option>
              <option value="APH - Atendimento Pré-Hospitalar">APH - Atendimento Pré-Hospitalar</option>
              <option value="Combate a Incêndio">Combate a Incêndio</option>
              <option value="Salvamento em Altura">Salvamento em Altura</option>
              <option value="Salvamento Aquático">Salvamento Aquático</option>
              <option value="Defesa Civil">Defesa Civil</option>
              <option value="Geral">Geral</option>
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsVideoModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Adicionar Vídeo</Button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL MATERIAL --- */}
      <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title="Enviar Material Didático">
        <form onSubmit={handleAddMaterial} className="space-y-4">
          <Input
            label="Título do Material"
            placeholder="Ex: Apostila de Primeiros Socorros.pdf"
            value={newMaterial.title}
            onChange={e => setNewMaterial({ title: e.target.value })}
            required
          />
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
              <Upload className="text-slate-400 group-hover:text-brand-500" />
            </div>
            <p className="text-sm font-medium">Clique para selecionar o arquivo</p>
            <p className="text-xs text-slate-400 mt-1">PDF, DOCX, PPTX (Máx 10MB)</p>
          </div>
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 mt-2">
            <Button type="button" variant="ghost" onClick={() => setIsMaterialModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Enviar Arquivo</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};