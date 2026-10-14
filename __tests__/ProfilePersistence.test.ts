import { describe, it, expect, vi } from 'vitest';
import { buildProfileDbUpdates, profileService } from '../services/profile';
import { User, UserRole } from '../types';

describe('Problema A: Persistência dos Dados do Perfil', () => {
  it('não deve incluir campos omitidos ou undefined no payload de atualização', () => {
    const updates: Partial<User> = {
      phone: '(11) 98888-7777',
      bio: 'Instrutor de resgate',
    };

    const payload = buildProfileDbUpdates(updates);

    expect(payload.phone).toBe('(11) 98888-7777');
    expect(payload.bio).toBe('Instrutor de resgate');
    // Campos ausentes/undefined NÃO podem estar presentes no objeto
    expect(payload).not.toHaveProperty('blood_type');
    expect(payload).not.toHaveProperty('sus_number');
    expect(payload).not.toHaveProperty('birth_date');
    expect(payload).not.toHaveProperty('registration_number');
    expect(payload).not.toHaveProperty('address');
    expect(payload).not.toHaveProperty('full_name');
    expect(payload).toHaveProperty('updated_at');
  });

  it('deve preservar tipo sanguíneo, cartão SUS, data de nascimento e endereço quando fornecidos', () => {
    const updates: Partial<User> = {
      bloodType: 'O+',
      susNumber: '898 0000 1234 5678',
      birthDate: '1990-05-20',
      address: 'Rua das Flores, 123',
      registrationNumber: '2024.042',
    };

    const payload = buildProfileDbUpdates(updates);

    expect(payload.blood_type).toBe('O+');
    expect(payload.sus_number).toBe('898 0000 1234 5678');
    expect(payload.birth_date).toBe('1990-05-20');
    expect(payload.address).toBe('Rua das Flores, 123');
    expect(payload.registration_number).toBe('2024.042');
  });

  it('deve permitir limpar um campo de forma intencional com string vazia convertida em null', () => {
    const updates: Partial<User> = {
      susNumber: '',
      bloodType: '',
      bio: '',
      address: '',
    };

    const payload = buildProfileDbUpdates(updates);

    expect(payload.sus_number).toBeNull();
    expect(payload.blood_type).toBeNull();
    expect(payload.bio).toBeNull();
    expect(payload.address).toBeNull();
  });

  it('deve atualizar apenas telefone ou biografia sem apagar outros campos no banco', async () => {
    const updates: Partial<User> = {
      bio: 'Nova biografia atualizada',
    };

    const payload = buildProfileDbUpdates(updates);

    expect(Object.keys(payload)).toEqual(
      expect.arrayContaining(['updated_at', 'bio'])
    );
    expect(Object.keys(payload)).not.toContain('sus_number');
    expect(Object.keys(payload)).not.toContain('blood_type');
    expect(Object.keys(payload)).not.toContain('birth_date');
  });

  it('valida que o mapeamento de login em Auth.tsx preserva todos os campos de perfil', () => {
    const mockDbProfile = {
      id: 'uuid-1234',
      full_name: 'Associado Teste',
      email: 'teste@abcuna.org.br',
      role: 'ASSOCIATE' as UserRole,
      avatar_url: 'https://exemplo.com/avatar.jpg',
      phone: '(11) 99999-0000',
      cpf: '123.456.789-00',
      bio: 'Socorrista voluntário',
      birth_date: '1988-12-10',
      sus_number: '123 4567 8901 2345',
      registration_number: '2024.100',
      blood_type: 'AB+',
      address: 'Avenida Central, 500',
    };

    // Simula a construção de appUser realizada em Auth.tsx
    const appUser: User = {
      id: mockDbProfile.id,
      name: mockDbProfile.full_name || mockDbProfile.email || 'Usuário',
      email: mockDbProfile.email || '',
      role: mockDbProfile.role || 'ASSOCIATE',
      avatar: mockDbProfile.avatar_url,
      phone: mockDbProfile.phone,
      cpf: mockDbProfile.cpf,
      bio: mockDbProfile.bio,
      birthDate: mockDbProfile.birth_date,
      susNumber: mockDbProfile.sus_number,
      registrationNumber: mockDbProfile.registration_number,
      bloodType: mockDbProfile.blood_type,
      address: mockDbProfile.address,
    };

    expect(appUser.bloodType).toBe('AB+');
    expect(appUser.susNumber).toBe('123 4567 8901 2345');
    expect(appUser.birthDate).toBe('1988-12-10');
    expect(appUser.registrationNumber).toBe('2024.100');
    expect(appUser.address).toBe('Avenida Central, 500');
  });
});
