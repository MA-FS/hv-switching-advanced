# High Voltage Switching Program Creator

<img src="switching-program/public/logo.PNG" alt="HV Switching Program Creator Logo" width="200"/>

## Overview

The HV Switching Program Creator is a specialized web application designed for electrical engineers, technicians, and operators to create, edit, and manage high voltage switching programs. It provides an intuitive spreadsheet-like interface that simplifies the complex task of creating detailed switching sequences for high voltage electrical equipment.

Currently deployed at https://ma-fs.github.io/hv-switching-advanced/

## Key Features

- **Intuitive Spreadsheet Interface**: Create and edit switching steps in a familiar table format with columns for Operator, Location, Apparatus (kV, Type, Label), Instruction, Time, and Initial.
- **Dynamic Row Management**:
    - Add new empty rows easily.
    - Copy the contents of the row directly above to speed up repetitive entries.
    - Delete individual rows.
    - **Drag & Drop Reordering**: Effortlessly rearrange steps by dragging and dropping rows. Visual cues indicate the row being dragged and potential drop locations.
    - **Advanced Insertion**: Click the '+' icon on any row to open a context menu allowing you to insert a new row *Above*, *Below*, or *Duplicate* the current row.
- **Resizable Columns**: Adjust column widths by dragging the header dividers to customize your view.
- **Reverse Section Support**:
    - Add a dedicated "Reverse" section with a single click (only one reverse section allowed).
    - The reverse section is visually distinct and its rows are automatically marked and non-editable/non-draggable.
    - Delete the entire reverse section if needed via a button within the section divider.
- **Undo/Redo Functionality**: Step backwards and forwards through your changes (adds, deletes, edits, moves, inserts, reverse section management) using the Undo and Redo buttons.
- **Professional PDF Export**:
    - Generate multi-page, landscape A4 PDF documents of the complete switching program.
    - **Custom Header**: Includes company logo, program title, preparer name, and program number on every page.
    - **Detailed Information**: Displays Location, Work Description, and a signature block (Prepared, Checked, Authorised) on the first page.
    - **Formatted Table**: Presents switching steps clearly, including the merged "Apparatus" header and automatic step numbering.
    - **Reverse Section in PDF**: The "REVERSE" indication is clearly formatted within the PDF table.
    - **Pagination & Footer**: Automatic page numbering (`Page X of Y`) and branding in the footer of every page.
    - **Standardized Filename**: Saves PDFs with a consistent filename convention (`preparedby_program_programno_date.pdf`).
- **Program Management**: Save, load, and manage multiple switching programs (Note: Implementation details may vary depending on backend/local storage setup).
- **Optimized UI/UX**:
    - Dark theme suitable for various lighting conditions.
    - Responsive design for usability on desktops and tablets.
    - Touch/Scroll detection prevents accidental clicks/drags while scrolling on touch devices.
- **Form Information**: Fill out all form fields at the top (Name, Program No, Location, Work Description, Signatures, Dates, Drawings) for comprehensive PDF documentation.
- **Use Consistent Terminology**: Maintain consistent naming conventions for equipment across all steps (Operator, Location, Label, Type).
- **Automatic Step Numbering**: The application automatically numbers the steps sequentially, correctly handling the presence of a Reverse Section.
- **Editing**: Click directly into cells to edit their content. The 'kV' field automatically converts input to uppercase.
- **Column Organization**:
  - **Operator**: Person responsible for the specific step
  - **Location**: Physical location where the action takes place
  - **kV**: Voltage level of the equipment being operated
  - **Type**: Type of equipment (CB, DS, ES, etc.)
  - **Label**: Unique identifier for the equipment
  - **Instruction**: Detailed description of the action
  - **Time**: When the action was completed
  - **Initial**: Operator's initials signifying completion of the action.

### 3. Advanced Features

- **Drag & Drop**: Click and hold the grip handle (<i class="bi bi-grip-vertical"></i>) on the left of a row to drag it to a new position. Not applicable to rows within the Reverse Section.
- **Inserting Rows**: Click the plus icon (<i class="bi bi-plus-circle-fill"></i>) on a row to open the insert menu (Insert Above, Insert Below, Duplicate). This is disabled for rows within the Reverse Section.
- **Reverse Sections**: Use the "Reverse" button to add the dedicated, non-editable reverse sequence block. Plan your main sequence first.
- **Undo/Redo**: Don't worry about mistakes! Use the Undo (<i class="bi bi-arrow-counterclockwise"></i>) and Redo (<i class="bi bi-arrow-clockwise"></i>) buttons to navigate through your edit history.
- **Creating Complex Programs**:
  - For parallel operations, create clear demarcations between different paths
  - Use the insert function to add verification steps at key points
  - Export to PDF for review before finalizing
- **PDF Export**: Click the export button (often triggered externally) to generate the final PDF document for review, approval, and field use. Review the generated PDF carefully.
- **Managing Multiple Programs**: 
  - Save programs with descriptive names
  - Use the program management features to organize and retrieve programs

### 4. Best Practices for HV Switching

- **Verification Steps**: Include verification steps between critical operations
- **Lock-Out Tag-Out (LOTO)**: Document application and removal of locks and tags
- **Communication Points**: Identify when operators need to communicate with others
- **Test Points**: Include voltage testing steps before earthing
- **Emergency Procedures**: Include steps for handling abnormal situations

### 5. PDF Export Tips

- The export feature creates professional PDFs, ensuring all entered information is captured:
  - Company logo (if configured) and program title appear on each page header.
  - Program details (Name, Program No) appear in the header.
  - Form data (Location, Work Description, Signatures, Dates, Drawings) is displayed in tables at the top of the first page.
  - The main switching steps table is clearly formatted with automatic step numbering.
  - "REVERSE" text is clearly highlighted within the main table for the reverse section.
  - Page numbers (`Page X of Y`) and branding (hv.coach URL, ESIPAC logo) are included in the footer.
- Filename format is standardized: `preparedby_program_programno_date.pdf`. Ensure the "Prepared By Name" and "Program No" fields are filled for a meaningful filename.

## Program Structure

A typical HV switching program follows this structure:

1. **Header Information**: Program details, preparation/authorization information
2. **Pre-switching Checks**: Safety preparations and equipment checks
3. **Isolation Sequence**: Steps to isolate the equipment
4. **Earthing Sequence**: Steps to apply safety earths
5. **Work Permit**: Issuance and cancellation of relevant safety documents (e.g., Access Permit, Test Permit) should be included as distinct steps.
6. **Reverse Section**: Steps to return equipment to service, typically mirroring the isolation/earthing sequence in reverse order.
   - Remove work permits/cancel safety documents.
   - Remove earths
   - Remove isolation
   - Restore normal configuration

## Contributing

We welcome contributions to improve this tool. Please feel free to submit issues or pull requests.

## License

This project is licensed under the MIT License.

Copyright (c) 2024 MA-FS
