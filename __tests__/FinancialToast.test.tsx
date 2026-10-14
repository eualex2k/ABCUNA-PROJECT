import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '../components/ToastContext';
import { Modal, Button } from '../components/ui';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Componente que simula a tela de Gestão de Mensalidades com modal e formulário de pagamento
const FinancialFeesModalMock: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
  initialFile?: File | null;
}> = ({ isOpen, onClose, onPaymentSuccess, initialFile = null }) => {
  const { showToast } = useToast();
  const [feeFile, setFeeFile] = React.useState<File | null>(initialFile);

  // Validação 1: Na seleção do arquivo (onChange)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      showToast('O comprovante não pode ter mais que 5MB.', 'error');
      e.target.value = '';
      setFeeFile(null);
      return;
    }
    setFeeFile(file);
  };

  // Validação 2: No processamento do pagamento (onSubmit)
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (feeFile && feeFile.size > 5 * 1024 * 1024) {
      showToast('O comprovante não pode ter mais que 5MB.', 'error');
      return;
    }
    showToast('Pagamento de mensalidade registrado com sucesso!', 'success');
    onPaymentSuccess?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestão de Mensalidades" maxWidth="4xl">
      <form onSubmit={handleProcessPayment} className="space-y-4">
        <div>
          <label htmlFor="comprovante-input">Comprovante (opcional)</label>
          <input
            id="comprovante-input"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
          />
        </div>
        <Button type="submit">Confirmar recebimento</Button>
      </form>
    </Modal>
  );
};

describe('Integração de Notificações com Modais e Validação de PDF Grande', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('valida que o Toast e o Modal usam React Portal em document.body e o Toast sobrepõe o Modal na hierarquia de z-index', () => {
    render(
      <ToastProvider>
        <FinancialFeesModalMock isOpen={true} onClose={() => {}} />
      </ToastProvider>
    );

    // 1. Confirma que o Modal está montado como Portal direto em document.body
    const modalHeading = screen.getByText('Gestão de Mensalidades');
    const modalOverlay = modalHeading.closest('.fixed.inset-0');
    expect(modalOverlay).toBeTruthy();
    expect(modalOverlay?.parentElement).toBe(document.body);

    // 2. Dispara erro de PDF grande (>5MB) na seleção
    const fileInput = screen.getByLabelText(/comprovante/i) as HTMLInputElement;
    const largePdfFile = new File(['a'.repeat(1024)], 'relatorio-comprovante-grande.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(largePdfFile, 'size', {
      value: 6 * 1024 * 1024,
    });

    act(() => {
      fireEvent.change(fileInput, { target: { files: [largePdfFile] } });
    });

    // 3. Confirma que o Toast foi renderizado via Portal direto em document.body
    const toastError = screen.getByText('O comprovante não pode ter mais que 5MB.');
    expect(toastError).toBeTruthy();

    const toastContainer = toastError.closest('[aria-live="polite"]');
    expect(toastContainer).toBeTruthy();
    expect(toastContainer?.parentElement).toBe(document.body);

    // 4. Valida hierarquia real de z-index: Toast (99999) é estritamente superior ao Modal (100)
    const toastZIndex = parseInt(window.getComputedStyle(toastContainer!).zIndex, 10);
    expect(toastZIndex).toBe(99999);
    expect(toastZIndex).toBeGreaterThan(100);

    // 5. Confirma que o input de arquivo foi limpo imediatamente após a validação
    expect(fileInput.value).toBe('');
  });

  it('bloqueia o processamento do pagamento no submit se um arquivo com mais de 5MB estiver presente', () => {
    const successCallback = vi.fn();

    const largePdfFile = new File(['a'.repeat(1024)], 'relatorio-comprovante-grande.pdf', {
      type: 'application/pdf',
    });
    Object.defineProperty(largePdfFile, 'size', {
      value: 7 * 1024 * 1024,
    });

    render(
      <ToastProvider>
        <FinancialFeesModalMock
          isOpen={true}
          onClose={() => {}}
          onPaymentSuccess={successCallback}
          initialFile={largePdfFile}
        />
      </ToastProvider>
    );

    // Tenta submeter o formulário de pagamento com o arquivo inválido
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /confirmar recebimento/i }));
    });

    // O pagamento NÃO deve ser processado
    expect(successCallback).not.toHaveBeenCalled();

    // A notificação de erro deve ser disparada
    expect(screen.getByText('O comprovante não pode ter mais que 5MB.')).toBeTruthy();
    expect(screen.queryByText('Pagamento de mensalidade registrado com sucesso!')).toBeNull();
  });

  it('exibe notificação de sucesso e permite fechar normalmente', () => {
    const successCallback = vi.fn();

    render(
      <ToastProvider>
        <FinancialFeesModalMock isOpen={true} onClose={() => {}} onPaymentSuccess={successCallback} />
      </ToastProvider>
    );

    // Submete formulário sem anexo grande
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /confirmar recebimento/i }));
    });

    expect(successCallback).toHaveBeenCalled();
    expect(screen.getByText('Pagamento de mensalidade registrado com sucesso!')).toBeTruthy();

    const closeButton = screen.getByRole('button', { name: /fechar notificação/i });
    act(() => {
      fireEvent.click(closeButton);
    });

    expect(
      screen.queryByText('Pagamento de mensalidade registrado com sucesso!')
    ).toBeNull();
  });
});
