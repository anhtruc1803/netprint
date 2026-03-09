// ----------------------------------------------------------------------

export const _invoices = [];

export const INVOICE_STATUS_OPTIONS = [
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'pending', label: 'Đang chờ' },
    { value: 'overdue', label: 'Quá hạn' },
    { value: 'draft', label: 'Nháp' },
];

export const INVOICE_SERVICE_OPTIONS = [
    { value: 1, label: 'Design' },
    { value: 2, label: 'Development' },
    { value: 3, label: 'Testing' },
    { value: 4, label: 'Deployment' },
    { value: 5, label: 'Maintenance' },
];
