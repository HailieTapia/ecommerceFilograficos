import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PersonalInfoComponent } from './personal-info.component';
import { UserService } from '../../../../services/user.service';
import { ToastService } from '../../../../services/toastService';
import { FormBuilder } from '@angular/forms';
import { of, throwError, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

// --- Mocks para Servicios ---
class MockUserService {
  updateProfileSubject = new Subject<any>();
  updateProfile = jest.fn().mockReturnValue(this.updateProfileSubject.asObservable());
}

class MockToastService {
  showToast = jest.fn();
}

// Datos de perfil simulados
const mockUserProfile = {
  name: 'Ana Maria Lopez',
  phone: '5512345678',
  email: 'ana@example.com',
  badges: [
    { id: 1, name: 'Coleccionista I', icon_url: 'icon1.png', description: 'Obtuvo 5 productos', category: 'Compra', obtained_at: '2024-05-15T10:00:00Z', product_category: 'Electrónica' },
    { id: 2, name: 'Comprador Exprés', icon_url: 'icon2.png', description: 'Primera compra rápida', category: 'Velocidad', obtained_at: '2024-01-20T12:00:00Z', product_category: null },
  ],
};

describe('PersonalInfoComponent', () => {
  let component: PersonalInfoComponent;
  let fixture: ComponentFixture<PersonalInfoComponent>;
  let userService: MockUserService;
  let toastService: MockToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalInfoComponent, CommonModule],
      providers: [
        FormBuilder,
        { provide: UserService, useClass: MockUserService },
        { provide: ToastService, useClass: MockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PersonalInfoComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as unknown as MockUserService;
    toastService = TestBed.inject(ToastService) as unknown as MockToastService;

    // Espiar el método 'emit' del EventEmitter para verificar llamadas
    jest.spyOn(component.profileUpdated, 'emit');

    // Simular la entrada del Input y activar ngOnChanges
    component.userProfile = mockUserProfile;
    component.ngOnChanges();
    fixture.detectChanges();
  });

  it('should create and initialize form with @Input data', () => {
    expect(component).toBeTruthy();
    expect(component.profileForm.get('name')?.value).toBe('Ana Maria Lopez');
    expect(component.profileForm.get('phone')?.value).toBe('5512345678');
    
    const emailElement = fixture.debugElement.query(By.css('.sm\\:col-span-6 span')).nativeElement;
    expect(emailElement.textContent).toContain('ana@example.com');
  });

  // ====================================================================
  // Pruebas de Renderizado de Insignias
  // ====================================================================

  it('should display the badge count correctly', () => {
    const countElement = fixture.debugElement.query(By.css('.mt-10 span.text-sm.text-light-secondary')).nativeElement;
    expect(countElement.textContent.trim()).toBe('2 insignias obtenidas');
  });

  it('should render all badges when data is present', () => {
    // 💥 CORRECCIÓN: Apuntar a la grilla de items de insignias por sus clases únicas
    const badgeElements = fixture.debugElement.queryAll(By.css('.grid.sm\\:grid-cols-2.md\\:grid-cols-4 > div')); 
    
    expect(badgeElements.length).toBe(2);
    
    // Verificar la primera insignia
    const firstBadgeName = badgeElements[0].query(By.css('h4')).nativeElement.textContent;
    expect(firstBadgeName).toBe('Coleccionista I');

    // Verificar el tooltip con product_category
    const badgeTooltipWithCategory = badgeElements[0].query(By.css('.absolute.bottom-full div[class*="mt-1"]'));
    expect(badgeTooltipWithCategory).not.toBeNull();
    expect(badgeTooltipWithCategory.nativeElement.textContent.trim()).toBe('Categoría: Electrónica');
  });
  
  // ====================================================================
  // Pruebas de Lógica de Formulario
  // ====================================================================

  it('should show error message when form is invalid on submit', () => {
    // 1. Invalidar el formulario
    component.profileForm.get('name')?.setValue('A'); // Inválido (minlength: 2)
    component.profileForm.get('phone')?.setValue(''); // Inválido (required)
    component.profileForm.markAllAsTouched();
    fixture.detectChanges();
    
    // 2. Intentar actualizar
    component.updateProfile();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Por favor, complete todos los campos correctamente.');
    expect(userService.updateProfile).not.toHaveBeenCalled();
    
    // 💥 CORRECCIÓN: Apuntar al contenedor de errores específico (el que tiene mt-1)
    const nameErrorContainer = fixture.debugElement.query(By.css('.sm\\:col-span-3 .text-light-danger.mt-1'));
    expect(nameErrorContainer).not.toBeNull();
    // Verificamos que contenga el texto del error de minlength
    expect(nameErrorContainer.nativeElement.textContent).toContain('Mínimo 2 caracteres.'); 
  });

  it('should show info toast if no changes were made', () => {
    component.updateProfile();

    expect(userService.updateProfile).not.toHaveBeenCalled();
    expect(toastService.showToast).toHaveBeenCalledWith('No se realizaron cambios en el perfil.', 'info');
  });

  it('should call userService.updateProfile with only modified fields (Name change)', fakeAsync(() => {
    const newName = 'Nuevo Nombre';
    component.profileForm.get('name')?.setValue(newName);
    
    component.updateProfile();
    
    expect(userService.updateProfile).toHaveBeenCalledWith({ name: newName });
    
    const mockUpdatedUser = { name: newName, phone: mockUserProfile.phone };
    (userService.updateProfileSubject as Subject<any>).next({ user: mockUpdatedUser });
    tick();

    expect(component.profileUpdated.emit).toHaveBeenCalledWith(mockUpdatedUser);
  }));

  it('should call userService.updateProfile with both modified fields', fakeAsync(() => {
    const newName = 'Nico Perez';
    const newPhone = '9988776655';
    component.profileForm.get('name')?.setValue(newName);
    component.profileForm.get('phone')?.setValue(newPhone);
    
    component.updateProfile();
    
    expect(userService.updateProfile).toHaveBeenCalledWith({ name: newName, phone: newPhone });
    
    const mockUpdatedUser = { name: newName, phone: newPhone };
    (userService.updateProfileSubject as Subject<any>).next({ user: mockUpdatedUser });
    tick();

    expect(component.profileUpdated.emit).toHaveBeenCalled();
  }));
  
  it('should handle error during profile update', fakeAsync(() => {
    component.profileForm.get('name')?.setValue('Cambio');
    
    component.updateProfile();
    
    const errorMessage = 'Token expirado';
    (userService.updateProfileSubject as Subject<any>).error({ error: { message: errorMessage } });
    tick();
    
    expect(toastService.showToast).toHaveBeenCalledWith(errorMessage, 'error');
  }));
});