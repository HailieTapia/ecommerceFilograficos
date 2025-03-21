import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthCatalogComponent } from './auth-catalog.component';

describe('AuthCatalogComponent', () => {
  let component: AuthCatalogComponent;
  let fixture: ComponentFixture<AuthCatalogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCatalogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
