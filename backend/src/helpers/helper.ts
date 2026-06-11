export const parseBooleanValue = (value?: string | null): boolean => {
  if (!value) return false;
  return value.toLowerCase() === 'true';
};
