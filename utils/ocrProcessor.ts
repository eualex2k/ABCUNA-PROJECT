import { createWorker } from 'tesseract.js';

export interface ExtractedPixData {
    amount: number | null;
    date: string | null;
    name: string | null;
    bank: string | null;
    key: string | null;
}

export interface OCRResult {
    text: string;
    extractedData: ExtractedPixData;
}

/**
 * Processa a imagem de um comprovante PIX usando Tesseract.js
 * e extrai informações estruturadas (valor, data, nome, banco, chave).
 * 
 * @param imageInput Arquivo ou base64 string da imagem
 * @param onProgress Callback opcional para reportar progresso (0 a 1)
 */
export async function processPixReceipt(
    imageInput: File | string,
    onProgress?: (progress: number) => void
): Promise<OCRResult> {
    const worker = await createWorker('por');
    
    try {
        const result = await worker.recognize(imageInput);
        const text = result.data.text;
        
        const extractedData = parsePixText(text);
        
        return {
            text,
            extractedData
        };
    } catch (error) {
        console.error('Error during OCR processing:', error);
        throw new Error('Não foi possível ler o arquivo de imagem. Verifique se o formato é válido.');
    } finally {
        await worker.terminate();
    }
}

/**
 * Analisa o texto bruto extraído pelo OCR e busca dados do comprovante PIX
 */
export function parsePixText(text: string): ExtractedPixData {
    const lines = text.split('\n').map(line => line.trim());
    
    let amount: number | null = null;
    let date: string | null = null;
    let name: string | null = null;
    let bank: string | null = null;
    let key: string | null = null;

    // 1. Extração de Valor (Amount)
    // Procuramos padrões como R$ XX,XX ou Valor XX,XX
    const amountRegex = /(?:r\$|valor(?:\s+recebido)?|total(?:\s+pago)?|pago)?\s*(\d{1,3}(?:\.\d{3})*,\d{2})/gi;
    let match;
    const amountMatches: number[] = [];
    
    while ((match = amountRegex.exec(text)) !== null) {
        const valueStr = match[1].replace(/\./g, '').replace(',', '.');
        const val = parseFloat(valueStr);
        if (!isNaN(val) && val > 0) {
            amountMatches.push(val);
        }
    }
    
    // Geralmente o maior valor ou o primeiro que aparece é o valor da transação
    if (amountMatches.length > 0) {
        amount = amountMatches[0];
    } else {
        // Fallback: tentar encontrar qualquer padrão de número decimal de dinheiro sem prefixo
        const decimalRegex = /\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g;
        const fallbackMatch = text.match(decimalRegex);
        if (fallbackMatch && fallbackMatch.length > 0) {
            amount = parseFloat(fallbackMatch[0].replace(/\./g, '').replace(',', '.'));
        }
    }

    // 2. Extração de Data
    const dateRegex = /\b(\d{2}\/\d{2}\/\d{4})\b/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
        // Converte DD/MM/AAAA para AAAA-MM-DD
        const parts = dateMatch[1].split('/');
        date = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
        // Tentar outro formato comum (AAAA-MM-DD)
        const dateISO = /\b(\d{4}-\d{2}-\d{2})\b/;
        const dateISOMatch = text.match(dateISO);
        if (dateISOMatch) {
            date = dateISOMatch[1];
        } else {
            // Data atual como fallback seguro
            date = new Date().toISOString().split('T')[0];
        }
    }

    // 3. Extração de Instituição Financeira (Banco)
    const banksList = [
        'Nubank', 'Nu Pagamentos', 'Banco do Brasil', 'BB', 'Bradesco', 'Itaú', 
        'Itau', 'Caixa', 'CEF', 'Santander', 'Inter', 'C6', 'Stone', 'Mercado Pago', 
        'PagSeguro', 'Pagbank', 'Neon', 'PicPay', 'Sicoob', 'Sicredi', 'Original', 'Cora'
    ];
    
    for (const b of banksList) {
        const regex = new RegExp(`\\b${b}\\b`, 'i');
        if (regex.test(text)) {
            bank = b === 'BB' ? 'Banco do Brasil' : b;
            break;
        }
    }

    // 4. Extração do Nome do Pagador
    const nameKeywords = [
        /pagador\s*:\s*([^\n]+)/i,
        /nome\s*:\s*([^\n]+)/i,
        /de\s*:\s*([^\n]+)/i,
        /origem\s*:\s*([^\n]+)/i,
        /enviado por\s*:\s*([^\n]+)/i,
        /cliente\s*:\s*([^\n]+)/i
    ];

    for (const regex of nameKeywords) {
        const nameMatch = text.match(regex);
        if (nameMatch && nameMatch[1]) {
            const potentialName = nameMatch[1].trim();
            if (potentialName.length > 3 && potentialName.length < 50 && !potentialName.includes('@') && !/\d{3}/.test(potentialName)) {
                name = cleanName(potentialName);
                break;
            }
        }
    }

    if (!name) {
        for (const line of lines) {
            if (/^[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(line)) {
                if (!line.includes('Comprovante') && !line.includes('Pix') && !line.includes('Transferência') && !line.includes('Realizada') && !line.includes('Banco')) {
                    name = line;
                    break;
                }
            }
        }
    }

    // 5. Extração de Chave PIX
    const keyKeywords = [
        /chave\s*(?:pix)?\s*:\s*([^\n]+)/i,
        /cnpj\s*:\s*([^\n]+)/i,
        /cpf\s*:\s*([^\n]+)/i
    ];

    for (const regex of keyKeywords) {
        const keyMatch = text.match(regex);
        if (keyMatch && keyMatch[1]) {
            key = keyMatch[1].trim();
            break;
        }
    }

    if (!key) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
        const emailMatch = text.match(emailRegex);
        if (emailMatch) {
            key = emailMatch[0];
        } else {
            const cpfCnpjRegex = /\b(?:\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/;
            const cpfCnpjMatch = text.match(cpfCnpjRegex);
            if (cpfCnpjMatch) {
                key = cpfCnpjMatch[0];
            } else {
                const phoneRegex = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9\d{4}-?\d{4}\b/;
                const phoneMatch = text.match(phoneRegex);
                if (phoneMatch) {
                    key = phoneMatch[0];
                }
            }
        }
    }

    return {
        amount,
        date,
        name: name || null,
        bank: bank || null,
        key: key || null
    };
}

function cleanName(name: string): string {
    return name
        .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
