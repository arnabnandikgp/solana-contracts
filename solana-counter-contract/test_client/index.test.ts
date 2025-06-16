import { expect, test } from "bun:test";
import * as borsh from "borsh";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  CounterInstruction,
  CounterInstructionSchema,
  CounterInstructionType,
  createIncrementInstructionData,
  createDecrementInstructionData,
} from "./instruction";

class CounterAccount {
  count = 0;

  constructor({ count }: { count: number }) {
    this.count = count;
  }
}

const schema: borsh.Schema = { struct: { count: "u32" } };

const GREETING_SIZE = borsh.serialize(
  schema,
  new CounterAccount({ count: 0 })
).length;

// const counter = new CounterAccount({count:1});

let counterAccountPair: Keypair;
let adminKeypair: Keypair;

const connection = new Connection("http://127.0.0.1:8899", "confirmed");
const localprogramId = new PublicKey(
  "6VZY6n9bb9RZwXgYWBFLfdw71F6GyBeZxVzKXJP4jby2"
);

test("counter data account setup", async () => {
  // generate keypairs for both the admin and the data account
  adminKeypair = Keypair.generate();
  counterAccountPair = Keypair.generate();

  // airdropping the admin account some solana
  let res = await connection.requestAirdrop(
    adminKeypair.publicKey,
    100 * LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(res, "confirmed");

  //calculate the min number of solana needed for making the data account

  const min_lamports = await connection.getMinimumBalanceForRentExemption(
    GREETING_SIZE
  );

  // the data account's fields have been set
  const createAccountIx = SystemProgram.createAccount({
    fromPubkey: adminKeypair.publicKey,
    newAccountPubkey: counterAccountPair.publicKey,
    lamports: min_lamports,
    programId: localprogramId,
    space: GREETING_SIZE,
  });

  let latestblockHash = await connection.getLatestBlockhash();

  // Create a message first
  const message = new TransactionMessage({
    payerKey: adminKeypair.publicKey, // payer's public key
    recentBlockhash: latestblockHash.blockhash,
    instructions: [createAccountIx], // array of instructions
  }).compileToV0Message();

  // Initialize the VersionedTransaction
  const vtransaction = new VersionedTransaction(message);
  vtransaction.sign([adminKeypair, counterAccountPair]); // array of Keypairs

  const txHash = await connection.sendTransaction(vtransaction);
  await connection.confirmTransaction(txHash, "confirmed"); // using finalized may cause a problem

  const counterAccount = await connection.getAccountInfo(
    counterAccountPair.publicKey
  );
  if (!counterAccount) {
    throw new Error("Counter account not found");
  }
  const counter = borsh.deserialize(
    schema,
    counterAccount.data
  ) as CounterAccount;
  // console.log(counter.count);
  expect(counter.count).toBe(0);
});

test("the counter does work like we want", async () => {
  const instructionData = createIncrementInstructionData(2);
  // Create the transaction instruction
  // const ix1 = new TransactionInstruction({
  //     keys: [
  //         {
  //             pubkey: counterAccountPair.publicKey,
  //             isSigner: false,
  //             isWritable: true,
  //         },
  //     ],
  //     programId: localprogramId,
  //     data: instructionData, // Using the serialized instruction data
  // });

  const ix1 = new TransactionInstruction({
    keys: [
      {
        pubkey: counterAccountPair.publicKey,
        isSigner: true,
        isWritable: true,
      },
    ],
    programId: localprogramId,
    data: Buffer.from([0, 1, 0, 0, 0, 1, 0, 0, 0]),
  });

  const ix2 = new TransactionInstruction({
    keys: [
      {
        pubkey: counterAccountPair.publicKey,
        isSigner: true,
        isWritable: true,
      },
    ],
    programId: localprogramId,
    data: Buffer.from([1, 1, 0, 0, 0]),
  });

  let latestblockHash = await connection.getLatestBlockhash();

  // Create a message first
  const message = new TransactionMessage({
    payerKey: adminKeypair.publicKey, // payer's public key
    recentBlockhash: latestblockHash.blockhash,
    instructions: [ix1], // array of instructions
  }).compileToV0Message();

  // Initialize the VersionedTransaction
  const vtx = new VersionedTransaction(message);
  vtx.sign([adminKeypair, counterAccountPair]); // array of Keypairs
  const counterAccount = await connection.getAccountInfo(
    counterAccountPair.publicKey
  );
  if (!counterAccount) {
    throw new Error("Counter account not found");
  }
  const counter = borsh.deserialize(
    schema,
    counterAccount.data
  ) as CounterAccount;
  console.log(counter.count);
  expect(counter.count).toBe(2);
});
