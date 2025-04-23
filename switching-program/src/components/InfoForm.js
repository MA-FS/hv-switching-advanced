import React from 'react';
import './InfoForm.css';
import '../styles.css';

const InfoForm = ({ formData, handleChange }) => (
  <div className="info-container">
    <div className="form-top-section">
      <div className="title-section">
        <h2 className="static-title">HV Coach SWITCHING PROGRAM</h2>
      </div>
      <div className="name-section">
        <div className="name-field">
          <label>NAME:</label>
          <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div className="program-no-field">
          <label>Program No:</label>
          <input type="text" className="form-control" name="programNo" value={formData.programNo} onChange={handleChange} />
        </div>
      </div>
    </div>

    <div className="location-section">
      <label>Location:</label>
      <input type="text" className="form-control" name="location" value={formData.location} onChange={handleChange} />
    </div>

    <div className="work-description-section">
      <label>Work Description:</label>
      <input type="text" className="form-control" name="workDescription" value={formData.workDescription} onChange={handleChange} />
    </div>

    <div className="main-content">
      <div className="signature-sections">
        <div className="signature-row">
          <div className="signature-label">Prepared by:</div>
          <div className="signature-fields">
            <input type="text" className="form-control" name="preparedByName" placeholder="Name(print)" value={formData.preparedByName} onChange={handleChange} />
            <input type="text" className="form-control" name="preparedBySignature" placeholder="Signature" value={formData.preparedBySignature} onChange={handleChange} />
            <input type="text" className="form-control" name="preparedByTime" placeholder="Time" value={formData.preparedByTime} onChange={handleChange} />
            <input type="text" className="form-control" name="preparedByDate" placeholder="Date" value={formData.preparedByDate} onChange={handleChange} />
          </div>
        </div>

        <div className="signature-row">
          <div className="signature-label">Checked by:</div>
          <div className="signature-fields">
            <input type="text" className="form-control" name="checkedByName" placeholder="Name(print)" value={formData.checkedByName} onChange={handleChange} />
            <input type="text" className="form-control" name="checkedBySignature" placeholder="Signature" value={formData.checkedBySignature} onChange={handleChange} />
            <input type="text" className="form-control" name="checkedByTime" placeholder="Time" value={formData.checkedByTime} onChange={handleChange} />
            <input type="text" className="form-control" name="checkedByDate" placeholder="Date" value={formData.checkedByDate} onChange={handleChange} />
          </div>
        </div>

        <div className="signature-row">
          <div className="signature-label">Authorised:</div>
          <div className="signature-fields">
            <input type="text" className="form-control" name="authorisedName" placeholder="Name(print)" value={formData.authorisedName} onChange={handleChange} />
            <input type="text" className="form-control" name="authorisedSignature" placeholder="Signature" value={formData.authorisedSignature} onChange={handleChange} />
            <input type="text" className="form-control" name="authorisedTime" placeholder="Time" value={formData.authorisedTime} onChange={handleChange} />
            <input type="text" className="form-control" name="authorisedDate" placeholder="Date" value={formData.authorisedDate} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="reference-drawings">
        <label>Reference Drawing/s</label>
        <input type="text" className="form-control" name="referenceDrawings" value={formData.referenceDrawings} onChange={handleChange} />
      </div>
    </div>
  </div>
);

export default InfoForm;