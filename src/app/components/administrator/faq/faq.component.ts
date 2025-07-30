import { Component, OnInit, ViewChild, OnDestroy, LOCALE_ID } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FaqService, Faq, GroupedFaq, FaqResponse } from '../../services/faq.service';
import { FaqCategoryService } from '../../services/faq-category.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../../modal/modal.component';
import { ToastService } from '../../services/toastService';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';

// Registrar los datos de localización para español
registerLocaleData(localeEs);

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    ModalComponent,
    DatePipe
  ],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es' }
  ]
})
export class FaqComponentAdmin implements OnInit, OnDestroy {
  @ViewChild('createEditModal') createEditModal!: ModalComponent;
  @ViewChild('viewDetailsModal') viewDetailsModal!: ModalComponent;
  @ViewChild('confirmModal') confirmModal!: ModalComponent;

  faqs: (Faq | GroupedFaq)[] = [];
  totalFaqs = 0;
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  searchTerm = '';
  selectedCategoryId: number | null = null;
  isGrouped = false;
  categories: { id: number; name: string; description?: string }[] = [];
  faqForm!: FormGroup;
  selectedFaqId: number | null = null;
  selectedFaq: Faq | null = null;
  private subscriptions: Subscription = new Subscription();
  confirmAction: (() => void) | null = null;
  confirmModalTitle: string = '';
  confirmModalMessage: string = '';
  confirmModalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default' = 'default';

  constructor(
    private faqService: FaqService,
    private faqCategoryService: FaqCategoryService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.faqForm = this.fb.group({
      category_id: ['', [Validators.required]],
      question: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
      answer: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
    });
  }

  ngOnInit(): void {
    this.loadFaqs();
    this.loadCategories();
  }

  ngAfterViewInit(): void {
    if (!this.createEditModal || !this.viewDetailsModal || !this.confirmModal) {
      this.toastService.showToast('Uno o más modales no están inicializados correctamente.', 'error');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadFaqs(): void {
    const params = {
      page: this.currentPage,
      pageSize: this.itemsPerPage,
      search: this.searchTerm,
      categoryId: this.selectedCategoryId || undefined,
      grouped: this.isGrouped,
    };

    this.subscriptions.add(
      this.faqService.getAllFaqs(params, true).subscribe({
        next: (response: FaqResponse) => {
          this.faqs = response.faqs;
          this.totalFaqs = response.total;
          this.totalPages = Math.ceil(response.total / this.itemsPerPage);
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las FAQs';
          this.toastService.showToast(errorMessage, 'error');
        },
      })
    );
  }

  loadCategories(): void {
    this.subscriptions.add(
      this.faqCategoryService.getPublicCategories().subscribe({
        next: (categories: { category_id: number; name: string }[]) => {
          this.categories = categories.map(cat => ({
            id: cat.category_id,
            name: cat.name,
            description: ''
          }));
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al cargar las categorías';
          this.toastService.showToast(errorMessage, 'error');
        },
      })
    );
  }

  toggleGrouping(): void {
    this.isGrouped = !this.isGrouped;
    this.currentPage = 1;
    this.loadFaqs();
  }

  onPageChange(newPage: number): void {
    this.currentPage = newPage;
    this.loadFaqs();
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadFaqs();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.debounceSearch().subscribe(() => this.loadFaqs());
  }

  debounceSearch() {
    return of(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(() => of(null))
    );
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.loadFaqs();
  }

  openCreateModal(): void {
    this.selectedFaqId = null;
    this.selectedFaq = null;
    this.faqForm.reset();
    if (this.createEditModal) {
      this.createEditModal.modalType = 'success';
      this.createEditModal.title = 'Crear FAQ';
      this.createEditModal.open();
    }
  }

  openEditModal(faq: Faq): void {
    this.selectedFaqId = faq.id;
    this.selectedFaq = faq;
    this.faqForm.patchValue({
      category_id: faq.category.id,
      question: faq.question,
      answer: faq.answer,
    });
    if (this.createEditModal) {
      this.createEditModal.modalType = 'info';
      this.createEditModal.title = 'Editar FAQ';
      this.createEditModal.open();
    }
  }

  openViewModal(faq: Faq): void {
    this.selectedFaq = faq;
    if (this.viewDetailsModal) {
      this.viewDetailsModal.modalType = 'default';
      this.viewDetailsModal.title = 'Detalles de la FAQ';
      this.viewDetailsModal.open();
    }
  }

  openConfirmModal(title: string, message: string, modalType: 'danger' | 'success' | 'info' | 'warning' | 'error' | 'default', action: () => void) {
    this.confirmModalTitle = title;
    this.confirmModalMessage = message;
    this.confirmModalType = modalType;
    this.confirmAction = action;
    if (this.confirmModal) {
      this.confirmModal.title = title;
      this.confirmModal.modalType = modalType;
      this.confirmModal.isConfirmModal = true;
      this.confirmModal.confirmText = 'Confirmar';
      this.confirmModal.cancelText = 'Cancelar';
      this.confirmModal.open();
    }
  }

  handleConfirm(): void {
    if (this.confirmAction) {
      this.confirmAction();
      this.confirmAction = null;
    }
  }

  saveFaq(): void {
    if (this.faqForm.invalid) {
      this.faqForm.markAllAsTouched();
      this.toastService.showToast('Formulario inválido. Revisa los campos.', 'error');
      return;
    }

    const faqData = this.faqForm.value;
    const serviceCall = this.selectedFaqId
      ? this.faqService.updateFaq(this.selectedFaqId, faqData)
      : this.faqService.createFaq(faqData);

    this.subscriptions.add(
      serviceCall.subscribe({
        next: () => {
          this.toastService.showToast(
            this.selectedFaqId ? 'FAQ actualizada exitosamente' : 'FAQ creada exitosamente',
            'success'
          );
          this.loadFaqs();
          if (this.createEditModal) this.createEditModal.close();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'Error al guardar la FAQ';
          this.toastService.showToast(errorMessage, 'error');
        },
      })
    );
  }

  deleteFaq(faq: Faq): void {
    this.openConfirmModal(
      'Eliminar FAQ',
      `¿Estás seguro de que deseas eliminar la FAQ "${faq.question}"? Esta acción no se puede deshacer.`,
      'danger',
      () => {
        this.subscriptions.add(
          this.faqService.deleteFaq(faq.id.toString()).subscribe({
            next: () => {
              this.toastService.showToast('FAQ eliminada exitosamente', 'success');
              this.loadFaqs();
              if (this.confirmModal) this.confirmModal.close();
            },
            error: (err) => {
              const errorMessage = err?.error?.message || 'Error al eliminar la FAQ';
              this.toastService.showToast(errorMessage, 'error');
              if (this.confirmModal) this.confirmModal.close();
            },
          })
        );
      }
    );
  }

  formatDate(date?: string, withTime: boolean = false): string {
    if (!date) return 'Fecha no disponible';
    const format = withTime ? "d 'de' MMMM 'de' yyyy HH:mm" : "d 'de' MMMM 'de' yyyy";
    return this.datePipe.transform(date, format, undefined, 'es') || 'Fecha no disponible';
  }

  isGroupedFaq(item: Faq | GroupedFaq): item is GroupedFaq {
    return (item as GroupedFaq).faqs !== undefined;
  }
}