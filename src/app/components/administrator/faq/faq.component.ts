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
  @ViewChild('faqModal') faqModal!: ModalComponent;

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
  private subscriptions: Subscription = new Subscription();

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
          this.toastService.showToast('Error al cargar las FAQs', 'error');
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
          this.toastService.showToast('Error al cargar las categorías', 'error');
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

  openFaqModal(mode: 'create' | 'edit', faq?: Faq): void {
    if (mode === 'create') {
      this.selectedFaqId = null;
      this.faqForm.reset();
      this.faqModal.open();
    } else if (faq) {
      this.selectedFaqId = faq.id;
      this.faqForm.patchValue({
        category_id: faq.category.id,
        question: faq.question,
        answer: faq.answer,
      });
      this.faqModal.open();
    }
  }

  saveFaq(): void {
    if (this.faqForm.invalid) {
      this.faqForm.markAllAsTouched();
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
          this.faqModal.close();
        },
        error: (err) => {
          this.toastService.showToast(err.message || 'Error al guardar la FAQ', 'error');
        },
      })
    );
  }

  deleteFaq(faq: Faq): void {
    this.toastService.showToast(
      `¿Estás seguro de que deseas eliminar la FAQ "${faq.question}"?`,
      'warning',
      'Confirmar',
      () => {
        this.subscriptions.add(
          this.faqService.deleteFaq(faq.id.toString()).subscribe({
            next: () => {
              this.toastService.showToast('FAQ eliminada exitosamente', 'success');
              this.loadFaqs();
            },
            error: (err) => {
              this.toastService.showToast(err.message || 'Error al eliminar la FAQ', 'error');
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