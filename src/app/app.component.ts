import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { StudentsService, NewStudent, StudentRecord } from './students.service';

function currentDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function sessionYear(): string {
  const year = new Date().getFullYear();
  return `${year}-${String((year + 1) % 100).padStart(2, '0')}`;
}

function validSession(control: AbstractControl): ValidationErrors | null {
  return /^\d{4}-\d{2}$/.test(control.value || '') ? null : { sessionFormat: true };
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  readonly genders = ['Female', 'Male', 'Other'];
  readonly classes = ['8', '9', '10'];
  readonly onlineMethods = ['Google Pay', 'PhonePe', 'Paytm', 'UPI (other)', 'Card', 'Net banking'];
  readonly subjectsByClass: Record<string, string[]> = {
    '8': ['English', 'Maths', 'Science', 'Social Science'],
    '9': ['English', 'Maths', 'Science', 'Social Science'],
    '10': ['English', 'Maths', 'Science', 'Social Science']
  };
  readonly today = currentDate();
  readonly studentForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    gender: ['', Validators.required],
    admissionYear: [sessionYear(), [Validators.required, validSession]],
    className: ['', Validators.required],
    subjects: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    selfStudy: [false],
    courseFee: [0, [Validators.required, Validators.min(0), Validators.max(10000000)]],
    discount: [0, [Validators.required, Validators.min(0), Validators.max(10000000)]],
    initialPayment: [0, [Validators.required, Validators.min(0), Validators.max(10000000)]],
    paymentDate: [currentDate()],
    paymentMethod: [''],
    onlineProvider: [''],
    remarks: ['', Validators.maxLength(500)]
  });

  students: StudentRecord[] = [];
  printStudent: StudentRecord | null = null;
  fieldErrors: Record<string, string> = {};
  selectedPhoto = '';
  photoError = '';
  isSubmitting = false;
  submitted = false;
  breakdownOpen = false;
  successMessage = '';
  errorMessage = '';

  constructor(private readonly formBuilder: FormBuilder, private readonly studentsService: StudentsService) {}

  ngOnInit(): void {
    this.loadStudents();
    this.studentForm.valueChanges.subscribe(() => this.fieldErrors = {});
  }

  get totalFees(): number { return Number(this.studentForm.controls.courseFee.value) || 0; }
  get discount(): number { return Number(this.studentForm.controls.discount.value) || 0; }
  get paidAmount(): number { return Number(this.studentForm.controls.initialPayment.value) || 0; }
  get payableFees(): number { return Math.max(0, this.totalFees - this.discount); }
  get pendingFees(): number { return Math.max(0, this.payableFees - this.paidAmount); }
  get availableSubjects(): string[] { return this.subjectsByClass[this.studentForm.controls.className.value] || []; }

  onClassChange(): void { this.studentForm.controls.subjects.setValue([]); }

  onPaymentMethodChange(method: string): void {
    this.studentForm.controls.paymentMethod.setValue(method);
    if (method !== 'Online') this.studentForm.controls.onlineProvider.setValue('');
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.photoError = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.photoError = 'Choose a JPG, PNG, or WEBP image.';
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.photoError = 'Photo must be 2 MB or smaller.';
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.selectedPhoto = String(reader.result || '');
    reader.onerror = () => this.photoError = 'The selected photo could not be read.';
    reader.readAsDataURL(file);
  }

  toggleSubject(subject: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const selected = this.studentForm.controls.subjects.value;
    this.studentForm.controls.subjects.setValue(checked
      ? [...selected, subject]
      : selected.filter((item) => item !== subject));
    this.studentForm.controls.subjects.markAsTouched();
  }

  printReceipt(student: StudentRecord): void {
    this.printStudent = student;
    window.setTimeout(() => window.print(), 100);
  }

  validationMessage(name: string): string | null {
    const control = this.studentForm.get(name);
    if (!control || (!control.touched && !this.submitted)) return null;
    if (this.fieldErrors[name]) return this.fieldErrors[name];
    if (!control.errors) return null;
    if (control.errors['required']) return 'This field is required.';
    if (control.errors['minlength']) return `Enter at least ${control.errors['minlength'].requiredLength} characters.`;
    if (control.errors['maxlength']) return `Enter no more than ${control.errors['maxlength'].requiredLength} characters.`;
    if (control.errors['email']) return 'Enter a valid email address.';
    if (control.errors['pattern']) return 'Enter a valid 10-digit Indian mobile number.';
    if (control.errors['min']) return 'Amount cannot be negative.';
    if (control.errors['sessionFormat']) return 'Use the academic session format YYYY-YY.';
    return 'Please check this value.';
  }

  submit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.fieldErrors = {};
    const submittedValues = this.studentForm.getRawValue();
    this.studentForm.patchValue({
      firstName: submittedValues.firstName.trim(),
      lastName: submittedValues.lastName.trim(),
      email: submittedValues.email.trim(),
      phone: submittedValues.phone.trim(),
      remarks: submittedValues.remarks.trim()
    });
    const values = this.studentForm.getRawValue();
    const invalidPaymentDate = !values.paymentDate || Number.isNaN(Date.parse(`${values.paymentDate}T00:00:00`)) || values.paymentDate > this.today;
    const paymentInvalid = values.initialPayment > 0 && (
      !values.paymentMethod || (values.paymentMethod === 'Online' && !values.onlineProvider) ||
      invalidPaymentDate || values.initialPayment > Math.max(0, values.courseFee - values.discount)
    );
    if (paymentInvalid) {
      if (values.initialPayment > Math.max(0, values.courseFee - values.discount)) {
        this.fieldErrors['initialPayment'] = 'Payment cannot exceed the discounted total fees.';
        this.errorMessage = 'Please correct the payment amount.';
      } else if (!values.paymentMethod) {
        this.fieldErrors['paymentMethod'] = 'Choose Cash or Online.';
        this.errorMessage = 'Please choose a payment method.';
      } else if (values.paymentMethod === 'Online' && !values.onlineProvider) {
        this.fieldErrors['onlineProvider'] = 'Choose the online payment method.';
        this.errorMessage = 'Please choose an online payment method.';
      } else {
        this.fieldErrors['paymentDate'] = invalidPaymentDate ? 'Enter a valid date no later than today.' : 'Check the payment details.';
        this.errorMessage = 'Please correct the payment date.';
      }
    }
    if (this.studentForm.invalid || paymentInvalid || this.photoError) {
      if (this.studentForm.invalid && !this.errorMessage) this.errorMessage = 'Please correct the highlighted fields before submitting.';
      if (this.photoError && !this.errorMessage) this.errorMessage = this.photoError;
      this.studentForm.markAllAsTouched();
      return;
    }

    const student: NewStudent = {
      ...values,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      subjects: [...values.subjects],
      remarks: values.remarks.trim(),
      photo: this.selectedPhoto || undefined,
      totalFees: this.totalFees,
      paidAmount: this.paidAmount,
      pendingFees: this.pendingFees,
      paymentMethod: this.paidAmount ? values.paymentMethod as 'Cash' | 'Online' : undefined,
      onlineProvider: this.paidAmount && values.paymentMethod === 'Online' ? values.onlineProvider : undefined,
      paymentDate: this.paidAmount ? values.paymentDate : undefined
    };

    this.isSubmitting = true;
    this.studentsService.createStudent(student).subscribe({
      next: (created) => {
        this.isSubmitting = false;
        this.successMessage = `${created.firstName} ${created.lastName} added successfully.`;
        this.students = [created, ...this.students.filter((student) => student.id !== created.id)];
        this.studentForm.reset({
          firstName: '', lastName: '', email: '', phone: '', gender: '', admissionYear: sessionYear(),
          className: '', subjects: [], selfStudy: false, courseFee: 0, discount: 0,
          initialPayment: 0, paymentDate: currentDate(), paymentMethod: '', onlineProvider: '', remarks: ''
        });
        this.submitted = false;
        this.selectedPhoto = '';
        this.photoError = '';
        this.fieldErrors = {};
        if (this.photoInput) this.photoInput.nativeElement.value = '';
        this.loadStudents();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = this.requestErrorMessage(error);
        this.fieldErrors = this.mapFieldErrors(this.errorMessage);
      }
    });
  }

  private loadStudents(): void {
    this.studentsService.getStudents().subscribe({
      next: (students) => {
        const returnedIds = new Set(students.map((student) => student.id));
        this.students = [...students, ...this.students.filter((student) => !returnedIds.has(student.id))];
      },
      error: () => { if (!this.students.length) this.students = []; }
    });
  }

  private requestErrorMessage(error: HttpErrorResponse): string {
    const response = error.error as { message?: unknown } | null;
    if (error.status >= 500) {
      const detail = response && typeof response.message === 'string' ? ` Server response: ${response.message}` : '';
      return `The backend could not save this student (HTTP ${error.status}). Check the backend deployment and storage logs.${detail}`;
    }
    if (response && typeof response.message === 'string') return response.message;
    if (error.status === 0) return 'Could not reach the student service. Check that the deployed backend is available and try again.';
    if (error.status === 409) return 'A student with this phone number already exists.';
    return `Could not add the student (HTTP ${error.status}). Please try again.`;
  }

  private mapFieldErrors(message: string): Record<string, string> {
    const text = message.toLowerCase();
    const fields: Record<string, string[]> = {
      firstName: ['first name'], lastName: ['last name'], email: ['email'], phone: ['phone', 'contact'],
      gender: ['gender'], admissionYear: ['admission year', 'academic session'], className: ['class'],
      subjects: ['subject'], courseFee: ['course fee', 'total fees'], discount: ['discount'],
      initialPayment: ['initial payment', 'payment amount', 'payment cannot'], paymentDate: ['payment date'],
      onlineProvider: ['online payment method'], paymentMethod: ['choose cash or online', 'payment method'],
      remarks: ['remarks'], photo: ['photo']
    };
    const match = Object.entries(fields).find(([, labels]) => labels.some((label) => text.includes(label)));
    if (!match) return {};
    const field = match[0];
    const inlineMessage = field === 'onlineProvider' ? 'Choose an online payment method.' : message;
    return { [field]: inlineMessage };
  }
}
