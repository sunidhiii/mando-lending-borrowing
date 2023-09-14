// import { generateEvent, Context, callerHasWriteAccess, Storage, Address } from '@massalabs/massa-as-sdk';
// import { Args, Result, Serializable, stringToBytes } from '@massalabs/as-types';

// const ONE_UNIT = 10 ** 9;
// export const ORIGNATION_FEE = 0.0025 * 10 ** 9;
// enum InterestRateMode {NONE, STABLE, VARIABLE}

// /**
//  * This functions changes the core address.
//  *
//  * @param _args - The serialized arguments that should contain core smart contract address.
//  *
//  * @returns none
//  *
//  */
// export function getNormalizedIncome(reserve: Reserve): void {

//   const reserveData = getReserve(new Args().add(reserve).serialize());
//   const reserveArgs = new Args(reserveData).nextSerializable<Reserve>().unwrap();
 
//   const cumulated = calculateLinearInterest(reserveArgs.currentLiquidityRate, reserveArgs.lastUpdateTimestamp)
// }

// /**
//  * This functions retrieves the core address.
//  *
//  * @returns The serialized address found.
//  *
//  */
// export function updateCumulativeIndexes(): u64 {
//     // We check if the entry exists.
//     const fee = Storage.get(ORIGNATION_FEE);
//     return fee;
// }

// export function cumulateToLiquidityIndex(): u64 {
//     // We check if the entry exists.
//     const fee = Storage.get(ORIGNATION_FEE);
//     return fee;
// }

// export function getCompoundedBorrowBalance(): u64 {
//     // We check if the entry exists.
//     const fee = Storage.get(ORIGNATION_FEE);
//     return fee;
// }

// export function increaseTotalBorrowsStableAndUpdateAverageRate (): u64 {
//     // We check if the entry exists.
//     const fee = Storage.get(ORIGNATION_FEE);
//     return fee;
// }

// export function decreaseTotalBorrowsStableAndUpdateAverageRate (): u64 {
//     // We check if the entry exists.
//     const fee = Storage.get(ORIGNATION_FEE);
//     return fee;
// }

// export function increaseTotalBorrowsVariable (): u64 {
//     // We check if the entry exists.
//     const fee = Storage.get(ORIGNATION_FEE);
//     return fee;
// }

// export function decreaseTotalBorrowsVariable (): u64 {
//     // We check if the entry exists.
//     const fee = Storage.get(ORIGNATION_FEE);
//     return fee;
// }

// export function calculateLinearInterest (rate: u256, lastUpdateTimestamp: u256): u64 {
//   // We check if the entry exists.
//   const timeDifference = timestamp.sub(uint256(_lastUpdateTimestamp));

//   const timeDelta = timeDifference.wadToRay().rayDiv(SECONDS_PER_YEAR.wadToRay());

//   return rate.rayMul(timeDelta).add(WadRayMath.ray());

// }

// export function calculateCompoundedInterest (): u64 {
//     // We check if the entry exists.
//     const fee = Storage.get(ORIGNATION_FEE);
//     return fee;
// }

// export function getTotalBorrows (): u64 {
//     // We check if the entry exists.
//     const fee = Storage.get(ORIGNATION_FEE);
//     return fee;
// }


