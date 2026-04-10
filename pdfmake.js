export const code = async (inputs) => {
  const pdfMake = require('pdfmake/build/pdfmake');
  const pdfFonts = require('pdfmake/build/vfs_fonts');
  pdfMake.vfs = pdfFonts;

  const d = inputs;
  const lines = (d.invoice_lines ?? []).map((line, i) => [
    { text: String(i + 1), alignment: 'center', color: '#94a3b8', fontSize: 10 },
    { text: line.description ?? '', fontSize: 10 },
    { text: `MYR ${parseFloat(line.amount ?? 0).toFixed(2)}`, alignment: 'right', fontSize: 10 },
  ]);

  const subtotal   = (d.invoice_lines ?? []).reduce((s, l) => s + parseFloat(l.amount ?? 0), 0);
  const taxRate    = parseFloat(d.tax_rate ?? 0);
  const taxAmount  = subtotal * (taxRate / 100);
  const discount   = parseFloat(d.discount_amount ?? 0);
  const grandTotal = subtotal + taxAmount - discount; 

  const fmt = (n) => n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 50],
    defaultStyle: { font: 'Roboto', fontSize: 11, color: '#1e293b' },

    content: [

      // ── HEADER ───────────────────────────────────────────────
      {
        columns: [
          {
            stack: [
              // Logo — pass logo_base64 from a prior HTTP Request step
              d.logo_base64
                ? { image: d.logo_base64, width: 130 }
                : { text: 'Starkautomate', fontSize: 18, color: '#0f172a' },
              { text: 'Automate Smarter. Grow Faster.', fontSize: 9, color: '#94a3b8', margin: [0, 5, 0, 0] },
            ],
          },
          {
            stack: [
              {
                table: {
                  body: [[{
                    text: 'INVOICE',
                    fontSize: 18,
                    color: '#ffffff',
                    fillColor: '#0f172a',
                    alignment: 'right',
                    margin: [12, 6, 12, 6],
                    border: [false, false, false, false],
                  }]]
                },
                layout: 'noBorders',
                alignment: 'right',
                margin: [0, 0, 0, 10],
              },
              { columns: [{ text: 'Invoice No.', color: '#94a3b8', fontSize: 10, width: '*' }, { text: d.invoice_number ?? '', alignment: 'right', fontSize: 10, width: 'auto' }], margin: [0, 2] },
              { columns: [{ text: 'Invoice Date', color: '#94a3b8', fontSize: 10, width: '*' }, { text: d.invoice_date ?? '', alignment: 'right', fontSize: 10, width: 'auto' }], margin: [0, 2] },
              { columns: [{ text: 'Payment Terms', color: '#94a3b8', fontSize: 10, width: '*' }, { text: `Net ${d.invoice_due_days ?? ''} Days`, alignment: 'right', fontSize: 10, width: 'auto' }], margin: [0, 2] },
              { columns: [{ text: 'Due Date', color: '#4f46e5', fontSize: 10, width: '*' }, { text: d.invoice_due_date ?? '', color: '#4f46e5', alignment: 'right', fontSize: 10, width: 'auto' }], margin: [0, 2] },
            ],
            alignment: 'right',
            width: 220,
          },
        ],
        columnGap: 20,
        margin: [0, 0, 0, 16],
      },

      // Divider
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#e2e8f0' }], margin: [0, 0, 0, 16] },

      // ── BILL TO ───────────────────────────────────────────────
      {
        table: {
          widths: ['*'],
          body: [[{
            stack: [
              { text: 'BILL TO', fontSize: 8, color: '#94a3b8', characterSpacing: 1.5, margin: [0, 0, 0, 4] },
              { text: d.customer_name ?? '', fontSize: 13, color: '#0f172a', margin: [0, 0, 0, 6] },
              { columns: [{ text: 'Account Code', color: '#94a3b8', fontSize: 9.5, width: 90 }, { text: d.customer_account_code ?? '', fontSize: 9.5 }] },
              { columns: [{ text: 'Address', color: '#94a3b8', fontSize: 9.5, width: 90 }, { text: d.customer_address ?? '', fontSize: 9.5 }] },
              { columns: [{ text: 'Attn', color: '#94a3b8', fontSize: 9.5, width: 90 }, { text: d.contact_person ?? '', fontSize: 9.5 }] },
              { columns: [{ text: 'Phone', color: '#94a3b8', fontSize: 9.5, width: 90 }, { text: d.phone_number ?? '', fontSize: 9.5 }] },
              { columns: [{ text: 'Email', color: '#94a3b8', fontSize: 9.5, width: 90 }, { text: d.email ?? '', fontSize: 9.5 }] },
            ],
            fillColor: '#f8fafc',
            margin: [14, 14, 14, 14],
            border: [true, false, false, false],
            borderColor: ['#0f172a', '', '', ''],
          }]]
        },
        layout: { defaultBorder: false },
        margin: [0, 0, 0, 20],
      },

      // ── ITEMS TABLE ────────────────────────────────────────────
      {
        table: {
          headerRows: 1,
          widths: [36, '*', 110],
          body: [
            [
              { text: 'NO.', fontSize: 9, color: '#ffffff', fillColor: '#0f172a', alignment: 'center', margin: [0, 6] },
              { text: 'DESCRIPTION', fontSize: 9, color: '#ffffff', fillColor: '#0f172a', margin: [0, 6] },
              { text: 'AMOUNT (MYR)', fontSize: 9, color: '#ffffff', fillColor: '#0f172a', alignment: 'right', margin: [0, 6] },
            ],
            ...lines,
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 0 : 0.5,
          hLineColor: () => '#f1f5f9',
          vLineWidth: () => 0,
          fillColor: (i) => (i > 0 && i % 2 === 0) ? '#fafafe' : null,
          paddingTop: () => 8,
          paddingBottom: () => 8,
        },
        margin: [0, 0, 0, 0],
      },

      // ── TOTALS ─────────────────────────────────────────────────
      {
        table: {
          widths: ['*', 130, 110],
          body: [
            ['', { text: 'Subtotal', color: '#64748b', fontSize: 11 }, { text: `MYR ${fmt(subtotal)}`, alignment: 'right', fontSize: 11 }],
            ['', { text: `SST (${taxRate}%)`, color: '#64748b', fontSize: 11 }, { text: `MYR ${fmt(taxAmount)}`, alignment: 'right', fontSize: 11 }],
            ['', { text: 'Discount', color: '#64748b', fontSize: 11 }, { text: `– MYR ${fmt(discount)}`, alignment: 'right', fontSize: 11 }],
            [
              '',
              { text: 'Grand Total', fontSize: 12, color: '#ffffff', fillColor: '#0f172a', margin: [10, 8] },
              { text: `MYR ${fmt(grandTotal)}`, fontSize: 12, color: '#ffffff', fillColor: '#0f172a', alignment: 'right', margin: [0, 8, 10, 8] },
            ],
          ],
        },
        layout: {
          defaultBorder: false,
          hLineWidth: (i) => i === 3 ? 0.5 : 0,
          hLineColor: () => '#e2e8f0',
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
        margin: [0, 2, 0, 20],
      },

      // ── REMARKS ────────────────────────────────────────────────
      {
        table: {
          widths: ['*'],
          body: [[{
            stack: [
              { text: 'REMARKS', fontSize: 8, color: '#94a3b8', characterSpacing: 1.5, margin: [0, 0, 0, 4] },
              { text: d.remarks ?? '', fontSize: 10, color: '#78716c', lineHeight: 1.5 },
            ],
            fillColor: '#fffbeb',
            margin: [12, 12, 12, 12],
            border: [true, false, false, false],
            borderColor: ['#f59e0b', '', '', ''],
          }]]
        },
        layout: { defaultBorder: false },
        margin: [0, 0, 0, 20],
      },

      // ── PAYMENT DETAILS ────────────────────────────────────────
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#cbd5e1', dash: { length: 4 } }], margin: [0, 0, 0, 12] },
      { text: 'PAYMENT DETAILS', fontSize: 8, color: '#94a3b8', characterSpacing: 1.5, margin: [0, 0, 0, 10] },
      {
        columns: [
          {
            stack: [
              { text: 'BANK NAME', fontSize: 8, color: '#94a3b8', characterSpacing: 1 },
              { text: d.bank_name ?? '', fontSize: 11, color: '#0f172a', margin: [0, 3] },
            ],
            margin: [0, 0, 0, 6],
          },
          {
            stack: [
              { text: 'ACCOUNT NAME', fontSize: 8, color: '#94a3b8', characterSpacing: 1 },
              { text: d.bank_account_name ?? '', fontSize: 11, color: '#0f172a', margin: [0, 3] },
            ],
          },
          {
            stack: [
              { text: 'ACCOUNT NUMBER', fontSize: 8, color: '#94a3b8', characterSpacing: 1 },
              { text: d.bank_account_number ?? '', fontSize: 11, color: '#0f172a', margin: [0, 3] },
            ],
          },
        ],
        columnGap: 16,
      },
    ],

    footer: (currentPage, pageCount) => ({
      text: `This is a computer-generated invoice and does not require a signature.  |  Stark Automate Solutions  |  hello@starkautomate.com  |  Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      color: '#cbd5e1',
      margin: [40, 10, 40, 0],
    }),
  };

  const pdfBuffer = await pdfMake.createPdf(docDefinition).getBuffer();

  const base64 = Buffer.from(pdfBuffer).toString('base64');

  return {
    data_url: `data:application/pdf;base64,${base64}`,
    base64,
    mimeType: 'application/pdf',
    filename: `Invoice-${d.invoice_number ?? 'draft'}.pdf`,
  };
};