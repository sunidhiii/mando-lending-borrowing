import { callerHasWriteAccess, generateEvent, Context, sendMessage, Storage, unsafeRandom } from '@massalabs/massa-as-sdk';
import { Args, u64ToBytes } from '@massalabs/as-types';
import { currentPeriod } from '@massalabs/massa-as-sdk/assembly/std/context';

const PRICE_KEY = 'PRICE_KEY';
const INIT_PRICE: u64 = 1000000000;

export function constructor(_: StaticArray<u8>): StaticArray<u8> {
  // This line is important. It ensure that this function can't be called in the future.
  // If you remove this check someone could call your constructor function and reset your SC.
  assert(callerHasWriteAccess(), 'Caller is not allowed');

  generateEvent(`Price oracle constructor called.`);

  return [];
}

function sendFuturOperation(): void {
  const functionName = 'setPrice';
  const address = Context.callee();
  const validityStartPeriod = currentPeriod() + 1;
  const validityStartThread = 0 as u8;
  const validityEndPeriod = validityStartPeriod + 5;
  const validityEndThread = 31 as u8;
  const maxGas = 1_000_000_000; // gas for smart contract execution
  const rawFee = 0;
  const coins = 0; // coins that can be used inside SC

  // Send the message
  sendMessage(
    address,
    functionName,
    validityStartPeriod,
    validityStartThread,
    validityEndPeriod,
    validityEndThread,
    maxGas,
    rawFee,
    coins,
    new Args().serialize(),
  );

  generateEvent(
    `next update planned on period ${validityStartPeriod.toString()} thread: ${validityStartThread.toString()}`,
  );
}

// Generate a random price change of +/- 5%.
function generateRandomIncrease(base: u64): u64 {
  const randomInt = unsafeRandom();
  const increasePercent = (abs(randomInt) % 10) - 5;
  const increase = ((base as i64) * increasePercent) / 100;

  if (increase < 0 && base <= (abs(increase) as u64)) {
    return 0;
  }
  return base + increase;
}

export function setPrice(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  const reserve = args
    .nextString()
    .expect('Reserve argument is missing or invalid');

  const key = `${PRICE_KEY}_${reserve}`;

  let currentPrice: u64;
  if (!Storage.has(key)) {
    // Set initial autonomousprice price
    generateEvent(`Set initial price to ${INIT_PRICE.toString()}`);
    Storage.set(key, INIT_PRICE.toString());
    currentPrice = INIT_PRICE;
  } else {
    currentPrice = u64.parse(Storage.get(key));
  }

  const newPrice = generateRandomIncrease(currentPrice);

  Storage.set(key, newPrice.toString());
  generateEvent(`🎉 Price updated for reserve ${reserve}: ${newPrice.toString()}`);

  sendFuturOperation();

  return u64ToBytes(newPrice);
}

export function getPrice(binaryArgs: StaticArray<u8>): StaticArray<u8> {

  const args = new Args(binaryArgs);
  const reserve = args
    .nextString()
    .expect('Reserve argument is missing or invalid');

  const key = `${PRICE_KEY}_${reserve}`;

  assert(Storage.has(key), 'Price is not set');

  const price = u64.parse(Storage.get(key));
  generateEvent(`current price for reserve ${reserve} is ${price.toString()}`);

  return u64ToBytes(price);
}