export type PasswordCheck = {
  id: 'length' | 'letter' | 'number';
  label: string;
  passed: boolean;
};

export function checkPassword(value: string): PasswordCheck[] {
  return [
    { id: 'length', label: 'At least 8 characters', passed: value.length >= 8 },
    { id: 'letter', label: 'Contains a letter', passed: /[a-zA-Z]/.test(value) },
    { id: 'number', label: 'Contains a number', passed: /\d/.test(value) }
  ];
}

export function passwordIsStrong(value: string): boolean {
  return checkPassword(value).every((c) => c.passed);
}
