import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeCategoryManagementComponent } from './badge-category-management.component';

describe('BadgeCategoryManagementComponent', () => {
  let component: BadgeCategoryManagementComponent;
  let fixture: ComponentFixture<BadgeCategoryManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeCategoryManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeCategoryManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
