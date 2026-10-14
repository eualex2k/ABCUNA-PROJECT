import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { ToastProvider, useToast } from '../components/ToastContext';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const TestComponent: React.FC = () => {
  const { showToast, success, error, warning, info, clearAll } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Mensagem Genérica')}>Toast Padrão</button>
      <button onClick={() => success('Operação realizada com sucesso')}>Toast Sucesso</button>
      <button onClick={() => error('O comprovante não pode ter mais que 5MB.')}>Toast Erro</button>
      <button onClick={() => warning('Aviso importante')}>Toast Aviso</button>
      <button onClick={() => info('Informação do sistema')}>Toast Info</button>
      <button
        onClick={() => {
          showToast('Toast 1');
          showToast('Toast 2');
          showToast('Toast 3');
          showToast('Toast 4 (Fila)');
          showToast('Toast 5 (Fila)');
        }}
      >
        Disparar 5 Toasts
      </button>
      <button onClick={clearAll}>Limpar Todos</button>
    </div>
  );
};

describe('Mecanismo Global de Notificações (Toast)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renderiza uma notificação ao acionar o hook', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Toast Sucesso'));
    });
    expect(screen.getByText('Operação realizada com sucesso')).toBeTruthy();
  });

  it('permite fechar manualmente a notificação ao clicar no botão ×', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Toast Erro'));
    });
    expect(screen.getByText('O comprovante não pode ter mais que 5MB.')).toBeTruthy();

    const closeButton = screen.getByRole('button', { name: /fechar notificação/i });
    act(() => {
      fireEvent.click(closeButton);
    });

    expect(screen.queryByText('O comprovante não pode ter mais que 5MB.')).toBeNull();
  });

  it('fecha automaticamente a notificação após o tempo estipulado', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Toast Sucesso'));
    });
    expect(screen.getByText('Operação realizada com sucesso')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Operação realizada com sucesso')).toBeNull();
  });

  it('mantém erros visíveis por mais tempo do que sucessos', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Toast Erro'));
    });
    expect(screen.getByText('O comprovante não pode ter mais que 5MB.')).toBeTruthy();

    // Com 5 segundos, o erro ainda deve estar visível
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('O comprovante não pode ter mais que 5MB.')).toBeTruthy();

    // Após 8 segundos, o erro fecha
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.queryByText('O comprovante não pode ter mais que 5MB.')).toBeNull();
  });

  it('limita a 3 notificações visíveis e gerencia a fila sem descartar', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Disparar 5 Toasts'));
    });

    // Devem aparecer exatamente 3 visíveis inicialmente
    expect(screen.getByText('Toast 1')).toBeTruthy();
    expect(screen.getByText('Toast 2')).toBeTruthy();
    expect(screen.getByText('Toast 3')).toBeTruthy();
    expect(screen.queryByText('Toast 4 (Fila)')).toBeNull();
    expect(screen.queryByText('Toast 5 (Fila)')).toBeNull();

    // Fecha o primeiro toast manualmente
    const closeButtons = screen.getAllByRole('button', { name: /fechar notificação/i });
    act(() => {
      fireEvent.click(closeButtons[0]);
    });

    // O Toast 4 deve ser promovido da fila para os visíveis
    expect(screen.getByText('Toast 4 (Fila)')).toBeTruthy();
    expect(screen.queryByText('Toast 5 (Fila)')).toBeNull();

    // Fecha o segundo toast
    const nextCloseButtons = screen.getAllByRole('button', { name: /fechar notificação/i });
    act(() => {
      fireEvent.click(nextCloseButtons[0]);
    });

    // O Toast 5 deve ser promovido da fila
    expect(screen.getByText('Toast 5 (Fila)')).toBeTruthy();
  });

  it('pausa o temporizador quando o usuário passa o mouse por cima do toast', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Toast Padrão'));
    });
    const alertElement = screen.getByRole('alert');

    // Avança 2 segundos
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Usuário passa o mouse por cima
    act(() => {
      fireEvent.mouseEnter(alertElement);
    });

    // Passam-se 10 segundos com o mouse sobre o toast
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Deve continuar visível!
    expect(screen.getByText('Mensagem Genérica')).toBeTruthy();

    // Usuário retira o mouse
    act(() => {
      fireEvent.mouseLeave(alertElement);
    });

    // Após o tempo restante, o toast fecha
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Mensagem Genérica')).toBeNull();
  });
});
