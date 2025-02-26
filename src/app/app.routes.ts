import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard'; 

//publicos
import { RegisterComponent } from './components/public/register/register.component';
import { RecoverComponent } from './components/public/recover/recover.component';
import { LoginComponent } from './components/public/login/login.component';
import { FaqComponent } from './components/public/faq/faq.component'; 
import { MfaVerificationComponent } from './components/public/mfa-verification/mfa-verification.component'; 
import { SupportInquiryComponent} from './components/public/support-inquiry/support-inquiry.component'; 

import { DisclaimerComponent } from './components/public/disclaimer/disclaimer.component'; 
import { TermsComponent } from './components/public/terms/terms.component'; 
import { PolicyComponent} from './components/public/policy/policy.component'; 


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

//errores
import { BadRequestComponent } from './components/errors/bad-request/bad-request.component';
import { NotFoundComponent } from './components/errors/not-found/not-found.component';
import { ServerErrorComponent } from './components/errors/server-error/server-error.component';

export const routes: Routes = [

  //administrador
  { path: 'company', component: CompanyComponent, canActivate: [AuthGuard], data: { role: 'administrador' } },
  { path: 'security', component: SecurityComponent, canActivate: [AuthGuard], data: { role: 'administrador' } },
  { path: 'type', component: EmailTypeComponent, canActivate: [AuthGuard], data: { role: 'administrador' } },
  { path: 'template', component: EmailTemplateComponent, canActivate: [AuthGuard], data: { role: 'administrador' } },
  { path: 'regulatory', component: RegulatoryComponent, canActivate: [AuthGuard], data: { role: 'administrador' } },
  { path: 'faq-categories', component: FaqCategoriesComponent , canActivate: [AuthGuard], data: { role: 'administrador' } },
  { path: 'faqs', component: FaqComponentAdmin , canActivate: [AuthGuard], data: { role: 'administrador' } },
  { path: 'support-panel', component: SupportPanelComponent , canActivate: [AuthGuard], data: { role: 'administrador' } },

  //autenticados
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], data: { role: 'cliente' } },

  //publicos
  { path: 'register', component: RegisterComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'login', component: LoginComponent },
  { path: 'recovery', component: RecoverComponent },
  { path: 'mfa-verification', component: MfaVerificationComponent },
  { path: 'support-inquiry', component: SupportInquiryComponent },
  { path: 'disclaimer', component: DisclaimerComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'policy', component: PolicyComponent },
  { path: '', redirectTo: '/recovery', pathMatch: 'full' },
  

  { path: '400', component: BadRequestComponent },
  { path: '404', component: NotFoundComponent },
  { path: '500', component: ServerErrorComponent },
  // Ruta comodín para otros errores 404
  { path: '**', component: NotFoundComponent },
];