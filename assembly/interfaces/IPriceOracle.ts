import { Args, bytesToU64 } from '@massalabs/as-types';
import { Address, call } from '@massalabs/massa-as-sdk';
export class IPriceOracle {
  _origin: Address;

  /**
   * Wraps a smart contract exposing standard token FFI.
   *
   * @param at - Address of the smart contract.
   */
  constructor(at: Address) {
    this._origin = at;
  }

  setPrice(reserve: Address): void {
    // const arg = new Args().add(reserve);
    call(this._origin, 'setPrice', new Args().add(reserve), 0);
  }

  getPrice(reserve: Address): u64 {
    // const arg = new Args().add(reserve);
    return bytesToU64(
      call(this._origin, 'getPrice', new Args().add(reserve), 0),
    );
  }
}
