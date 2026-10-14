import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [HttpClientTestingModule, ReactiveFormsModule]
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates a student form with required field validation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(component.studentForm.valid).toBeFalse();
    expect(component.studentForm.get('firstName')?.hasError('required')).toBeTrue();
  });

  it('posts a valid, normalized student to the backend', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    component.studentForm.setValue({
      firstName: '  Aarav ',
      lastName: 'Sharma ',
      email: '  STUDENT@EXAMPLE.COM ',
      phone: '9876543210',
      dateOfBirth: '2010-04-03',
      gender: 'Male',
      standard: '8',
      course: 'SSC',
      guardianName: ' Rohan Sharma ',
      guardianPhone: '9876543211',
      address: '  12 School Road  '
    });

    component.submit();

    const request = httpMock.expectOne('http://localhost:3000/api/students');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'student@example.com',
      phone: '9876543210',
      dateOfBirth: '2010-04-03',
      gender: 'Male',
      standard: '8',
      course: 'SSC',
      guardianName: 'Rohan Sharma',
      guardianPhone: '9876543211',
      address: '12 School Road'
    });

    request.flush({ message: 'created' });
    expect(component.successMessage).toBe('Student added successfully.');
    expect(component.studentForm.pristine).toBeTrue();
  });

  it('does not submit when a phone number is invalid', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    component.studentForm.get('phone')?.setValue('12345');
    component.submit();

    expect(component.errorMessage).toBe('');
    expect(component.studentForm.get('phone')?.hasError('pattern')).toBeTrue();
    httpMock.expectNone('http://localhost:3000/api/students');
  });
});
