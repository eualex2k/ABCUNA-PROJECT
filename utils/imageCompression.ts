/**
 * Utilitário para compressão de imagens no lado do cliente.
 * Reduz o tamanho de arquivos antes do upload para economizar espaço no Supabase.
 */

export const compressImage = async (file: File, maxWidth = 1920, quality = 0.75): Promise<File | Blob> => {
    // Se não for imagem, retorna o arquivo original
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Se o arquivo for pequeno (menos de 300KB), não precisa comprimir
    if (file.size < 300 * 1024) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Redimensionar se for maior que o maxWidth
                if (width > maxWidth) {
                    height = (maxWidth * height) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context not available'));

                // Desenhar imagem no canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Exportar como WebP ou JPEG comprimido
                // WebP é mais eficiente, mas JPEG tem melhor suporte
                const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            // Criar um novo arquivo a partir do blob para manter o nome original
                            const compressedFile = new File([blob], file.name, {
                                type: outputType,
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    outputType,
                    quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};
