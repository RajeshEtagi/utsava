import mongoose from 'mongoose';

const RegistrationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    
    attendeeName: { type: String, required: true },
    attendeeEmail: { type: String, required: true },
    
    qrCode: { type: String, required: true, unique: true, index: true },
    
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
    
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedByName: { type: String },
  },
  { timestamps: true }
);

// Compound index to ensure a user can only register once for an event, if desired
RegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: false });

if (process.env.NODE_ENV !== 'production' && mongoose.models.Registration) {
  mongoose.deleteModel('Registration');
}

export default mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);
