export const code = async (inputs) => {
  const pdfMake = require('pdfmake/build/pdfmake');
  const pdfFonts = require('pdfmake/build/vfs_fonts');
  pdfMake.vfs = pdfFonts;

  const d = inputs.invoiceData;
  const v = Array.isArray(d.lines) ? d.lines : d.lines ? JSON.parse(d.lines) : [];
  const c = d.customer ?? {};

  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const YY = String(now.getFullYear()).slice(-2);
  const MM = pad(now.getMonth() + 1);
  const DD = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  const invoiceNumber = `INV-${YY}${MM}(${DD}${hh}${mm}${ss})`;
  const invoiceDate = d.inv_date || new Date().toISOString().split('T')[0];

  const lines = v.map((line, i) => [
    { text: String(i + 1), alignment: 'center', color: '#94a3b8', fontSize: 10 },
    { text: line.description ?? '', fontSize: 10 },
    { text: `MYR ${parseFloat(line.price ?? 0).toFixed(2)}`, alignment: 'right', fontSize: 10 },
  ]);

  const total = v.reduce((sum, line) => sum + parseFloat(line.price || 0), 0);

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
            d.logo_base64
              ? { image: d.logo_base64, width: 130 }
              : { text: 'STARK', fontSize: 18, color: '#0f172a' },
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
            { columns: [{ text: 'Invoice Ref.',      color: '#94a3b8', fontSize: 10, width: '*' }, { text: invoiceNumber,                alignment: 'right', fontSize: 10, width: 'auto' }], margin: [0, 2] },
            { columns: [{ text: 'Invoice Date',     color: '#94a3b8', fontSize: 10, width: '*' }, { text: invoiceDate,          alignment: 'right', fontSize: 10, width: 'auto' }], margin: [0, 2] },
            { columns: [{ text: 'Payment Terms',  color: '#94a3b8', fontSize: 10, width: '*' }, { text: `Net ${c.terms ?? ''} Days`, alignment: 'right', fontSize: 10, width: 'auto' }], margin: [0, 2] }
          ],
          alignment: 'right',
          width: 200,
        },
      ],
       },
      // Divider
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: '#e2e8f0' }], margin: [0, 0, 0, 16] },

      // ── INVOICE TO ──────────────────────────────────────────────
      {
        table: {
          widths: ['*'],
          body: [[{
            stack: [
              { text: 'INVOICE TO', fontSize: 8, color: '#94a3b8', characterSpacing: 1.5, margin: [0, 0, 0, 4] },
              { text: c.customer_name ?? d.customer_name ?? '', fontSize: 13, color: '#0f172a', margin: [0, 0, 0, 6] },
              { columns: [{ text: 'Account Code', color: '#94a3b8', fontSize: 9.5, width: 90 }, { text: c.account_code ?? '',    fontSize: 9.5 }] },
              { columns: [{ text: 'Address',      color: '#94a3b8', fontSize: 9.5, width: 90 }, { text: c.address ?? '',        fontSize: 9.5 }] },
              { columns: [{ text: 'Attn',         color: '#94a3b8', fontSize: 9.5, width: 90 }, { text: c.contact_person ?? '', fontSize: 9.5 }] },
              { columns: [{ text: 'Phone',        color: '#94a3b8', fontSize: 9.5, width: 90 }, { text: c.phone ?? '',          fontSize: 9.5 }] },
              { columns: [{ text: 'Email',        color: '#94a3b8', fontSize: 9.5, width: 90 }, { text: c.email ?? '',          fontSize: 9.5 }] },
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
              { text: 'NO.',              fontSize: 9, color: '#ffffff', fillColor: '#0f172a', alignment: 'center', margin: [0, 6] },
              { text: 'DESCRIPTION',      fontSize: 9, color: '#ffffff', fillColor: '#0f172a', margin: [0, 6] },
              { text: 'TOTAL (MYR)', fontSize: 9, color: '#ffffff', fillColor: '#0f172a', alignment: 'right',  margin: [0, 6] },
            ],
            ...lines,
            [
              { text: 'GRAND TOTAL', colSpan: 2, alignment: 'right', fontSize: 10, bold: true, fillColor: '#f1f5f9' },
              {},
              { text: `MYR ${total.toFixed(2)}`, alignment: 'right', fontSize: 10, bold: true, fillColor: '#f1f5f9' }
            ],
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
        margin: [0, 0, 0, 20],
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

      // ── TERMS & CONDITIONS ─────────────────────────────────────
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#cbd5e1', dash: { length: 4 } }], margin: [0, 0, 0, 12] },
      { text: 'TERMS & CONDITIONS', fontSize: 8, color: '#94a3b8', characterSpacing: 1.5, margin: [0, 0, 0, 10] },
      {
        columns: [
          {
            stack: [
              { text: 'PAYMENT TERMS', fontSize: 8, color: '#94a3b8', characterSpacing: 1 },
              { text: `Net ${c.terms ?? ''} Days`, fontSize: 11, color: '#0f172a', margin: [0, 3] },
            ],
          },
          {
            stack: [
              { text: 'SERVICE TERMS', fontSize: 8, color: '#94a3b8', characterSpacing: 1 },
              { text: 'https://starkautomate.com/terms-and-conditions', fontSize: 11, color: '#0f172a', margin: [0, 3], link: 'https://starkautomate.com/terms-and-conditions' },
            ],
          },
          {
            stack: [
              { text: 'PREPARED BY', fontSize: 8, color: '#94a3b8', characterSpacing: 1 },
              { text: d.prepared_by ?? 'Stark Automate Solutions', fontSize: 11, color: '#0f172a', margin: [0, 3] },
            ],
          },
        ],
        columnGap: 16,
      },
    ],

    footer: (currentPage, pageCount) => ({
      text: `This invoice is computer generated. No signature is required. | Stark Automate Solutions | starlk@starkautomate.com | Page (${currentPage}/${pageCount})`,
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
    filename: `INV-${invoiceNumber}.pdf`,
  };
};