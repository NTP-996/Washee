// VND is a zero-decimal currency; group digits and append the ₫ sign.
export function formatVnd(n: number): string {
  return `${n.toLocaleString('vi-VN')}₫`;
}
