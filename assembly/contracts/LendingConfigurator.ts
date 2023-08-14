import { generateEvent, Context, callerHasWriteAccess, Storage, Address } from '@massalabs/massa-as-sdk';
import { Args, Result, Serializable, stringToBytes } from '@massalabs/as-types';
import { onlyOwner } from '../helpers/ownership';
import { initReserve, getReserve, deleteReserve } from './LendingCore';
// import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param _args - Arguments serialized with Args
 */
export function constructor(providerAddress: StaticArray<u8>): StaticArray<u8> {
  // This line is important. It ensure that this function can't be called in the future.
  // If you remove this check someone could call your constructor function and reset your SC.
  if (!callerHasWriteAccess()) {
    return [];
  }
  // const args = new Args(providerAddress);
  // const provider = args.nextString().expect('Provider Address argument is missing or invalid');

  // Storage.set(
  //     'PROVIDER_ADDR',
  //     provider,
  // );

  generateEvent(
    `Constructor called on contract ${Context.callee().toString()}`,
  );

  return [];
}

// function createInitialMusicShop(): void {
//   const musicAlbum = new MusicAlbum('1', 'CD', 'Nirvana', 'Nevermind', 1991);
//   Storage.set(
//     stringToBytes(`${MUSIC_ALBUM_KEY}_${musicAlbum.id}`),
//     musicAlbum.serialize(),
//   );
// }

export function addReserve(binaryArgs: StaticArray<u8>): void {
  
  onlyOwner();

  // convert the binary input to Args
  // const args: Args = new Args(binaryArgs);

  // const provider = new ILendingAddressProvider(new Address(Storage.get('PROVIDER_ADDR')));
  // const core = new ILendingAddressProvider(provider.getCore());
  
  initReserve(binaryArgs);


}

export function viewReserve(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  // convert the binary input to Args
  const reserve = getReserve(binaryArgs);

  return reserve;
}

export function removeReserve(binaryArgs: StaticArray<u8>): void {
  
  onlyOwner();

  deleteReserve(binaryArgs);
}

