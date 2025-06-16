use borsh::{BorshDeserialize, BorshSerialize};

use solana_program::{
    account_info::{AccountInfo, next_account_info},
    declare_deprecated_id, entrypoint,
    entrypoint::ProgramResult,
    msg,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

#[derive(BorshSerialize, BorshDeserialize)]
struct Counter {
    count: u32,
}

#[derive(BorshSerialize, BorshDeserialize)]
enum CounterInstructions {
    Increment(u32),
    Decrement(u32),
}

pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let acc = next_account_info(&mut accounts.iter())?;

    let mut counter = Counter::try_from_slice(&acc.data.borrow())?;

    match CounterInstructions::try_from_slice(instruction_data)? {
        CounterInstructions::Increment(amount) => counter.count += amount,
        CounterInstructions::Decrement(amount) => counter.count -= amount,
    }

    counter.serialize(&mut *acc.data.borrow_mut())?;

    Ok(())
}
