import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface NewStudent {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  standard: string;
  course: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
}

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly studentsUrl = `${environment.apiBaseUrl}/students`;

  constructor(private readonly http: HttpClient) {}

  createStudent(student: NewStudent): Observable<unknown> {
    return this.http.post<unknown>(this.studentsUrl, student);
  }
}
