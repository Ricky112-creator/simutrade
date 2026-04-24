import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema({
  userId: { type: String, required: true },

  amount: Number,
  symbol: String,
  contractType: String,

  result: {
    type: String, // "win" | "loss"
    default: "pending"
  },

  profit: {
    type: Number,
    default: 0
  },

  contractId: String,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Trade", tradeSchema);