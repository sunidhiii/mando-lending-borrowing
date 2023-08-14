import { Args } from '@massalabs/as-types';
import { Address, Context, Storage, callerHasWriteAccess, generateEvent } from '@massalabs/massa-as-sdk';
import { caller, isDeployingContract } from '@massalabs/massa-as-sdk/assembly/std/context';
// import { onlyOwner } from '../helpers/ownership';

const OWNER_ADDR = 'OWNER_ADDR';


/**
 * This function is the constructor, it is always called once on contract deployment.
 *
 * @param args - The serialized arguments (unused).
 *
 * @returns none
 *
 */
export function constructor(_: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  assert(callerHasWriteAccess());

  // if (!isDeployingContract()) {
  //   return [];
  // }

  Storage.set(
    'OWNER_ADDR',
    Context.caller().toString(),
  );
}

/**
 * @returns true if the caller is the creator of the SC
 */
function _onlyOwner(): bool {
  if (!Storage.has(OWNER_ADDR)) {
    return false;
  }
  return Context.caller().toString() == Storage.get(OWNER_ADDR);
}

/**
 * This functions changes the core address.
 *
 * @param _args - The serialized arguments that should contain core smart contract address.
 *
 * @returns none
 *
 */
export function setCore(coreAddress: StaticArray<u8>): void {

  const args = new Args(coreAddress);  // First we deserialize our arguments.

  // We use 'next[Type]()' to retrieve the next argument in the serialized arguments.
  // We use 'expect()' to check if the argument exists, if not we abort the execution.

  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  // onlyOwner();

  // Then we create our key/value pair and store it.
  Storage.set(
    'coreAddress',
    args.nextString().expect('Argument address is missing or invalid'),
  );

  // Here we generate an event that indicates the changes that are made.
  generateEvent("Changed address of core to" + args.nextString().unwrap() + "'");

}

/**
 * This functions retrieves the core address.
 *
 * @returns The serialized address found.
 *
 */
export function getCore(): Address {

  // We check if the entry exists.
  const address = Storage.get('coreAddress');
  return new Address(address);

}

export function setLendingPool(poolAddress: StaticArray<u8>): void {

  const args = new Args(poolAddress);  // First we deserialize our arguments.

  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  // onlyOwner();

  Storage.set(
    'poolAddress',
    args.nextString().expect('Argument address is missing or invalid'),
  );

  // Here we generate an event that indicates the changes that are made.
  generateEvent("Changed address of lending pool to" + args.nextString().unwrap() + "'");

}


export function getLendingPool(): Address {

  // We check if the entry exists.
  const address = Storage.get('poolAddress');
  return new Address(address);

}

export function setConfigurator(configuratorAddress: StaticArray<u8>): void {

  const args = new Args(configuratorAddress);  // First we deserialize our arguments.

  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  // onlyOwner();

  Storage.set(
    'configuratorAddress',
    args.nextString().expect('Argument address is missing or invalid'),
  );

  // Here we generate an event that indicates the changes that are made.
  generateEvent("Changed address of lending pool configuratorAddress to" + args.nextString().unwrap() + "'");
}


export function getConfigurator(): Address {

  // We check if the entry exists.
  const address = Storage.get('configuratorAddress');
  return new Address(address);

}

export function setFeeProvider(feeProviderAddress: StaticArray<u8>): void {

  const args = new Args(feeProviderAddress);  // First we deserialize our arguments.

  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  // onlyOwner();

  Storage.set(
    'feeProviderAddress',
    args.nextString().expect('Argument address is missing or invalid'),
  );

  // Here we generate an event that indicates the changes that are made.
  generateEvent("Changed address of lending pool feeProviderAddress to" + args.nextString().unwrap() + "'");
}


export function getFeeProvider(): Address {

  // We check if the entry exists.
  const address = Storage.get('feeProviderAddress');
  return new Address(address);

}