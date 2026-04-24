import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },

    type: {
      type: String,
      enum: ["DEPOSIT", "WITHDRAW", "TRADE_PROFIT", "TRADE_LOSS"],
      required: true
    },

    amount: { type: Number, required: true },

    description: String
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);