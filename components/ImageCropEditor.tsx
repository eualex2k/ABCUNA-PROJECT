import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button } from './ui';
import { ZoomIn, ZoomOut, RotateCcw, Check, X } from 'lucide-react';

export interface ImageCropEditorProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  onConfirm: (croppedFile: File) => void;
  title?: string;
  aspectRatio?: number; // ex: 1 para perfil, 16/9 para banner
  cropShape?: 'round' | 'rect';
}

export const ImageCropEditor: React.FC<ImageCropEditorProps> = ({
  isOpen,
  onClose,
  file,
  onConfirm,
  title = 'Ajustar Imagem',
  aspectRatio = 1,
  cropShape = 'rect',
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Carregar objeto URL a partir do arquivo selecionado
  useEffect(() => {
    if (!file) {
      setImageSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setZoom(1);
    setPosition({ x: 0, y: 0 });

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // Drag Handlers (Arrastar)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Geração do arquivo final no Canvas (Exatidão de Coordenadas)
  const handleConfirm = async () => {
    if (!file || !imageRef.current || !cropBoxRef.current || !containerRef.current) return;
    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const cropBoxRect = cropBoxRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      const { width: nw, height: nh } = naturalSize;
      const containerW = containerRect.width;
      const containerH = containerRect.height;

      const baseScale = Math.min(containerW / nw, containerH / nh);
      const baseRenderW = nw * baseScale;
      const baseRenderH = nh * baseScale;

      const currentRenderW = baseRenderW * zoom;
      const currentRenderH = baseRenderH * zoom;

      const imgLeftInContainer = (containerW - currentRenderW) / 2 + position.x;
      const imgTopInContainer = (containerH - currentRenderH) / 2 + position.y;

      const cropLeftInContainer = (containerW - cropBoxRect.width) / 2;
      const cropTopInContainer = (containerH - cropBoxRect.height) / 2;

      const cropLeftInImg = cropLeftInContainer - imgLeftInContainer;
      const cropTopInImg = cropTopInContainer - imgTopInContainer;

      const scaleToNatural = nw / currentRenderW;

      const sourceX = cropLeftInImg * scaleToNatural;
      const sourceY = cropTopInImg * scaleToNatural;
      const sourceWidth = cropBoxRect.width * scaleToNatural;
      const sourceHeight = cropBoxRect.height * scaleToNatural;

      const targetAspect = aspectRatio || (cropBoxRect.width / cropBoxRect.height);
      const outputWidth = Math.min(Math.round(cropBoxRect.width * 2.5), 1000);
      const outputHeight = Math.round(outputWidth / targetAspect);

      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Não foi possível inicializar o contexto 2D do Canvas.');
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const extension = file.type === 'image/png' ? 'png' : 'jpg';

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsProcessing(false);
            return;
          }
          const croppedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, '') + `_edited.${extension}`,
            {
              type: mimeType,
              lastModified: Date.now(),
            }
          );
          onConfirm(croppedFile);
          setIsProcessing(false);
          onClose();
        },
        mimeType,
        0.92
      );
    } catch (err) {
      console.error('Erro ao processar imagem no Canvas:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen || !file) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="lg">
      <div className="flex flex-col gap-3 select-none max-h-[82vh]">
        <p className="text-xs text-slate-500 shrink-0">
          Arraste a imagem para reposicionar e use o zoom para definir o enquadramento ideal.
        </p>

        {/* Viewport Principal (Palco do Editor com dimensões mantidas para escala exata de 280px) */}
        <div
          ref={containerRef}
          className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center shrink-0"
        >
          {/* Imagem Original mantendo Aspect Ratio Natural */}
          {imageSrc && (
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Pré-visualização"
              onLoad={handleImageLoad}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              className="pointer-events-auto touch-none select-none"
              draggable={false}
            />
          )}

          {/* Overlay de Enquadramento */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div className="absolute inset-0 bg-black/60" />

            {/* Janela de Recorte Visível (Crop Box com dimensões originais de 280px) */}
            <div
              ref={cropBoxRef}
              className={`relative z-20 shadow-2xl border-2 border-white/90 shrink-0 ${
                cropShape === 'round' ? 'rounded-full' : 'rounded-lg'
              }`}
              style={{
                width: aspectRatio && aspectRatio >= 1 ? 'min(80%, 280px)' : 'min(75%, 240px)',
                aspectRatio: aspectRatio ? `${aspectRatio}` : '1 / 1',
              }}
            >
              {/* Grade Visual 3x3 */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-r border-b border-white/30" />
                <div className="border-b border-white/30" />
                <div className="border-r border-white/30" />
                <div className="border-r border-white/30" />
                <div />
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Zoom e Reset */}
        <div className="shrink-0 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-slate-500 shrink-0" />
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-brand-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <ZoomIn size={16} className="text-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-600 w-12 text-right">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-bold text-slate-600 hover:text-brand-600 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={13} /> Restaurar Enquadramento
            </button>
          </div>
        </div>

        {/* Ações Inferiores (Sempre visíveis no rodapé) */}
        <div className="shrink-0 flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isProcessing}>
            <X size={16} className="mr-1.5" /> Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isProcessing}>
            <Check size={16} className="mr-1.5" /> {isProcessing ? 'Processando...' : 'Confirmar imagem'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
