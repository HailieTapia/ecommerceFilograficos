import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackupManagementComponent } from './backup-management.component';

describe('BackupManagementComponent', () => {
  let component: BackupManagementComponent;
  let fixture: ComponentFixture<BackupManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackupManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackupManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
