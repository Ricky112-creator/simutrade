import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },

  account: {
    type: Object,
    default: {}
  },

  balance: {
    type: Number,
    default: 0
  },

  wsState: {
    type: String,
    default: "disconnected"
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Session", sessionSchema);