import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BadgeManagementComponent } from './badge-management.component';

describe('BadgeManagementComponent', () => {
  let component: BadgeManagementComponent;
  let fixture: ComponentFixture<BadgeManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
