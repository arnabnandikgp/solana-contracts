import { PublicKey } from "@solana/web3.js";

const programId = new PublicKey("11111111111111111111111111111111");
const optionalSeed = "helloWorld";

// Loop through all bump seeds (255 down to 0)
for (let bump = 255; bump >= 0; bump--) {
  try {
    const PDA = PublicKey.createProgramAddressSync(
      [Buffer.from(optionalSeed), Buffer.from([bump])],
      programId
    );
    console.log("bump " + bump + ": " + PDA);
  } catch (error) {
    console.log("bump " + bump + ": " + error);
  }
}


// import { PublicKey } from "@solana/web3.js";

const programAddress = new PublicKey("11111111111111111111111111111111");

const optionalSeedString = "helloWorld";
// const optionalSeedAddress = new PublicKey(
//   "B9Lf9z5BfNPT4d5KMeaBFx8x1G4CULZYR1jA2kmxRDka"
// );
const seeds = [Buffer.from(optionalSeedString)];
const [pda, bump] = await PublicKey.findProgramAddrcessSync(
  seeds,
  programAddress
);

console.log(`the only and only one PDA: ${pda}`);
console.log(`Bump: ${bump}`);   