import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { User, RegisterRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_STORAGE_KEY = 'braedt_registered_users';
  private readonly ACTIVE_USER_STORAGE_KEY = 'braedt_logged_in_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Memoria en caché para entornos sin localStorage (ej. pruebas en node, SSR)
  private memoryStorage: { [key: string]: string } = {};

  constructor() {
    this.initializeMockUsers();
    this.loadActiveSession();
  }

  private getItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return this.memoryStorage[key] || null;
  }

  private setItem(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    } else {
      this.memoryStorage[key] = value;
    }
  }

  private removeItem(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    } else {
      delete this.memoryStorage[key];
    }
  }

  private initializeMockUsers(): void {
    const defaultUsers = [
      {
        id: 'usr_1',
        name: 'Distribuidora Alimentos SAC',
        email: 'contacto@distribuidora.pe',
        password: 'Password123!',
        ruc: '20601234567',
        companyName: 'Distribuidora Alimentos SAC',
        phone: '987654321',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_2',
        name: 'Juan Pérez',
        email: 'juan.perez@gmail.com',
        password: 'User2026!',
        phone: '912345678',
        createdAt: new Date().toISOString()
      },
      // Nuevos usuarios regulares UPC solicitados
      {
        id: 'usr_upc_1',
        name: 'Estudiante UPC 1',
        email: 'U202423237@upc.edu.pe',
        password: 'Upc2026!',
        phone: '900000001',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_upc_2',
        name: 'Estudiante UPC 2',
        email: 'U202417809@upc.edu.pe',
        password: 'Upc2026!',
        phone: '900000002',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_upc_3',
        name: 'Estudiante UPC 3',
        email: 'U202320586@upc.edu.pe',
        password: 'Upc2026!',
        phone: '900000003',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_upc_4',
        name: 'Estudiante UPC 4',
        email: 'U20231A109@upc.edu.pe',
        password: 'Upc2026!',
        phone: '900000004',
        createdAt: new Date().toISOString()
      },
      {
        id: 'usr_upc_5',
        name: 'Estudiante UPC 5',
        email: 'U201422234@upc.edu.pe',
        password: 'Upc2026!',
        phone: '900000005',
        createdAt: new Date().toISOString()
      }
    ];

    const storedUsersStr = this.getItem(this.USERS_STORAGE_KEY);
    if (!storedUsersStr) {
      this.setItem(this.USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    } else {
      // Si ya existen usuarios guardados, añadimos únicamente los nuevos para no pisar registros
      try {
        const storedUsers = JSON.parse(storedUsersStr);
        let updated = false;
        for (const defaultUser of defaultUsers) {
          const exists = storedUsers.some((u: any) => u.email.toLowerCase() === defaultUser.email.toLowerCase());
          if (!exists) {
            storedUsers.push(defaultUser);
            updated = true;
          }
        }
        if (updated) {
          this.setItem(this.USERS_STORAGE_KEY, JSON.stringify(storedUsers));
        }
      } catch (e) {
        this.setItem(this.USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
      }
    }
  }

  private loadActiveSession(): void {
    try {
      const activeUserStr = this.getItem(this.ACTIVE_USER_STORAGE_KEY);
      if (activeUserStr) {
        this.currentUserSubject.next(JSON.parse(activeUserStr));
      }
    } catch (e) {
      console.error('Error al cargar la sesión activa:', e);
      this.removeItem(this.ACTIVE_USER_STORAGE_KEY);
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  /**
   * Simula el inicio de sesión
   */
  public login(email: string, password: string): Observable<User> {
    try {
      const registeredUsers = JSON.parse(this.getItem(this.USERS_STORAGE_KEY) ?? '[]');
      const user = registeredUsers.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return throwError(() => new Error('El correo electrónico no está registrado.'));
      }

      if (user.password !== password) {
        return throwError(() => new Error('Contraseña incorrecta. Por favor, inténtalo de nuevo.'));
      }

      // Crear el objeto User sin la contraseña para guardar en sesión
      const sessionUser: User = {
        id: user.id,
        name: user.name,
        email: user.email,
        ruc: user.ruc,
        companyName: user.companyName,
        phone: user.phone,
        address: user.address,
        createdAt: user.createdAt
      };

      // Simular latencia de red (500ms)
      return of(sessionUser).pipe(
        delay(500),
        tap(u => {
          this.setItem(this.ACTIVE_USER_STORAGE_KEY, JSON.stringify(u));
          this.currentUserSubject.next(u);
        })
      );
    } catch (e) {
      return throwError(() => new Error('Error al procesar el inicio de sesión.'));
    }
  }

  /**
   * Simula el registro de un nuevo usuario
   */
  public register(request: RegisterRequest & { password?: string }): Observable<User> {
    try {
      const registeredUsers = JSON.parse(this.getItem(this.USERS_STORAGE_KEY) ?? '[]');
      const emailExists = registeredUsers.some((u: any) => u.email.toLowerCase() === request.email.toLowerCase());

      if (emailExists) {
        return throwError(() => new Error('El correo electrónico ya se encuentra registrado.'));
      }

      const newId = 'usr_' + (registeredUsers.length + 1) + '_' + Math.random().toString(36).substring(2, 7);
      const newUser = {
        id: newId,
        name: request.name,
        email: request.email,
        password: request.password || 'Temporary123!',
        ruc: request.ruc,
        companyName: request.companyName || request.name,
        phone: request.phone,
        address: request.address,
        createdAt: new Date().toISOString()
      };

      // Agregar a la lista de usuarios registrados
      registeredUsers.push(newUser);
      this.setItem(this.USERS_STORAGE_KEY, JSON.stringify(registeredUsers));

      const sessionUser: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        ruc: newUser.ruc,
        companyName: newUser.companyName,
        phone: newUser.phone,
        address: newUser.address,
        createdAt: newUser.createdAt
      };

      // Simular latencia de red (800ms)
      return of(sessionUser).pipe(
        delay(800),
        tap(u => {
          this.setItem(this.ACTIVE_USER_STORAGE_KEY, JSON.stringify(u));
          this.currentUserSubject.next(u);
        })
      );
    } catch (e) {
      return throwError(() => new Error('Error al procesar el registro de usuario.'));
    }
  }

  /**
   * Simula la actualización del perfil de usuario
   */
  public updateProfile(name: string, phone: string, address: string): Observable<User> {
    try {
      const activeUser = this.currentUserValue;
      if (!activeUser) {
        return throwError(() => new Error('No hay sesión activa.'));
      }

      const registeredUsers = JSON.parse(this.getItem(this.USERS_STORAGE_KEY) ?? '[]');
      const userIndex = registeredUsers.findIndex((u: any) => u.id === activeUser.id);

      if (userIndex === -1) {
        return throwError(() => new Error('Usuario no encontrado.'));
      }

      // Actualizar campos en el "servidor"
      registeredUsers[userIndex].name = name;
      registeredUsers[userIndex].phone = phone;
      registeredUsers[userIndex].address = address;
      
      // Si es empresa, actualizamos el nombre corporativo también si coincide con el original
      if (registeredUsers[userIndex].ruc && registeredUsers[userIndex].companyName === activeUser.name) {
        registeredUsers[userIndex].companyName = name;
      }

      this.setItem(this.USERS_STORAGE_KEY, JSON.stringify(registeredUsers));

      const updatedUser: User = {
        ...activeUser,
        name,
        phone,
        address,
        companyName: registeredUsers[userIndex].companyName
      };

      // Simular latencia de red (400ms)
      return of(updatedUser).pipe(
        delay(400),
        tap(u => {
          this.setItem(this.ACTIVE_USER_STORAGE_KEY, JSON.stringify(u));
          this.currentUserSubject.next(u);
        })
      );
    } catch (e) {
      return throwError(() => new Error('Error al actualizar el perfil.'));
    }
  }

  /**
   * Cierra la sesión activa
   */
  public logout(): void {
    this.removeItem(this.ACTIVE_USER_STORAGE_KEY);
    this.currentUserSubject.next(null);
  }
}
