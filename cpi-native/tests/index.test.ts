import * as path from "path";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import { LiteSVM } from "litesvm";
import { expect, test, describe, beforeAll } from "bun:test";
import { deserialize } from "borsh";
import * as borsh from "borsh";

describe("Counter Program Tests", () => {
  let svm: LiteSVM;
  let programId: PublicKey;
  let dataAccount: Keypair;
  let userAccount: Keypair;

  const programPath = path.join(import.meta.dir, "build.so");

  beforeAll(() => {
    svm = new LiteSVM();
    
    programId = PublicKey.unique();
    
    svm.addProgramFromFile(programId, programPath);
    
    dataAccount = new Keypair();
    
    userAccount = new Keypair();

    svm.airdrop(userAccount.publicKey, BigInt(LAMPORTS_PER_SOL));
  });

  test("initialize counter", () => {
    const instruction = new TransactionInstruction({ // transaction is sent that contains the account details and the signatures
      programId,
      keys: [
        { pubkey: dataAccount.publicKey, isSigner: true, isWritable: true },
        { pubkey: userAccount.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      data: Buffer.from([0])
    });

    const transaction = new Transaction().add(instruction);
    transaction.recentBlockhash = svm.latestBlockhash();
    transaction.feePayer = userAccount.publicKey;
    transaction.sign(dataAccount, userAccount);
    let txn = svm.sendTransaction(transaction);
    svm.expireBlockhash();
    const updatedAccountData = svm.getAccount(dataAccount.publicKey);
    if (!updatedAccountData) {
      throw new Error("Account not found");
    }

    expect(updatedAccountData.data[0]).toBe(1);
    expect(updatedAccountData.data[1]).toBe(0);
    expect(updatedAccountData.data[2]).toBe(0);
    expect(updatedAccountData.data[3]).toBe(0);
  });

  test("double counter value makes it 16 after 4 times", async () => {

    function doubleCounter() {
      // Create an instruction to call our program
      const instruction = new TransactionInstruction({
        programId,
        keys: [
          { pubkey: dataAccount.publicKey, isSigner: true, isWritable: true }
        ],
        data: Buffer.from([1])
      });
      
      // Create and execute the transaction
      let transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = svm.latestBlockhash();

      transaction.feePayer = userAccount.publicKey;
      transaction.sign(userAccount, dataAccount);
      svm.sendTransaction(transaction);
      svm.expireBlockhash();
    }

    doubleCounter();
    doubleCounter();
    doubleCounter();
    doubleCounter();
    
    const updatedAccountData = svm.getAccount(dataAccount.publicKey);
    if (!updatedAccountData) {
      throw new Error("Account not found");
    }

    expect(updatedAccountData.data[0]).toBe(16);
    expect(updatedAccountData.data[1]).toBe(0);
    expect(updatedAccountData.data[2]).toBe(0);
    expect(updatedAccountData.data[3]).toBe(0);
  });
});