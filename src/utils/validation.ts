import {
  AGE_MAX,
  AGE_MIN,
  AL_MAX,
  AL_MIN,
  SE_MAX,
  SE_MIN,
  VA_DENOM_MAX,
  VA_DENOM_MIN,
  formatVa,
  isValidAge,
  isValidAl,
  isValidSe,
  isValidUsualVa,
  isValidVa,
  normalizeUsualVa,
} from '../constants/clinicalCharts';

export {
  AGE_MAX,
  AGE_MIN,
  AL_MAX,
  AL_MIN,
  SE_MAX,
  SE_MIN,
  USUAL_VA_DENOMS,
  VA_DENOM_MAX,
  VA_DENOM_MIN,
  formatVa,
  isValidAge,
  isValidAl,
  isValidSe,
  isValidUsualVa,
  isValidVa,
  normalizeUsualVa,
} from '../constants/clinicalCharts';

export function digitsOnly(value: string, maxLen?: number) {
  const d = String(value || '').replace(/\D/g, '');
  return maxLen != null ? d.slice(0, maxLen) : d;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function isValidMobile(mobile: string) {
  return /^[6-9]\d{9}$/.test(String(mobile || '').trim());
}

export function isValidPassword(password: string) {
  return String(password || '').length >= 8;
}

export function isValidOtp(otp: string) {
  return /^\d{4}$/.test(String(otp || '').trim());
}

export function isValidDateISO(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** Completed years between DOB and as-of date (defaults to today). */
export function ageYearsFromDob(dobIso: string, asOfIso?: string): number | null {
  if (!isValidDateISO(dobIso)) return null;
  const [y, m, d] = dobIso.split('-').map(Number);
  const dob = new Date(y, m - 1, d);
  let asOf: Date;
  if (asOfIso && isValidDateISO(asOfIso)) {
    const [ay, am, ad] = asOfIso.split('-').map(Number);
    asOf = new Date(ay, am - 1, ad);
  } else {
    asOf = new Date();
  }
  if (dob > asOf) return null;
  let age = asOf.getFullYear() - dob.getFullYear();
  const md = asOf.getMonth() - dob.getMonth();
  if (md < 0 || (md === 0 && asOf.getDate() < dob.getDate())) age -= 1;
  return age;
}

/** DOB picker bounds so age stays within AGE_MIN–AGE_MAX as of `asOf`. */
export function dobPickerBounds(asOfIso?: string): { minimumDate: Date; maximumDate: Date } {
  let asOf: Date;
  if (asOfIso && isValidDateISO(asOfIso)) {
    const [ay, am, ad] = asOfIso.split('-').map(Number);
    asOf = new Date(ay, am - 1, ad);
  } else {
    asOf = new Date();
  }
  return {
    minimumDate: new Date(asOf.getFullYear() - AGE_MAX, asOf.getMonth(), asOf.getDate()),
    maximumDate: new Date(asOf.getFullYear() - AGE_MIN, asOf.getMonth(), asOf.getDate()),
  };
}

export function required(value: string, label: string): string | null {
  if (!String(value || '').trim()) return `${label} is required`;
  return null;
}

export type FieldErrors = Record<string, string>;

export function validateRegister(form: {
  doctor_name: string;
  center_name: string;
  address: string;
  mobile: string;
  email: string;
  mci_registration_no: string;
  password: string;
  confirm_password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const r = (key: string, label: string, val: string) => {
    const msg = required(val, label);
    if (msg) errors[key] = msg;
  };

  r('doctor_name', 'Doctor name', form.doctor_name);
  r('center_name', 'Center name', form.center_name);
  r('address', 'Address', form.address);
  r('mobile', 'Mobile', form.mobile);
  r('email', 'Email', form.email);
  r('mci_registration_no', 'Registration number', form.mci_registration_no);
  r('password', 'Password', form.password);
  r('confirm_password', 'Confirm password', form.confirm_password);

  if (!errors.mobile && !isValidMobile(form.mobile)) {
    errors.mobile = 'Enter a valid 10-digit mobile number';
  }
  if (!errors.email && !isValidEmail(form.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!errors.password && !isValidPassword(form.password)) {
    errors.password = 'Password must be at least 8 characters';
  }
  if (
    !errors.confirm_password &&
    form.password &&
    form.confirm_password &&
    form.password !== form.confirm_password
  ) {
    errors.confirm_password = 'Passwords do not match';
  }
  return errors;
}

export function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateChildInfo(info: {
  child_name: string;
  parent_mobile: string;
  dob: string;
  age: string;
  first_assessment_date: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!info.child_name.trim()) errors.child_name = 'Child name is required';
  if (!info.parent_mobile.trim()) errors.parent_mobile = 'Contact number is required';
  else if (!isValidMobile(info.parent_mobile)) {
    errors.parent_mobile = 'Enter a valid 10-digit contact number';
  }
  if (!info.first_assessment_date.trim()) {
    errors.first_assessment_date = 'Assessment date is required';
  } else if (!isValidDateISO(info.first_assessment_date)) {
    errors.first_assessment_date = 'Please select a valid assessment date';
  }
  if (!info.dob.trim()) {
    errors.dob = 'Date of birth is required';
  } else if (!isValidDateISO(info.dob)) {
    errors.dob = 'Please select a valid date of birth';
  } else {
    const years = ageYearsFromDob(info.dob, info.first_assessment_date || undefined);
    if (years == null || years < AGE_MIN || years > AGE_MAX) {
      errors.dob = `Child age must be ${AGE_MIN}–${AGE_MAX} years (from date of birth)`;
    }
  }
  if (!info.age.trim()) {
    errors.age = `Age is required (${AGE_MIN}–${AGE_MAX})`;
  } else if (!isValidAge(info.age)) {
    errors.age = `Age must be between ${AGE_MIN} and ${AGE_MAX}`;
  } else if (!errors.dob && isValidDateISO(info.dob)) {
    const years = ageYearsFromDob(info.dob, info.first_assessment_date || undefined);
    if (years != null && Number(info.age) !== years) {
      errors.age = `Age should be ${years} based on date of birth`;
    }
  }
  return errors;
}

export function firstError(errors: FieldErrors): string | null {
  const keys = Object.keys(errors);
  return keys.length ? errors[keys[0]] : null;
}

/**
 * Same rule for VA / SE / AL / BV while typing:
 * digits and + - . / only — no letters.
 * Examples: 6/6, 6/7.5, -2.50, +1.00, 0.00, 23.50, 4, 5
 */
export function sanitizeClinical(input: string): string {
  const raw = String(input || '');
  let out = '';
  let i = 0;
  if (raw[0] === '+' || raw[0] === '-') {
    out = raw[0];
    i = 1;
  }
  let seenSlash = false;
  let seenDot = false;
  let digitCount = 0;
  for (; i < raw.length; i++) {
    const ch = raw[i];
    if (ch >= '0' && ch <= '9') {
      if (digitCount < 8) {
        out += ch;
        digitCount++;
      }
    } else if (ch === '/' && !seenSlash && digitCount > 0) {
      out += '/';
      seenSlash = true;
      seenDot = false;
    } else if (ch === '.' && !seenDot && digitCount > 0) {
      out += '.';
      seenDot = true;
    }
  }
  return out.slice(0, 12);
}

/** Complete value: number, signed decimal, or Snellen like 6/7.5 */
export function isValidClinical(value: string) {
  const v = String(value || '').trim();
  if (!v) return false;
  return (
    /^[+-]?\d{1,3}(?:\.\d{1,2})?$/.test(v) ||
    /^\d{1,2}\/\d{1,2}(?:\.\d)?$/.test(v)
  );
}

/**
 * Binocular vision is NOT the same as VA.
 * Allowed: N (normal), short grade/number (e.g. 2, 40), or Snellen 6/x.
 */
export function isValidBv(value: string) {
  const v = String(value || '').trim();
  if (!v || v.length > 10) return false;
  if (/^n$/i.test(v)) return true;
  if (isValidVa(v)) return true;
  if (/^\d{1,4}"?$/.test(v)) return true;
  if (/^[A-Za-z]{1,4}$/.test(v)) return true;
  return false;
}

/** BV typing: letters (N), digits, slash, dot, quote */
export function sanitizeBv(input: string): string {
  return String(input || '')
    .replace(/[^0-9A-Za-z/."']/g, '')
    .slice(0, 10);
}

export function clinicalFormatError(
  label: string,
  od: string,
  os: string,
  required = true,
  kind?: 'va' | 'se' | 'al' | 'bv',
): string | null {
  const odT = String(od || '').trim();
  const osT = String(os || '').trim();
  if (required && (!odT || !osT)) {
    return `${label} OD and OS are required`;
  }
  const isVa =
    kind === 'va' || (/\(va\)/i.test(label) && !/binocular/i.test(label));
  const isBv = kind === 'bv' || /binocular/i.test(label);
  const check = (side: string, val: string) => {
    if (!val) return null;
    if (isBv) {
      if (!isValidBv(val)) {
        return `${side} binocular vision: use N, a short grade (e.g. 2), or Snellen 6/6`;
      }
      return null;
    }
    if (isVa) {
      if (!isValidVa(val)) {
        return `${side} VA must be Snellen 6/${VA_DENOM_MIN} to 6/${VA_DENOM_MAX} (e.g. 6/6, 6/9, 6/18)`;
      }
      return null;
    }
    if (kind === 'se') {
      if (!isValidClinical(val) || !isValidSe(val)) {
        return `${side} SE must be between ${SE_MIN.toFixed(2)} and +${SE_MAX.toFixed(2)} D`;
      }
      return null;
    }
    if (kind === 'al') {
      if (!isValidClinical(val) || !isValidAl(val)) {
        return `${side} axial length must be between ${AL_MIN} and ${AL_MAX} mm`;
      }
      return null;
    }
    if (!isValidClinical(val)) {
      return `Enter a valid ${label} for ${side} (e.g. -2.50, 23.50)`;
    }
    return null;
  };
  return check('OD', odT) || check('OS', osT);
}

export function ageFormatError(age: string | number | null | undefined, required = true): string | null {
  const raw = String(age ?? '').trim();
  if (!raw) return required ? `Age is required (${AGE_MIN}–${AGE_MAX})` : null;
  if (!isValidAge(raw)) return `Age must be between ${AGE_MIN} and ${AGE_MAX}`;
  return null;
}

/** Normalize VA to `6/…` form; keep typed denom (any 6/3–6/60). */
export function canonicalizeVaPair(od: string, os: string): { od: string; os: string } {
  return {
    od: formatVa(od) || String(od || '').trim(),
    os: formatVa(os) || String(os || '').trim(),
  };
}
