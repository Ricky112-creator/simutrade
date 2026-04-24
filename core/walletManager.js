import Wallet from "../models/Wallet.js";
import Transaction from "../models/Transaction.js";

export async function getOrCreateWallet(userId) {
  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      balance: 0
    });
  }

  return wallet;
}

export async function addBalance(userId, amount, reason = "DEPOSIT") {
  const wallet = await getOrCreateWallet(userId);

  wallet.balance += amount;
  await wallet.save();

  await Transaction.create({
    userId,
    type: reason,
    amount
  });

  return wallet;
}