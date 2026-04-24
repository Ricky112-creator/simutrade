import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },

    balance: {
      type: Number,
      default: 0
    },

    currency: {
      type: String,
      default: "USD"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Wallet", walletSchema);