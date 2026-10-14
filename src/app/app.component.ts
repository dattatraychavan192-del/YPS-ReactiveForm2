import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { StudentsService, NewStudent } from './students.service';

function notInFuture(control: AbstractControl): ValidationErrors | null {
  return control.value && control.value > localDateString() ? { futureDate: true } : null;
}

function localDateString(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly genders = ['Female', 'Male', 'Other'];
  readonly standards = ['5', '6', '7', '8', '9', '10'];
  readonly courses = ['SSC', 'HSC Foundation', 'JEE Foundation', 'NEET Foundation'];
  readonly maxDate = localDateString();
  readonly currentYear = new Date().getFullYear();
  readonly studentForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    email: ['', [Validators.email, Validators.maxLength(254)]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    dateOfBirth: ['', [Validators.required, notInFuture]],
    gender: ['', Validators.required],
    standard: ['', Validators.required],
    course: ['', Validators.required],
    guardianName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    guardianPhone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]]
  });

  isSubmitting = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly studentsService: StudentsService
  ) {}

  validationMessage(name: string): string | null {
    const control = this.studentForm.get(name);
    if (!control || (!control.touched && !this.submitted) || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }
    if (control.errors['minlength']) {
      return `Enter at least ${control.errors['minlength'].requiredLength} characters.`;
    }
    if (control.errors['maxlength']) {
      return `Enter no more than ${control.errors['maxlength'].requiredLength} characters.`;
    }
    if (control.errors['email']) {
      return 'Enter a valid email address.';
    }
    if (control.errors['pattern']) {
      return 'Enter a valid 10-digit Indian mobile number.';
    }
    if (control.errors['futureDate']) {
      return 'Date of birth cannot be in the future.';
    }
    return 'Please check this value.';
  }

  submit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    const values = this.studentForm.getRawValue();
    this.studentForm.patchValue({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      guardianName: values.guardianName.trim(),
      guardianPhone: values.guardianPhone.trim(),
      address: values.address.trim()
    });

    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    const normalizedValues = this.studentForm.getRawValue();
    const student: NewStudent = {
      firstName: normalizedValues.firstName,
      lastName: normalizedValues.lastName,
      email: normalizedValues.email.toLowerCase() || undefined,
      phone: normalizedValues.phone,
      dateOfBirth: normalizedValues.dateOfBirth,
      gender: normalizedValues.gender,
      standard: normalizedValues.standard,
      course: normalizedValues.course,
      guardianName: normalizedValues.guardianName,
      guardianPhone: normalizedValues.guardianPhone,
      address: normalizedValues.address
    };

    this.isSubmitting = true;
    this.studentsService.createStudent(student).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Student added successfully.';
        this.studentForm.reset();
        this.submitted = false;
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage = this.requestErrorMessage(error);
      }
    });
  }

  private requestErrorMessage(error: HttpErrorResponse): string {
    const response = error.error as { message?: unknown } | null;
    if (response && typeof response.message === 'string') {
      return response.message;
    }
    if (error.status === 0) {
      return 'Could not reach the student service. Check that the backend is running at http://localhost:3000.';
    }
    if (error.status === 409) {
      return 'A student with this phone number already exists.';
    }
    return `Could not add the student (HTTP ${error.status}). Please try again.`;
  }
}
