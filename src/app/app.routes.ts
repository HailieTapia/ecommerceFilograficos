import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

// Públicos
import { RegisterComponent } from './components/public/register/register.component';
import { RecoverComponent } from './components/public/recover/recover.component';
import { LoginComponent } from './components/public/login/login.component';
import { FaqComponent } from './components/public/faq/faq.component';
import { MfaVerificationComponent } from './components/public/mfa-verification/mfa-verification.component';
import { SupportInquiryComponent } from './components/public/support-inquiry/support-inquiry.component';
import { HomeComponent } from './components/public/home/home.component';
import { LegalComponent } from './components/public/legal/legal.component';
import { PublicCatalogComponent } from './components/public/public-catalog/public-catalog.component';
import { ProductDetailComponent } from './components/public/public-catalog/product-detail/product-detail.component';

// Autenticados
import { ProfileComponent } from './components/authenticated/profile/profile.component';
import { AuthCatalogComponent } from './components/authenticated/auth-catalog/auth-catalog.component';
import { ProductDetailAComponent } from './components/authenticated/auth-catalog/product-detail-a/product-detail-a.component';
import { CartComponent } from './components/authenticated/auth-catalog/cart/cart.component';
import { CheckoutComponent } from './components/authenticated/checkout/checkout.component';
import { OrderConfirmationComponent } from './components/authenticated/order-confirmation/order-confirmation.component';
import { OrdersComponent } from './components/authenticated/orders/orders.component';

// Administrador
import { CompanyComponent } from './components/administrator/company/company.component';
import { BannerAdminComponent } from './components/administrator/banner-admin/banner-admin.component';
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
import { AdministratorDashboardComponent } from './components/administrator/administrator-dashboard/administrator-dashboard.component';
import { PriceManagementComponent } from './components/administrator/price-management/price-management.component';
import { PromotionManagementComponent } from './components/administrator/promotion-management/promotion-management.component';
import { BackupManagementComponent } from './components/administrator/backup-management/backup-management.component';
import { ProductCategoriesComponent } from './components/public/product-categories/product-categories.component';
import { AdminOrderComponent } from './components/administrator/admin-order/admin-order.component';

// Errores
import { BadRequestComponent } from './components/errors/bad-request/bad-request.component';
import { NotFoundComponent } from './components/errors/not-found/not-found.component';
import { ServerErrorComponent } from './components/errors/server-error/server-error.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard], data: { allowPublic: true, breadcrumb: 'Inicio' } },

  // Administrador
  { path: 'admin-dashboard', component: AdministratorDashboardComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Dashboard' } },
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
  { path: 'category', component: CategoriesComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Categorías' } },
  { path: 'product-catalog', component: ProductCatalogComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Catálogo de productos' } },
  { path: 'product-stock', component: ProductStockComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Inventario de productos' } },
  { path: 'banners', component: BannerAdminComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Gestión de banners' } },
  { path: 'price-management', component: PriceManagementComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Gestión de precios de productos' } },
  { path: 'promotion-management', component: PromotionManagementComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Gestión de promociones' } },
  { path: 'backup-management', component: BackupManagementComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Gestión de respaldos' } },
  { path: 'dashboard-orders', component: AdminOrderComponent, canActivate: [AuthGuard], data: { role: 'administrador', breadcrumb: 'Gestión de ordenes' } },

  // Autenticados
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard], data: { role: 'cliente', breadcrumb: 'Perfil' } },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard], data: { role: 'cliente', breadcrumb: 'Carrito' } },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard], data: { role: 'cliente', breadcrumb: 'Checkout' } },
  { path: 'order-confirmation/:id', component: OrderConfirmationComponent, canActivate: [AuthGuard], data: { role: 'cliente', breadcrumb: 'order-confirmation' } },
  { path: 'orders', component: OrdersComponent, canActivate: [AuthGuard], data: { role: 'cliente', breadcrumb: 'orders' } },
  // Rutas del catálogo autenticado (anidadas)
  {
    path: 'authcatalog',
    canActivate: [AuthGuard],
    data: { role: 'cliente', breadcrumb: 'Catálogo' },
    children: [
      { path: '', component: AuthCatalogComponent },
      { path: ':productIdA', component: ProductDetailAComponent, data: { breadcrumb: 'Detalles del producto' } }
    ]
  },

  // Públicos
  { path: 'register', component: RegisterComponent, data: { breadcrumb: 'Registrar' } },
  { path: 'faq', component: FaqComponent, data: { breadcrumb: 'FAQ' } },
  { path: 'login', component: LoginComponent, data: { breadcrumb: 'Iniciar sesión' } },
  { path: 'recovery', component: RecoverComponent, data: { breadcrumb: 'Recuperar cuenta' } },
  { path: 'mfa-verification', component: MfaVerificationComponent, data: { breadcrumb: 'Verificación MFA' } },
  { path: 'support-inquiry', component: SupportInquiryComponent, data: { breadcrumb: 'Consulta Soporte' } },
  { path: 'legal', component: LegalComponent, data: { breadcrumb: 'Legal' } },
  { path: 'product-categories', component: ProductCategoriesComponent, data: { breadcrumb: 'Categorias' } },

  // Rutas del catálogo público (anidadas)
  {
    path: 'publiccatalog',
    canActivate: [AuthGuard],
    data: { allowPublic: true, breadcrumb: 'Catálogo' },
    children: [
      { path: '', component: PublicCatalogComponent },
      { path: ':productId', component: ProductDetailComponent, data: { breadcrumb: 'Detalles del producto' } }
    ]
  },

  // Rutas de error
  { path: '400', component: BadRequestComponent, data: { breadcrumb: 'Solicitud incorrecta' } },
  { path: '404', component: NotFoundComponent, data: { breadcrumb: 'Página no encontrada' } },
  { path: '500', component: ServerErrorComponent, data: { breadcrumb: 'Error de servidor' } },

  // Ruta comodín para otros errores 404
  { path: '**', component: NotFoundComponent, data: { breadcrumb: 'Página no encontrada' } },
];