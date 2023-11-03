import {
    Args,
    bytesToFixedSizeArray,
    Result,
    Serializable,
  } from '@massalabs/as-types';
  import { Address, call, Storage } from '@massalabs/massa-as-sdk';
  import { IPair } from './IPair';
  
  const OWNER = 'OWNER';
  const MIN_BIN_STEP = 1;
  const MAX_BIN_STEP = 100;
  
  class SortTokensReturn {
    constructor(readonly token0: Address, readonly token1: Address) {}
  }
  
  function _sortTokens(
    _tokenA: Address,
    _tokenB: Address,
  ): SortTokensReturn {
    if (_tokenA.toString() < _tokenB.toString()) {
      return new SortTokensReturn(_tokenA, _tokenB);
    } else {
      return new SortTokensReturn(_tokenB, _tokenA);
    }
  }
  
  export class IFactory {
    _origin: Address;
  
    /**
     * Wraps a smart contract exposing standard token FFI.
     *
     * @param {Address} at - Address of the smart contract.
     */
    constructor(at: Address) {
      this._origin = at;
    }
  
    getLBPairInformation(
      _tokenA: Address,
      _tokenB: Address,
      _binStep: u64,
    ): LBPairInformation {
      const args = new Args().add(_tokenA).add(_tokenB).add(_binStep);
      const res = call(this._origin, 'getLBPairInformation', args, 0);
      return new Args(res).nextSerializable<LBPairInformation>().unwrap();
    }
  
    getAllLBPairs(_tokenX: Address, _tokenY: Address): LBPairInformation[] {
      const LBPairsAvailable: LBPairInformation[] = [];
      const tokens = _sortTokens(_tokenX, _tokenY);
  
      const _avLBPairBinSteps = this.getAvailableLBPairBinSteps(
        tokens.token0,
        tokens.token1,
      );
      const _nbAvailable = _avLBPairBinSteps.length;
  
      if (_nbAvailable > 0) {
        let _index = 0;
        for (let i = MIN_BIN_STEP; i <= MAX_BIN_STEP; ++i) {
          if (_avLBPairBinSteps[_index] != i) continue;
  
          const _LBPairInformation = this.getLBPairInformation(
            tokens.token0,
            tokens.token1,
            i,
          );
          LBPairsAvailable.push(_LBPairInformation);
          if (++_index == _nbAvailable) break;
        }
      }
  
      return LBPairsAvailable;
    }
  
    getAvailableLBPairBinSteps(_tokenA: Address, _tokenB: Address): u32[] {
      const args = new Args().add(_tokenA).add(_tokenB);
      const res = call(this._origin, 'getAvailableLBPairBinSteps', args, 0);
      return bytesToFixedSizeArray<u32>(res);
    }
  
    getOwner(): Address {
      return new Address(Storage.getOf(this._origin, OWNER));
    }
  }
  
  export class LBPairInformation implements Serializable {
    /**
     * @param {u32} binStep - The bin step of the LBPair
     * @param {IPair} pair - The address of the LBPair
     * @param {bool} createdByOwner - Whether the LBPair was created by the owner or the factory
     * @param {bool} ignoredForRouting - Whether the LBPair is ignored for routing or not. An ignored pair will not be explored during routes finding
     */
    constructor(
      public binStep: u32 = 0,
      public pair: IPair = new IPair(new Address()),
      public createdByOwner: bool = false,
      public ignoredForRouting: bool = false,
    ) {}
  
    // ======================================================== //
    // ====                  SERIALIZATION                 ==== //
    // ======================================================== //
  
    serialize(): StaticArray<u8> {
      return new Args()
        .add(this.binStep)
        .add(this.pair._origin)
        .add(this.createdByOwner)
        .add(this.ignoredForRouting)
        .serialize();
    }
  
    deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
      const args = new Args(data, offset);
      this.binStep = args.nextU32().expect('Failed to deserialize binStep');
      this.pair = new IPair(
        new Address(args.nextString().expect('Failed to deserialize pair')),
      );
      this.createdByOwner = args
        .nextBool()
        .expect('Failed to deserialize createdByOwner');
      this.ignoredForRouting = args
        .nextBool()
        .expect('Failed to deserialize ignoredForRouting');
      return new Result(args.offset);
    }
  }