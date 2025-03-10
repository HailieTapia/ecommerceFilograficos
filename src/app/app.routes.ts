import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; 

//publicos
import { RegisterComponent } from './components/public/register/register.component';
import { RecoverComponent } from './components/public/recover/recover.component';
import { LoginComponent } from './components/public/login/login.component';
import { FaqComponent } from './components/public/faq/faq.component'; 
import { MfaVerificationComponent } from './components/public/mfa-verification/mfa-verification.component'; 
import { SupportInquiryComponent} from './components/public/support-inquiry/support-inquiry.component'; 

import { LegalComponent } from './components/public/legal/legal.component'; 

//autenticados
import { ProfileComponent } from './components/authenticated/profile/profile.component';

//administrador
import { CompanyComponent } from './components/administrator/company/company.component';
import { SecurityComponent } from './components/administrator/security/security.component';
import { EmailTypeComponent } from './components/administrator/email-type/email-type.component';
import { EmailTemplateComponent } from './components/administrator/email-template/email-template.component';
import { RegulatoryComponent } from './components/administrator/regulatory/regulatory.component';
import { FaqCategoriesComponent } from './components/administrator/faq-categories/faq-categories.component';
import { FaqComponentAdmin } from './components/administrator/faq/faq.component';
import { SupportPanelComponent } from './components/administrator/support-panel/support-panel.component';
import { ProductAttributeComponent } from './components/administrator/product-attribute/product-attribute.component';
import { CollaboratorsComponent } from './components/administrator/collaborators/collaborators.component';
import { CategoriesComponent } from './components/administrator/categories/categories.component';
import { ProductCatalogComponent } from './components/administrator/product-catalog/product-catalog.component';
import { ProductStockComponent } from './components/administrator/product-stock/product-stock.component';

//errores
import { BadRequestComponent } from './components/errors/bad-request/bad-request.component';
import { NotFoundComponent } from './components/errors/not-found/not-found.component';
import { ServerErrorComponent } from './components/errors/server-error/server-error.component';

export const routes: Routes = [

  // Administrador
  { path: 'company', component: CompanyComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Empresa' } },
  { path: 'security', component: SecurityComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Seguridad' } },
  { path: 'type', component: EmailTypeComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Tipos de Correo' } },
  { path: 'template', component: EmailTemplateComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Plantillas' } },
  { path: 'regulatory', component: RegulatoryComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Regulatorio' } },
  { path: 'faq-categories', component: FaqCategoriesComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Categorías FAQ' } },
  { path: 'faqs', component: FaqComponentAdmin, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'FAQ (Admin)' } },
  { path: 'support-panel', component: SupportPanelComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Panel de Soporte' } },
  { path: 'product-attributes', component: ProductAttributeComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Atributos de productos' } },
  { path: 'collaborators', component: CollaboratorsComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Colaboradores' } },
  { path: 'category', component: CategoriesComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Colaboradores' } },
  { path: 'product-catalog', component: ProductCatalogComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Catalogo de productos' } },
  { path: 'product-stock', component: ProductStockComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Inventario de productos' } },
  // Autenticados
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], data: { role: 'cliente', breadcrumb: 'Perfil' } },

  // Públicos
  { path: 'register', component: RegisterComponent, data: { breadcrumb: 'Registrar' } },
  { path: 'faq', component: FaqComponent, data: { breadcrumb: 'FAQ' } },
  { path: 'login', component: LoginComponent, data: { breadcrumb: 'Iniciar sesión' } },
  { path: 'recovery', component: RecoverComponent, data: { breadcrumb: 'Recuperar cuenta' } },
  { path: 'mfa-verification', component: MfaVerificationComponent, data: { breadcrumb: 'Verificación MFA' } },
  { path: 'support-inquiry', component: SupportInquiryComponent, data: { breadcrumb: 'Consulta Soporte' } },
  { path: 'legal', component: LegalComponent, data: { breadcrumb: 'Legal' } },
  
  // Rutas de error
  { path: '400', component: BadRequestComponent, data: { breadcrumb: 'Solicitud incorrecta' } },
  { path: '404', component: NotFoundComponent, data: { breadcrumb: 'Página no encontrada' } },
  { path: '500', component: ServerErrorComponent, data: { breadcrumb: 'Error de servidor' } },

  // Ruta comodín para otros errores 404
  { path: '**', component: NotFoundComponent, data: { breadcrumb: 'Página no encontrada' } },
];
