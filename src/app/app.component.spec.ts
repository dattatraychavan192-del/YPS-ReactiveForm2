import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { StudentRecord } from './students.service';

describe('AppComponent', () => {
  let httpMock: HttpTestingController;
  const studentsUrl = `${environment.baseUrl}/students`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      imports: [HttpClientTestingModule, ReactiveFormsModule]
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('creates an invalid student form with required field validation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(component.studentForm.invalid).toBeTrue();
    expect(component.studentForm.get('firstName')?.hasError('required')).toBeTrue();
  });

  it('posts a normalized student, adds its card, and resets after success', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;
    component.studentForm.setValue({
      firstName: '  Aarav ',
      lastName: 'Sharma ',
      email: '  STUDENT@EXAMPLE.COM ',
      phone: '9876543210',
      gender: 'Male',
      admissionYear: '2026-27',
      className: '8',
      subjects: ['English', 'Maths'],
      selfStudy: false,
      courseFee: 1000,
      discount: 100,
      initialPayment: 200,
      paymentDate: component.today,
      paymentMethod: 'Online',
      onlineProvider: 'Google Pay',
      remarks: '  First fee  '
    });

    component.submit();

    const request = httpMock.expectOne(studentsUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(jasmine.objectContaining({
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'student@example.com',
      phone: '9876543210',
      className: '8',
      subjects: ['English', 'Maths'],
      paymentMethod: 'Online',
      onlineProvider: 'Google Pay',
      remarks: 'First fee',
      totalFees: 1000,
      paidAmount: 200,
      pendingFees: 700
    }));

    const created: StudentRecord = {
      ...request.request.body,
      id: 'student-1',
      createdAt: '2026-10-16T00:00:00.000Z'
    };
    request.flush(created);
    expect(component.successMessage).toBe('Aarav Sharma added successfully.');
    expect(component.studentForm.pristine).toBeTrue();
    expect(component.studentForm.controls.firstName.value).toBe('');
    expect(component.students[0]).toEqual(created);

    httpMock.expectOne(studentsUrl).flush([created]);
  });

  it('shows field errors and does not submit an invalid phone number', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const component = fixture.componentInstance;

    component.studentForm.controls.phone.setValue('12345');
    component.submit();

    expect(component.errorMessage).toContain('highlighted fields');
    expect(component.validationMessage('phone')).toBe('Enter a valid 10-digit Indian mobile number.');
    httpMock.expectNone(studentsUrl);
  });
});
