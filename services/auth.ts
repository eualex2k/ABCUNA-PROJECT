import { UserRole, User } from '../types';
import { accessCodeService } from './accessCodes';

export const mockLogin = async (email: string, code: string, isRegister: boolean = false): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // For Registration: Strict validation against AccessCodeService
      if (isRegister) {
        const validation = accessCodeService.validate(code);
        
        if (!validation.valid) {
          reject(new Error(validation.message));
          return;
        }

        // Consume the code
        if (validation.codeId) {
          accessCodeService.consume(validation.codeId);
        }

        resolve({
          id: Math.random().toString(36).substr(2, 9),
          name: email.split('@')[0].toUpperCase(),
          email: email,
          role: validation.role!, // Role comes from the code
          avatar: `https://ui-avatars.com/api/?name=${email}&background=random`
        });
      } else {
        // For Login: Simplified for demo (in real app, would check password hash)
        // Here we just check if the code *exists* as a rudimentary password check
        
        const validation = accessCodeService.validate(code);
        
        if (validation.valid) {
           resolve({
            id: Math.random().toString(36).substr(2, 9),
            name: email.split('@')[0].toUpperCase(),
            email: email,
            role: validation.role!,
            avatar: `https://ui-avatars.com/api/?name=${email}&background=random`
          });
        } else {
           reject(new Error('Credenciais inválidas.'));
        }
      }
    }, 1000);
  });
};