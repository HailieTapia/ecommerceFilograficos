import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportPanelComponent } from './support-panel.component';

describe('SupportPanelComponent', () => {
  let component: SupportPanelComponent;
  let fixture: ComponentFixture<SupportPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupportPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
