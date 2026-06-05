export function formatRut(rut: string): string {
  let clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  
  const kIndex = clean.indexOf('K');
  if (kIndex !== -1) {
    const beforeK = clean.substring(0, kIndex).replace(/[^0-9]/g, '');
    clean = beforeK + 'K';
  } else {
    clean = clean.replace(/[^0-9]/g, '');
  }
  
  if (clean.length > 9) {
    clean = clean.substring(0, 9);
  }

  if (clean.length === 0) return '';
  if (clean.length === 1) return clean;
  
  const dv = clean.slice(-1);
  let body = clean.slice(0, -1);
  
  body = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  return `${body}-${dv}`;
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  let clean = phone.replace(/[^\d+]/g, '');
  
  if (clean.length > 0 && !clean.startsWith('+')) {
    clean = '+' + clean;
  }

  if (clean.length >= 3) {
    const country = clean.substring(0, 3);
    const body = clean.substring(3);
    
    if (body.length > 0) {
      const first = body.substring(0, 1);
      const rest = body.substring(1);
      
      const chunks = [];
      for (let i = 0; i < rest.length; i += 4) {
        chunks.push(rest.substring(i, i + 4));
      }
      
      if (chunks.length > 0) {
        return `${country} ${first} ${chunks.join(' ')}`;
      }
      return `${country} ${first}`;
    }
  }
  
  return clean;
}

export function formatMoney(amount: number | string): string {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(amount));
}

export const formatCLP = formatMoney;

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-CL');
}

export function formatPlate(value: string): string {
  if (!value) return '';
  const upper = value.toUpperCase();
  const clean = upper.replace(/[^A-Z0-9]/g, '');
  
  if (clean.length === 6) {
    if (/^[A-Z]{4}[0-9]{2}$/.test(clean)) {
      return `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 6)}`;
    }
    if (/^[A-Z]{2}[0-9]{4}$/.test(clean)) {
      return `${clean.slice(0, 2)}-${clean.slice(2, 6)}`;
    }
  }

  if (clean.length > 2 && clean.length <= 4) {
    return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  }
  
  return upper;
}
