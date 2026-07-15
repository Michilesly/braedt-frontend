import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './account.component.html',
  styleUrls: []
})
export class AccountComponent implements OnInit, OnDestroy {
  public viewState: 'login' | 'register' | 'profile' = 'login';
  public currentUser: User | null = null;
  public isLoading: boolean = false;
  
  // Mensajes de feedback
  public loginError: string | null = null;
  public registerError: string | null = null;
  public registerSuccess: boolean = false;

  // Formularios
  public loginForm!: FormGroup;
  public registerForm!: FormGroup;
  public profileForm!: FormGroup;

  // Edición de perfil
  public isEditingProfile: boolean = false;
  public profileError: string | null = null;
  public profileSuccess: boolean = false;

  // Visibilidad de contraseñas
  public showLoginPasswordFlag: boolean = false;
  public showRegisterPasswordFlag: boolean = false;
  public showRegisterConfirmPasswordFlag: boolean = false;

  // RUC / Datos de Empresa condicionales
  public isCorporateAccount: boolean = false;

  private userSub!: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.viewState = 'profile';
      } else if (this.viewState === 'profile') {
        this.viewState = 'login';
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  private initForms(): void {
    // Formulario de Inicio de Sesión
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });

    // Formulario de Registro
    // La expresión regular valida: al menos 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial
    const passwordPattern = '(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\\W_]).{8,}';
    
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      isCompany: [false],
      ruc: ['', [Validators.pattern('^[0-9]{11}$')]],
      companyName: [''],
      password: ['', [Validators.required, Validators.pattern(passwordPattern)]],
      confirmPassword: ['', [Validators.required]],
      agreeTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: [this.passwordMatchValidator, this.rucRequiredValidator]
    });

    // Formulario de Edición de Perfil
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      address: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  // Validador personalizado: comprobar que las contraseñas coincidan
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    if (password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Validador personalizado: si isCompany es true, RUC y Razón Social son requeridos
  private rucRequiredValidator(control: AbstractControl): ValidationErrors | null {
    const isCompany = control.get('isCompany')?.value;
    const ruc = control.get('ruc')?.value;
    const companyName = control.get('companyName')?.value;

    if (isCompany) {
      let errors: any = null;
      if (!ruc || ruc.trim() === '') {
        control.get('ruc')?.setErrors({ requiredIfCompany: true });
        errors = { ...errors, rucRequired: true };
      }
      if (!companyName || companyName.trim() === '') {
        control.get('companyName')?.setErrors({ requiredIfCompany: true });
        errors = { ...errors, companyNameRequired: true };
      }
      return errors;
    }
    return null;
  }

  // Alternar vista
  public switchView(state: 'login' | 'register' | 'profile'): void {
    this.viewState = state;
    this.loginError = null;
    this.registerError = null;
    this.registerSuccess = false;
    
    if (state === 'login') {
      this.loginForm.reset({ rememberMe: false });
    } else if (state === 'register') {
      this.registerForm.reset({ isCompany: false, agreeTerms: false });
      this.isCorporateAccount = false;
    }
  }

  // Alternar visibilidad de contraseña
  public togglePasswordVisibility(field: 'login' | 'register' | 'registerConfirm'): void {
    if (field === 'login') {
      this.showLoginPasswordFlag = !this.showLoginPasswordFlag;
    } else if (field === 'register') {
      this.showRegisterPasswordFlag = !this.showRegisterPasswordFlag;
    } else if (field === 'registerConfirm') {
      this.showRegisterConfirmPasswordFlag = !this.showRegisterConfirmPasswordFlag;
    }
  }

  // Detectar cambio de tipo de cuenta (Persona o Empresa)
  public onCompanyToggle(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.isCorporateAccount = checkbox.checked;
    
    const rucControl = this.registerForm.get('ruc');
    const companyNameControl = this.registerForm.get('companyName');

    if (!this.isCorporateAccount) {
      rucControl?.reset();
      companyNameControl?.reset();
      rucControl?.setErrors(null);
      companyNameControl?.setErrors(null);
    }
  }

  // Procesar Login
  public onLogin(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isLoading = true;
    this.loginError = null;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.isLoading = false;
        console.log('Login exitoso:', user);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.loginError = err.message || 'Error al iniciar sesión.';
        this.cdr.detectChanges();
      }
    });
  }

  // Procesar Registro
  public onRegister(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading = true;
    this.registerError = null;
    
    const formValue = this.registerForm.value;
    const registerData = {
      name: formValue.isCompany ? formValue.companyName : formValue.name,
      email: formValue.email,
      password: formValue.password,
      phone: formValue.phone,
      ruc: formValue.isCompany ? formValue.ruc : undefined,
      companyName: formValue.isCompany ? formValue.companyName : undefined
    };

    this.authService.register(registerData).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.registerSuccess = true;
        console.log('Registro exitoso:', user);
        this.cdr.detectChanges();
        // El servicio de autenticación inicia sesión automáticamente tras registrarse,
        // por lo que el OnInit se disparará y cambiará a la vista de perfil.
      },
      error: (err) => {
        this.isLoading = false;
        this.registerError = err.message || 'Error al registrar la cuenta.';
        this.cdr.detectChanges();
      }
    });
  }

  // Cerrar Sesión
  public onLogout(): void {
    this.authService.logout();
  }

  // Utilidad para marcar campos como interactuados si intentan hacer submit sin rellenar
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      control.markAsDirty();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Iniciar la edición de perfil
  public startEditing(): void {
    this.isEditingProfile = true;
    this.profileSuccess = false;
    this.profileError = null;
    this.profileForm.patchValue({
      name: this.currentUser?.name ?? '',
      phone: this.currentUser?.phone ?? '',
      address: this.currentUser?.address ?? ''
    });
  }

  // Cancelar la edición de perfil
  public cancelEditing(): void {
    this.isEditingProfile = false;
    this.profileError = null;
  }

  // Guardar cambios del perfil
  public onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isLoading = true;
    this.profileError = null;
    this.profileSuccess = false;
    const { name, phone, address } = this.profileForm.value;

    this.authService.updateProfile(name, phone, address).subscribe({
      next: (updatedUser) => {
        this.isLoading = false;
        this.profileSuccess = true;
        this.isEditingProfile = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.profileError = err.message || 'Error al actualizar el perfil.';
        this.cdr.detectChanges();
      }
    });
  }

  // Métodos getter para facilitar el acceso en el template HTML
  get lf() { return this.loginForm.controls; }
  get rf() { return this.registerForm.controls; }
  get pf() { return this.profileForm.controls; }
}