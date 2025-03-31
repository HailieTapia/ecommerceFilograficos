import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FaqService, Faq, GroupedFaq, FaqResponse } from '../../services/faq.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { ModalComponent } from '../../../modal/modal.component';
import { ToastService } from '../../services/toastService';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of, Subscription } from 'rxjs';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    ModalComponent,
  ],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css'],
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
  categories: { id: number; name: string; description: string }[] = [];
  faqForm!: FormGroup;
  selectedFaqId: number | null = null;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private faqService: FaqService,
    private toastService: ToastService,
    private fb: FormBuilder
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
      this.faqService.getAllFaqs({ grouped: true }, true).subscribe({
        next: (response: FaqResponse) => {
          this.categories = (response.faqs as GroupedFaq[]).map((cat) => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
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

  formatDate(date?: string): string {
    return date ? new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  }

  isGroupedFaq(item: Faq | GroupedFaq): item is GroupedFaq {
    return (item as GroupedFaq).faqs !== undefined;
  }
}