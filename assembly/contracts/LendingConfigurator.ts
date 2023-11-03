import { generateEvent, Context, callerHasWriteAccess, Storage, Address, call } from '@massalabs/massa-as-sdk';
import { Args, Result, Serializable, stringToBytes } from '@massalabs/as-types';
import { ILendingAddressProvider } from '../interfaces/ILendingAddressProvider'
import { ILendingCore } from '../interfaces/ILendingCore';
import Reserve from '../helpers/Reserve';

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param _args - Arguments serialized with Args
 */
export function constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensure that this function can't be called in the future.
  // If you remove this check someone could call your constructor function and reset your SC.
  if (!callerHasWriteAccess()) {
    return;
  }

  const args = new Args(binaryArgs);
  const provider = args.nextString().expect('Provider Address argument is missing or invalid');

  Storage.set(
      'ADDRESS_PROVIDER_ADDR',
      provider,
  );

  generateEvent(
    `Constructor called on configurator contract ${Context.callee().toString()}`,
  );

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

  const provider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  // const core = new ILendingCore(provider.getCore());
  const core = new Address(provider.getCore());

  // const args: Args = new Args(binaryArgs);
  // const reserveData = args.nextSerializable<Reserve>().unwrap();
  
  // core.initReserve(new Args().add(reserveData).serialize());
  call(core, "initReserve", new Args(binaryArgs), 0);

}

// export function viewReserve(binaryArgs: StaticArray<u8>): Reserve {
//   // convert the binary input to Args
//   const provider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
//   const core = new ILendingCore(provider.getCore());
  
//   const args: Args = new Args(binaryArgs);
//   const reserveAddr = new Address(args.nextString().unwrap());

//   const reserve = core.getReserve(reserveAddr);
//   return reserve;
// }

export function removeReserve(binaryArgs: StaticArray<u8>): void {
  
  onlyOwner();

  const provider = new ILendingAddressProvider(new Address(Storage.get('ADDRESS_PROVIDER_ADDR')));
  const core = new ILendingCore(new Address(provider.getCore()));
  
  const args: Args = new Args(binaryArgs);
  const reserveAddr = new Address(args.nextString().unwrap());

  core.deleteReserve(reserveAddr);
}


export function setAddressProvider(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const provider = args.nextString().expect('Provider Address argument is missing or invalid');
  
  Storage.set(
    'ADDRESS_PROVIDER_ADDR',
    provider,
  );
}

function onlyOwner(): void {
  const addressProvider = Storage.get('ADDRESS_PROVIDER_ADDR');
  const owner = new ILendingAddressProvider(new Address(addressProvider)).getOwner();
  
  assert(Context.caller().toString() === owner, 'Caller is not the owner');
}

