import Swal from 'sweetalert2';

interface ConfirmDeleteOptions {
  title?: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
}

export function confirmDelete({
  title = '¿Estás seguro?',
  text = 'No podrás revertir esta acción',
  confirmButtonText = 'Sí, eliminar',
  cancelButtonText = 'Cancelar',
  onConfirm
}: ConfirmDeleteOptions) {
  Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6366f1',
    confirmButtonText,
    cancelButtonText,
    background: 'var(--sf-dark-card)',
    color: '#fff',
    customClass: {
      popup: 'border border-[var(--sf-border)] rounded-2xl shadow-2xl',
      confirmButton: 'rounded-xl px-4 py-2 font-bold',
      cancelButton: 'rounded-xl px-4 py-2 font-bold'
    }
  }).then((result) => {
    if (result.isConfirmed) {
      onConfirm();
    }
  });
}
