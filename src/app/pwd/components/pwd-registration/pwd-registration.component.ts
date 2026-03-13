import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService, PWDRegistration, DisabilityType, SeverityLevel, DisabilityDueTo, EducationLevel } from '../../../core/services/supabase.service';
import { MessageService } from 'primeng/api';
import { StepsModule } from 'primeng/steps';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { AccordionModule } from 'primeng/accordion';
import { MultiSelectModule } from 'primeng/multiselect';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { NgxCaptchaModule } from 'ngx-captcha';
import { environment } from '../../../../environments/environment';
import { RadioButtonModule } from 'primeng/radiobutton';
interface StepItem {
  label: string;
  command: () => void;
}

@Component({
  selector: 'app-pwd-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StepsModule,
    CardModule,
    InputTextModule,
    DropdownModule,
    CalendarModule,
    AccordionModule,
    MultiSelectModule,
    FileUploadModule,
    ButtonModule,
    ToastModule,
    DialogModule,
    NgxCaptchaModule,
    RadioButtonModule
  ],
  providers: [MessageService],
  templateUrl: './pwd-registration.component.html',
  styleUrls: ['./pwd-registration.component.scss']
})
export class PwdRegistrationComponent implements OnInit {
  currentStep = 0;
  steps: StepItem[] = [
    { label: 'Personal Info', command: () => this.goToStep(0) },
    { label: 'Disability Info', command: () => this.goToStep(1) },
    { label: 'Education', command: () => this.goToStep(2) },
    { label: 'Skills & Address', command: () => this.goToStep(3) },
    { label: 'Documents', command: () => this.goToStep(4) }
  ];

  // Form groups for each step
  personalInfoForm!: FormGroup;
  disabilityInfoForm!: FormGroup;
  educationForm!: FormGroup;
  skillsAddressForm!: FormGroup;
  documentsForm!: FormGroup;

  // Dropdown options with proper typing
  genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' }
  ];

  disabilityTypes = [
    { label: 'Visual Impairment', value: DisabilityType.VISUAL },
    { label: 'Hearing Impairment', value: DisabilityType.HEARING },
    { label: 'Physical Disability', value: DisabilityType.PHYSICAL },
    { label: 'Intellectual Disability', value: DisabilityType.INTELLECTUAL },
    { label: 'Mental Health', value: DisabilityType.MENTAL_HEALTH },
    { label: 'Multiple Disabilities', value: DisabilityType.MULTIPLE },
    { label: 'Acid Attack Survivor', value: DisabilityType.ACID_ATTACK },
    { label: 'Autism Spectrum Disorder', value: DisabilityType.AUTISM }
  ];

  severityLevels = [
    { label: 'Mild', value: SeverityLevel.MILD },
    { label: 'Moderate', value: SeverityLevel.MODERATE },
    { label: 'Severe', value: SeverityLevel.SEVERE },
    { label: 'Profound', value: SeverityLevel.PROFOUND }
  ];

  disabilityDueToOptions = [
    { label: 'Accidental', value: DisabilityDueTo.ACCIDENTAL },
    { label: 'Congenital', value: DisabilityDueTo.CONGENITAL },
    { label: 'Disease', value: DisabilityDueTo.DISEASE },
    { label: 'Infection', value: DisabilityDueTo.INFECTION },
    { label: 'Other', value: DisabilityDueTo.OTHER }
  ];

  educationLevels = [
    { label: 'Primary', value: EducationLevel.PRIMARY },
    { label: 'Secondary', value: EducationLevel.SECONDARY },
    { label: 'Higher Secondary', value: EducationLevel.HIGHER_SECONDARY },
    { label: 'Graduate', value: EducationLevel.GRADUATE },
    { label: 'Post Graduate', value: EducationLevel.POST_GRADUATE },
    { label: 'No Formal Education', value: EducationLevel.NONE }
  ];

  // Skill program options
  skillProgramOptions = [
    { label: 'Online', value: 'online' },
    { label: 'Offline', value: 'offline' },
    { label: 'Both', value: 'both' }
  ];

  skillOptions = [
    { label: 'Computer Skills', value: 'computer' },
    { label: 'Communication', value: 'communication' },
    { label: 'Leadership', value: 'leadership' },
    { label: 'Problem Solving', value: 'problem_solving' },
    { label: 'Team Work', value: 'team_work' },
    { label: 'Adaptability', value: 'adaptability' }
  ];

  stateOptions = [
    { label: 'Maharashtra', value: 'maharashtra' },
    { label: 'Delhi', value: 'delhi' },
    { label: 'Karnataka', value: 'karnataka' },
    { label: 'Tamil Nadu', value: 'tamil_nadu' },
    { label: 'Gujarat', value: 'gujarat' }
  ];

  loading = false;
  submitting = false;
  selectedFile: File | null = null;
  selectedUuidFile: File | null = null;
  selectedDisabilityFile: File | null = null;
  showSuccessDialog = false;
  recaptchaSiteKey = environment.recaptcha.siteKey;
  //  Add these properties for date validation
  maxDate: Date = new Date();
  yearRange: string = "1900:" + new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.initializeForms();
  }

  ngOnInit() { }

  private initializeForms() {
    this.personalInfoForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      dateOfBirth: ['', [Validators.required, this.ageValidator(0)]],
      gender: ['', Validators.required]
    });

    this.disabilityInfoForm = this.fb.group({
      type: ['', Validators.required],
      // numeric percentage control (0-100)
      disabilityPercentage: ['', [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]+)?$/), Validators.min(0), Validators.max(100)]],
      disability_by_birth: [null, Validators.required],
    });
    this.educationForm = this.fb.group({
      level: ['', Validators.required],
      institution: [''],
      yearCompleted: [''],
      // New fields: whether user is willing to attend skill program and preferred mode
      willingForSkillProgram: [null, Validators.required],
      skillProgramMode: ['']
    });

    // Conditional validator: if willingForSkillProgram is true then skillProgramMode is required
    this.educationForm.get('willingForSkillProgram')?.valueChanges.subscribe(value => {
      const modeControl = this.educationForm.get('skillProgramMode');
      if (value === true) {
        modeControl?.setValidators([Validators.required]);
      } else {
        modeControl?.clearValidators();
      }
      modeControl?.updateValueAndValidity();
    });

    this.skillsAddressForm = this.fb.group({
      skills: [[], Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      taluka: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });

    this.documentsForm = this.fb.group({
      aadharNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{12}$/)]],
      hasUUID: [null, Validators.required],
      uuidNumber: [''],
      uuidCertificate: [null],
      disabilityCertificate: [null],
      disabilityCertificateDate: [''],
      disabilityCertificateOrg: ['']
    });

    // Conditional validators for document paths
    this.documentsForm.get('hasUUID')?.valueChanges.subscribe(value => {
      const uuidNumber = this.documentsForm.get('uuidNumber');
      const uuidCert = this.documentsForm.get('uuidCertificate');
      const disCert = this.documentsForm.get('disabilityCertificate');
      const disDate = this.documentsForm.get('disabilityCertificateDate');
      const disOrg = this.documentsForm.get('disabilityCertificateOrg');

      if (value === true) {
        uuidNumber?.setValidators([Validators.required]);
        uuidCert?.setValidators([Validators.required]);

        // Clear disability certificate validators
        disCert?.clearValidators();
        disDate?.clearValidators();
        disOrg?.clearValidators();
      } else {
        uuidNumber?.clearValidators();
        uuidCert?.clearValidators();

        disCert?.setValidators([Validators.required]);
        disDate?.setValidators([Validators.required]);
        disOrg?.setValidators([Validators.required]);
      }

      uuidNumber?.updateValueAndValidity();
      uuidCert?.updateValueAndValidity();
      disCert?.updateValueAndValidity();
      disDate?.updateValueAndValidity();
      disOrg?.updateValueAndValidity();
    });
  }

  // Custom validator for age
  private ageValidator(minAge: number) {
    return (control: AbstractControl) => {
      if (!control.value) return null;

      const birthDate = new Date(control.value);
      if (isNaN(birthDate.getTime())) return { invalidDate: true };

      const age = Math.floor((Date.now() - birthDate.getTime()) / 3.15576e+10);
      return age >= minAge ? null : { underage: { requiredAge: minAge, actualAge: age } };
    };
  }


  goToStep(step: number) {
    if (this.canGoToStep(step)) {
      this.currentStep = step;
    }
  }

  canGoToStep(step: number): boolean {
    if (step === 0) return true;
    if (step === 1) return this.personalInfoForm.valid;
    if (step === 2) return this.disabilityInfoForm.valid;
    if (step === 3) return this.educationForm.valid;
    if (step === 4) return this.skillsAddressForm.valid;
    return false;
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      // mark current step controls as touched so errors are displayed
      this.markCurrentStepTouched();
      if (this.isCurrentStepValid()) {
        this.currentStep++;
      }
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 0: return this.personalInfoForm.valid;
      case 1: return this.disabilityInfoForm.valid;
      case 2: return this.educationForm.valid;
      case 3: return this.skillsAddressForm.valid;
      case 4: return this.documentsForm.valid;
      default: return false;
    }
  }

  closeSuccessDialog() {
    this.showSuccessDialog = false;
    this.router.navigate(['/']);
  }

  onFileSelect(event: any, target: 'uuid' | 'disability' | 'government' = 'government') {
    const files = event.files || event.originalEvent?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (target === 'uuid') {
      this.selectedUuidFile = file;
      this.documentsForm.patchValue({ uuidCertificate: this.selectedUuidFile });
      this.documentsForm.get('uuidCertificate')?.updateValueAndValidity();
    } else if (target === 'disability') {
      this.selectedDisabilityFile = file;
      this.documentsForm.patchValue({ disabilityCertificate: this.selectedDisabilityFile });
      this.documentsForm.get('disabilityCertificate')?.updateValueAndValidity();
    } else {
      this.selectedFile = file;
    }
  }

  async submitRegistration() {
    // mark all controls across forms as touched to show validation
    this.personalInfoForm.markAllAsTouched();
    this.disabilityInfoForm.markAllAsTouched();
    this.educationForm.markAllAsTouched();
    this.skillsAddressForm.markAllAsTouched();
    this.documentsForm.markAllAsTouched();

    if (this.isFormValid()) {
      this.submitting = true;
      try {
        const registrationData: any = {
          personal_info: {
            name: this.personalInfoForm.value.name,
            email: this.personalInfoForm.value.email,
            phone: this.personalInfoForm.value.phone,
            date_of_birth: new Date(this.personalInfoForm.value.dateOfBirth).toISOString(),
            gender: this.personalInfoForm.value.gender
          },
          documents: {
            aadhar_number: this.documentsForm.value.aadharNumber,
            has_uuid: this.documentsForm.value.hasUUID,
            uuid_number: this.documentsForm.value.uuidNumber || undefined,
            // file URLs will be attached after upload
            uuid_certificate_url: undefined,
            disability_certificate_url: undefined
          },
          disability_info: {
            type: this.disabilityInfoForm.value.type,
            // store both descriptive severity (if selected) and numeric percentage
            severity: this.disabilityInfoForm.value.severity,
            disability_percentage: this.disabilityInfoForm.value.disabilityPercentage,
            // disability_due_to: this.disabilityInfoForm.value.disability_due_to,
            disability_by_birth: this.disabilityInfoForm.value.disability_by_birth, // Direct boolean value
          },
          education: {
            level: this.educationForm.value.level,
            institution: this.educationForm.value.institution || undefined,
            year_completed: this.educationForm.value.yearCompleted || undefined,
            willing_for_skill_program: this.educationForm.value.willingForSkillProgram,
            skill_program_mode: this.educationForm.value.skillProgramMode || undefined
          },
          skills: this.skillsAddressForm.value.skills,
          address: {
            street: this.skillsAddressForm.value.street,
            city: this.skillsAddressForm.value.city,
            state: this.skillsAddressForm.value.state,
            pincode: this.skillsAddressForm.value.pincode
          }
        };

        // Upload files if selected and attach URLs
        if (this.selectedFile) {
          const fileUrl = await this.supabaseService.uploadFile(this.selectedFile, 'government-ids');
          registrationData.government_id_url = fileUrl;
        }

        if (this.selectedUuidFile) {
          const uuidUrl = await this.supabaseService.uploadFile(this.selectedUuidFile, 'uuid-certificates');
          registrationData.documents.uuid_certificate_url = uuidUrl;
        }

        if (this.selectedDisabilityFile) {
          const disUrl = await this.supabaseService.uploadFile(this.selectedDisabilityFile, 'disability-certificates');
          registrationData.documents.disability_certificate_url = disUrl;
        }

        await this.supabaseService.createPWDRegistration(registrationData as PWDRegistration);

        this.showSuccessDialog = true;

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Registration submitted successfully!'
        });

      } catch (error: any) {
        console.error('Registration error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Registration failed. Please try again.'
        });
      } finally {
        this.submitting = false;
      }
    } else {
      // if documents tab is problematic, print debug info
      if (this.documentsForm.invalid) {
        this.debugDocumentsValidity();
      }
    }
  }

  // Debug helper: mark all controls touched and log invalid ones for documentsForm
  private debugDocumentsValidity() {
    Object.keys(this.documentsForm.controls).forEach(key => {
      const ctrl = this.documentsForm.get(key);
      ctrl?.markAsTouched();
    });

    const invalid = Object.keys(this.documentsForm.controls).filter(k => this.documentsForm.get(k)?.invalid);
    if (invalid.length) {
      console.warn('Documents form invalid controls:', invalid);
    } else {
      console.log('Documents form appears valid.');
    }
  }

  private isFormValid(): boolean {
    return this.personalInfoForm.valid &&
      this.disabilityInfoForm.valid &&
      this.educationForm.valid &&
      this.skillsAddressForm.valid &&
      this.documentsForm.valid;
  }

  // Mark controls for the active step as touched to surface validation errors
  private markCurrentStepTouched() {
    switch (this.currentStep) {
      case 0:
        this.personalInfoForm.markAllAsTouched();
        break;
      case 1:
        this.disabilityInfoForm.markAllAsTouched();
        break;
      case 2:
        this.educationForm.markAllAsTouched();
        break;
      case 3:
        this.skillsAddressForm.markAllAsTouched();
        break;
      case 4:
        this.documentsForm.markAllAsTouched();
        break;
    }
  }

  // Enhanced error handling
  private handleError(error: any, context: string) {
    console.error(`Error in ${context}:`, error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || `Operation failed in ${context}`
    });
  }

  // Custom validator to prevent future dates
  private futureDateValidator() {
    return (control: AbstractControl) => {
      if (!control.value) return null;

      const selectedDate = new Date(control.value);
      const today = new Date();

      if (selectedDate > today) {
        return { futureDate: true };
      }
      return null;
    };
  }



}