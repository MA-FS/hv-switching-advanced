# High Voltage Switching Program Creator

This tool allows you to create, edit, and export high voltage switching programs in an intuitive spreadsheet-like interface.

Currently deployed at https://ma-fs.github.io/HV-Coach-HV-Switching-Programs/

## Features
- Dynamic row management: Add, delete, and reorder rows
- Drag and drop functionality for easy row reordering
- Resizable columns for customized view
- Automatic item numbering
- Reverse section support
- Export to PDF with custom formatting
- User-friendly and elegant design

## How to Use

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the application: `npm start`
4. Open the application in your browser (usually at `http://localhost:3000`)

### Creating a Switching Program

1. Fill out the information form at the top of the page with relevant details.
2. Use the table below to create your switching program:
   - Click "Add Row" to add a new row to the table.
   - Use "Copy From Above" to duplicate the last row (excluding certain fields).
   - Click "Reverse" to add a reverse section (can only be done once per program).

### Editing the Table

- Click and drag column headers to resize them.
- Click and drag rows to reorder them.
- Use the delete button (red X) at the end of each row to remove it.
- The "Type" column automatically converts input to uppercase.

### Reverse Section

- The "Reverse" button adds a special reverse section to your program.
- This section includes a row before and after the "REVERSE" row.
- Item numbering automatically adjusts for the reverse section.

### Exporting to PDF

1. Click the "Export to PDF" button.
2. The PDF will be generated with the following features:
   - Company logo and program title on each page
   - Form data displayed at the top of the first page
   - Table contents with appropriate formatting
   - "REVERSE" text in bold and underlined
   - Page numbers in the footer
3. The PDF will be saved with a filename format: `preparedby_program_programno_date.pdf`

## Contributing

Feel free to submit issues or pull requests. We welcome contributions to improve this tool.

## License

This project is licensed under the MIT License

MIT License

Copyright (c) 2024 MA-FS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
