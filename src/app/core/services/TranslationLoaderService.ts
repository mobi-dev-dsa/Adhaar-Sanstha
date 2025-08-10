import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TranslationLoaderService {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./assets/i18n/${lang}.json`)
      .pipe(
        catchError(() => {
          // Fallback to English if translation file is not found
          return this.http.get('./assets/i18n/en.json');
        })
      );
  }
}