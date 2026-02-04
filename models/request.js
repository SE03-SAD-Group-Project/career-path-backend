const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  employerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING_ADMIN', 'PENDING_EMPLOYEE', 'ACCEPTED', 'DENIED', 'REJECTED_BY_ADMIN'], 
    default: 'PENDING_ADMIN' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Request', requestSchema);