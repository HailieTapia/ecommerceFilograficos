import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlexaLoginComponent } from './alexa-login.component';

describe('AlexaLoginComponent', () => {
  let component: AlexaLoginComponent;
  let fixture: ComponentFixture<AlexaLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlexaLoginComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlexaLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
