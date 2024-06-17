import React from 'react';

const InfoForm = ({ formData, handleChange }) => (
  <div className="info-container p-3">
    <div className="flex-container">
      <div className="col-md-12">
        <label>Work:</label>
        <input type="text" className="form-control" name="work" value={formData.work} onChange={handleChange} />
      </div>
    </div>
    <div className="flex-container">
      <div className="col-md-3 compact-field">
        <label>Site:</label>
        <input type="text" className="form-control" name="site" value={formData.site} onChange={handleChange} />
      </div>
      <div className="col-md-3 compact-field">
        <label>Procedure Permit No:</label>
        <input type="text" className="form-control" name="permitNo" value={formData.permitNo} onChange={handleChange} />
      </div>
      <div className="col-md-3 compact-field">
        <label>Reference Drawing:</label>
        <input type="text" className="form-control" name="referenceDrawing" value={formData.referenceDrawing} onChange={handleChange} />
      </div>
      <div className="col-md-3 compact-field">
        <label>Program No:</label>
        <input type="text" className="form-control" name="programNo" value={formData.programNo} onChange={handleChange} />
      </div>
    </div>
    <div className="flex-container">
      <div className="col-md-3 compact-field">
        <label>Date:</label>
        <input type="text" className="form-control" name="date" value={formData.date} onChange={handleChange} />
      </div>
      <div className="col-md-3 compact-field">
        <label>Prepared by:</label>
        <input type="text" className="form-control" name="preparedBy" value={formData.preparedBy} onChange={handleChange} />
      </div>
      <div className="col-md-3 compact-field">
        <label>Time:</label>
        <input type="text" className="form-control" name="time" value={formData.time} onChange={handleChange} />
      </div>
      <div className="col-md-3 compact-field">
        <label>Switcher:</label>
        <input type="text" className="form-control" name="switcher" value={formData.switcher} onChange={handleChange} />
      </div>
    </div>
    <div className="flex-container">
      <div className="col-md-3 compact-field">
        <label>Checked By:</label>
        <input type="text" className="form-control" name="checkedBy" value={formData.checkedBy} onChange={handleChange} />
      </div>
      <div className="col-md-3 compact-field">
        <label>Witness:</label>
        <input type="text" className="form-control" name="witness" value={formData.witness} onChange={handleChange} />
      </div>
    </div>
  </div>
);

export default InfoForm;