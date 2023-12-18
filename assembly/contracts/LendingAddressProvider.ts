import { Args, stringToBytes } from '@massalabs/as-types';
import {
  Context,
  Storage,
  callerHasWriteAccess,
  generateEvent,
} from '@massalabs/massa-as-sdk';
import { setOwner, onlyOwner } from '../helpers/ownership';

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

  setOwner(new Args().add(Context.caller()).serialize());

  generateEvent(`Address Provider called with owner ${Context.caller()}`);
}

/**
 * This functions changes the core address.
 *
 * @param _args - The serialized arguments that should contain core smart contract address.
 *
 * @returns none
 *
 */
export function setCore(binaryArgs: StaticArray<u8>): void {
  onlyOwner();
  const args = new Args(binaryArgs); // First we deserialize our arguments.
  const core = args.nextString().unwrap();

  // Then we create our key/value pair and store it.
  Storage.set('CORE_ADDR', core);

  // Here we generate an event that indicates the changes that are made.
  generateEvent('Changed address of core.');
}

/**
 * This functions retrieves the core address.
 *
 * @returns The serialized address found.
 *
 */
export function getCore(): StaticArray<u8> {
  // We check if the entry exists.
  const address = Storage.get('CORE_ADDR');
  return stringToBytes(address);
}

export function setLendingPool(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs); // First we deserialize our arguments.
  const pool = args.nextString().unwrap();

  Storage.set('POOL_ADDR', pool);

  // Here we generate an event that indicates the changes that are made.
  generateEvent('Changed address of lending pool');
}

export function getLendingPool(): StaticArray<u8> {
  const address = Storage.get('POOL_ADDR');
  return stringToBytes(address);
}

export function setConfigurator(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs); // First we deserialize our arguments.
  const configurator = args.nextString().unwrap();

  Storage.set('CONFIGURATOR_ADDR', configurator);

  // Here we generate an event that indicates the changes that are made.
  generateEvent('Changed address of lending pool CONFIGURATOR_ADDR');
}

export function getConfigurator(): StaticArray<u8> {
  // We check if the entry exists.
  const address = Storage.get('CONFIGURATOR_ADDR');
  return stringToBytes(address);
}

export function setDataProvider(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs); // First we deserialize our arguments.
  const dataProvider = args.nextString().unwrap();

  Storage.set('DATA_PROVIDER_ADDR', dataProvider);

  // Here we generate an event that indicates the changes that are made.
  generateEvent('Changed address of lending pool DATA_PROVIDER_ADDR');
}

export function getDataProvider(): StaticArray<u8> {
  // We check if the entry exists.
  const address = Storage.get('DATA_PROVIDER_ADDR');
  return stringToBytes(address);
}

export function setFeeProvider(binaryArgs: StaticArray<u8>): void {
  onlyOwner();

  const args = new Args(binaryArgs); // First we deserialize our arguments.
  const feeProvider = args.nextString().unwrap();

  Storage.set('FEE_PROVIDER_ADDR', feeProvider);

  // Here we generate an event that indicates the changes that are made.
  generateEvent('Changed address of lending pool FEE_PROVIDER_ADDR');
}

export function getFeeProvider(): StaticArray<u8> {
  // We check if the entry exists.
  const address = Storage.get('FEE_PROVIDER_ADDR');
  return stringToBytes(address);
}
