import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "10:00"
    subject: { type: String, required: true, trim: true },
    faculty: { type: String, trim: true },
    room: { type: String, trim: true },
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true, index: true }, // e.g. "CSE-A"
    department: { type: String, trim: true },
    slots: { type: [slotSchema], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Timetable', timetableSchema);
