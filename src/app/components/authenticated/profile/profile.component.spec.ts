import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toastService';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { expect } from '@jest/globals';

// --- Mocks para Servicios ---

// 1. Mock para UserService (Simula llamadas al API)
class MockUserService {
  // Retorna un perfil simulado (importante que tenga el array de badges)
  getProfile = jest.fn().mockReturnValue(of({
    user_id: 1,
    name: 'Luis Prueba',
    email: 'luis@test.com',
    status: 'activo',
    profile_picture_url: null,
    badges: [], // Array vacío por defecto
  }));
  uploadPictureSubject = new Subject<any>();
  uploadProfilePicture = jest.fn().mockReturnValue(this.uploadPictureSubject.asObservable());
  deleteProfilePicture = jest.fn().mockReturnValue(of({}));
  deleteMyAccount = jest.fn().mockReturnValue(of({ message: 'Deleted' }));
}

// 2. Mock para AuthService
class MockAuthService {
  updateUserProfile = jest.fn();
}

// 3. Mock para ToastService (Para espiar si se muestran mensajes)
class MockToastService {
  showToast = jest.fn();
}

// 4. Mock para Router
class MockRouter {
  navigate = jest.fn();
}

// --- Inicio de Pruebas ---

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let userService: MockUserService;
  let authService: MockAuthService;
  let toastService: MockToastService;
  let router: MockRouter;

  beforeEach(async () => {
    // 💥 Configuración del TestBed
    await TestBed.configureTestingModule({
      imports: [ProfileComponent], // El componente es standalone
      providers: [
        { provide: UserService, useClass: MockUserService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: ToastService, useClass: MockToastService },
        { provide: Router, useClass: MockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;

    // Inyectar los mocks para espiar y controlar
    userService = TestBed.inject(UserService) as unknown as MockUserService;
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    toastService = TestBed.inject(ToastService) as unknown as MockToastService;
    router = TestBed.inject(Router) as unknown as MockRouter;
    
    // Ejecutar ngOnInit que llama a getUserInfo
    fixture.detectChanges();
  });

  it('should create and load user profile on init', () => {
    expect(component).toBeTruthy();
    expect(userService.getProfile).toHaveBeenCalled();
    expect(component.userProfile.name).toBe('Luis Prueba');
  });

  // ====================================================================
  // Prueba de Renderizado de Insignias
  // ====================================================================

  it('should render "No tienes insignias aún" when badge list is empty', () => {
    // Estado inicial: userProfile.badges es [] (mocked)
    const noBadgesElement = fixture.debugElement.query(By.css('.italic'));
    expect(noBadgesElement.nativeElement.textContent).toContain('No tienes insignias aún.');
  });

  it('should render badges and total count when badges are present', fakeAsync(() => {
    const mockBadges = [
      { id: 1, name: 'Comprador Express', icon_url: 'img1.png', description: '', category: '', obtained_at: '', product_category: null },
      { id: 2, name: 'Coleccionista', icon_url: 'img2.png', description: '', category: '', obtained_at: '', product_category: 'Electrónica' },
      { id: 3, name: 'Veterano', icon_url: 'img3.png', description: '', category: '', obtained_at: '', product_category: null },
      { id: 4, name: 'Madrugador', icon_url: 'img4.png', description: '', category: '', obtained_at: '', product_category: null },
      { id: 5, name: 'Experto', icon_url: 'img5.png', description: '', category: '', obtained_at: '', product_category: null },
    ];
    
    // 1. Sobrescribir el mock para simular la respuesta con insignias
    userService.getProfile.mockReturnValue(of({
        user_id: 1, name: 'Luis', email: 'luis@test.com', status: 'activo', badges: mockBadges,
    }));
    
    // 2. Recargar el componente para que use el nuevo mock
    component.ngOnInit();
    tick(); // Simula el paso del tiempo para que el observable se resuelva
    fixture.detectChanges(); // Actualiza la vista con los nuevos datos

    // Verificar el contador total
    const badgeCountElement = fixture.debugElement.query(By.css('span.font-semibold'));
    expect(badgeCountElement.nativeElement.textContent).toContain('Insignias (5)');

    // Verificar que solo se renderizan 4 insignias (slice:0:4)
    const badgeIcons = fixture.debugElement.queryAll(By.css('.group.relative.flex-shrink-0'));
    expect(badgeIcons.length).toBe(4);
    
    // Verificar que el indicador de más insignias está presente
    const moreBadgesIndicator = fixture.debugElement.query(By.css('.w-14.h-14.bg-gray-100'));
    expect(moreBadgesIndicator).not.toBeNull();
    expect(moreBadgesIndicator.nativeElement.textContent.trim()).toBe('+1'); // 5 total - 4 mostradas = 1

    // Verificar el Tooltip con product_category
    const badge2Icon = badgeIcons[1]; // La segunda insignia (Coleccionista, con categoría)
    expect(badge2Icon.nativeElement.innerHTML).toContain('Categoría: Electrónica');
  }));

  // ====================================================================
  // Pruebas de Funcionalidad de Foto de Perfil
  // ====================================================================

  it('should show options modal when profile picture button is clicked', () => {
    expect(component.showOptionsModal).toBe(false);
    
    // Simular click en el botón (iniciales o foto)
    const button = fixture.debugElement.query(By.css('.h-24.w-24.rounded-full')).nativeElement;
    button.click();
    fixture.detectChanges();

    expect(component.showOptionsModal).toBe(true);
    const modal = fixture.debugElement.query(By.css('.options-modal'));
    expect(modal).not.toBeNull();
  });

  it('should show and hide loading spinner during picture upload', fakeAsync(() => {
    const mockFile = new File(['file content'], 'test.jpg', { type: 'image/jpeg' });
    component.selectedFile = mockFile;
    
    // 1. Llamar al método de subida
    component.uploadProfilePicture();
    
    // 2. VERIFICAR ESTADO INICIAL (isUploading = true)
    // No hay necesidad de tick() o flushMicrotasks() porque es una asignación síncrona
    expect(component.isUploading).toBe(true); 
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.fa-spinner'))).not.toBeNull(); // El spinner está visible

    // 3. SIMULAR RESPUESTA DEL SERVIDOR
    const mockResponse = { profile_picture_url: 'new-url.jpg' };
    (userService.uploadPictureSubject as Subject<any>).next(mockResponse);
    
    // 4. Forzar el paso del tiempo para que la suscripción se resuelva
    tick(); 
    fixture.detectChanges();

    // 5. VERIFICAR ESTADO FINAL (isUploading = false)
    expect(component.isUploading).toBe(false);
    expect(fixture.debugElement.query(By.css('.fa-spinner'))).toBeNull(); // El spinner ya no está
    expect(toastService.showToast).toHaveBeenCalledWith('Foto de perfil actualizada exitosamente', 'success');
  }));
  
  it('should call deleteProfilePicture and update profile on success', () => {
    component.userProfile.profile_picture_url = 'test.jpg'; // Simular que hay foto
    component.deleteProfilePicture();

    expect(userService.deleteProfilePicture).toHaveBeenCalled();
    expect(component.userProfile.profile_picture_url).toBeNull();
    expect(authService.updateUserProfile).toHaveBeenCalled();
    expect(toastService.showToast).toHaveBeenCalledWith('Foto de perfil eliminada exitosamente', 'success');
  });

  // ====================================================================
  // Pruebas de Navegación (Tabs)
  // ====================================================================

  it('should change activeTab when a tab button is clicked', () => {
    const addressesButton = fixture.debugElement.queryAll(By.css('nav button'))[1].nativeElement;
    
    addressesButton.click();
    fixture.detectChanges();

    expect(component.activeTab).toBe('addresses');

    // Verificar que el componente app-addresses se muestra
    expect(fixture.debugElement.query(By.css('app-addresses'))).not.toBeNull();
    // Verificar que app-personal-info se oculta
    expect(fixture.debugElement.query(By.css('app-personal-info'))).toBeNull();
  });

  // ====================================================================
  // Pruebas de Eliminación de Cuenta
  // ====================================================================
  
  it('should show confirmation toast when delete account is clicked', () => {
    const deleteButton = fixture.debugElement.query(By.css('button.text-light-danger')).nativeElement;
    deleteButton.click();
    
    expect(toastService.showToast).toHaveBeenCalledWith(
      expect.stringContaining('eliminar tu cuenta'),
      'warning',
      'Confirmar',
      expect.any(Function) // Esperamos que pase una función de callback
    );
  });
  
  it('should delete account and navigate to login when confirmed', fakeAsync(() => {
    // 1. Llamar al método deleteAccount
    component.deleteAccount();

    // 2. Ejecutar la función de callback del ToastService (el 4to argumento)
    const callback = toastService.showToast.mock.calls[0][3];
    callback();
    tick(); // Simular la respuesta del servicio

    // Verificaciones
    expect(userService.deleteMyAccount).toHaveBeenCalled();
    expect(toastService.showToast).toHaveBeenCalledWith(expect.any(String), 'success');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should handle error when deleting account fails', fakeAsync(() => {
    userService.deleteMyAccount.mockReturnValue(throwError(() => ({ error: { message: 'Error de BD' } })));
    component.deleteAccount();

    const callback = toastService.showToast.mock.calls[0][3];
    callback();
    tick();

    expect(toastService.showToast).toHaveBeenCalledWith('Error de BD', 'error');
    expect(router.navigate).not.toHaveBeenCalled();
  }));

  // ====================================================================
  // PRUEBAS DE NIVEL VIP (Borde y Renderizado)
  // ====================================================================
  describe('VIP Level Border', () => {
    
    it('should apply yellow border for Oro level', () => {
      userService.getProfile.mockReturnValue(of({
        user_id: 1,
        name: 'Ana Oro',
        email: 'ana@oro.com',
        vip_level: 'Oro',
        // Es necesario simular que tiene una foto para que se use el <button> que seleccionaremos
        profile_picture_url: 'oro.jpg', 
        badges: []
      }));
      component.ngOnInit();
      fixture.detectChanges();

      // [CORRECCIÓN] Usar un selector de atributo válido
      const borderDiv = fixture.debugElement.query(By.css('[data-testid="vip-border-image"]'));
      const classes = borderDiv.nativeElement.classList;

      expect(classes).toContain('border-yellow-500');
      expect(classes).toContain('dark:border-yellow-400');
    });

    it('should apply gray border for Plata level', () => {
      userService.getProfile.mockReturnValue(of({
        user_id: 2,
        name: 'Beto Plata',
        vip_level: 'Plata',
        profile_picture_url: 'plata.jpg', 
        badges: []
      }));
      component.ngOnInit();
      fixture.detectChanges();

      // [CORRECCIÓN] Usar un selector de atributo válido
      const classes = fixture.debugElement
        .query(By.css('[data-testid="vip-border-image"]')) 
        .nativeElement.classList;

      expect(classes).toContain('border-gray-400');
      expect(classes).toContain('dark:border-gray-500');
    });

    it('should apply amber border for Bronce level', () => {
      userService.getProfile.mockReturnValue(of({
        user_id: 3,
        name: 'Carlos Bronce',
        vip_level: 'Bronce',
        profile_picture_url: 'bronce.jpg', 
        badges: []
      }));
      component.ngOnInit();
      fixture.detectChanges();

      // [CORRECCIÓN] Usar un selector de atributo válido
      const classes = fixture.debugElement
        .query(By.css('[data-testid="vip-border-image"]')) 
        .nativeElement.classList;

      expect(classes).toContain('border-amber-700');
      expect(classes).toContain('dark:border-amber-800');
    });

    it('should have transparent border when vip_level is null', () => {
      userService.getProfile.mockReturnValue(of({
        user_id: 4,
        name: 'Diana Sin Nivel',
        vip_level: null,
        profile_picture_url: 'no_vip.jpg', 
        badges: []
      }));
      component.ngOnInit();
      fixture.detectChanges();

      // [CORRECCIÓN] Usar un selector de atributo válido
      const classes = fixture.debugElement
        .query(By.css('[data-testid="vip-border-image"]')) 
        .nativeElement.classList;

      expect(classes).toContain('border-transparent');
    });

    it('should call getVipBorderClass() and return correct class string (unit test)', () => {
      // ... (Este test está bien porque no depende del DOM) ...
      component.userProfile = { vip_level: 'Oro' };
      expect(component.getVipBorderClass()).toBe('border-yellow-500 dark:border-yellow-400');

      component.userProfile = { vip_level: 'Plata' };
      expect(component.getVipBorderClass()).toBe('border-gray-400 dark:border-gray-500');

      component.userProfile = { vip_level: 'Bronce' };
      expect(component.getVipBorderClass()).toBe('border-amber-700 dark:border-amber-800');

      component.userProfile = { vip_level: null };
      expect(component.getVipBorderClass()).toBe('border-transparent dark:border-transparent');
    });
  });

  // Limpieza
  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });
});