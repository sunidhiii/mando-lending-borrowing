import { Args, stringToBytes } from '@massalabs/as-types';
import { Address, Context, Storage, callerHasWriteAccess, generateEvent } from '@massalabs/massa-as-sdk';
import { caller, isDeployingContract } from '@massalabs/massa-as-sdk/assembly/std/context';
import { setOwner, onlyOwner } from '../helpers/ownership';

/**
 * This function is the constructor, it is always called once on contract deployment.
 *
 * @param args - The serialized arguments (unused).
 *
 * @returns none
 *
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  assert(callerHasWriteAccess());

  // if (!isDeployingContract()) {
  //   return;
  // }

  setOwner(new Args().add(Context.caller()).serialize());
  const args = new Args(binaryArgs);  // First we deserialize our arguments.

  Storage.set(
    'CORE_ADDR',
    args.nextString().unwrap(),
  );
  
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

  onlyOwner();

  // Then we create our key/value pair and store it.
  Storage.set(
    'CORE_ADDR',
    new Args(coreAddress).nextString().unwrap(),
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
export function getCore(): string {

  // We check if the entry exists.
  const address = Storage.get('CORE_ADDR');
  return address;

}

export function setLendingPool(poolAddress: StaticArray<u8>): void {

  const args = new Args(poolAddress);  // First we deserialize our arguments.

  onlyOwner();

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

  onlyOwner();

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

  onlyOwner();

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