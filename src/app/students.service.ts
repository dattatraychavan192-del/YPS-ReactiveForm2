import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface NewStudent {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  admissionYear: string;
  className: string;
  subjects: string[];
  selfStudy: boolean;
  courseFee: number;
  discount: number;
  initialPayment: number;
  paymentDate?: string;
  paymentMethod?: 'Cash' | 'Online';
  onlineProvider?: string;
  remarks: string;
  photo?: string;
  totalFees: number;
  paidAmount: number;
  pendingFees: number;
}

export interface StudentRecord extends NewStudent {
  id: string;
  createdAt: string;
  standard?: string;
}

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly studentsUrl = `${environment.baseUrl}/students`;

  constructor(private readonly http: HttpClient) {}

  getStudents(): Observable<StudentRecord[]> {
    return this.http.get<StudentRecord[]>(this.studentsUrl);
  }

  createStudent(student: NewStudent): Observable<StudentRecord> {
    return this.http.post<StudentRecord>(this.studentsUrl, student);
  }
}
