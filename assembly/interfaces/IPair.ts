import {
    Args,
    bytesToString,
    bytesToU32,
    bytesToU64,
    byteToBool,
    Result,
    Serializable
  } from '@massalabs/as-types';
  import { Address, call, Storage } from '@massalabs/massa-as-sdk';
  import { IERC20 } from './IERC20';
  
  const FACTORY = 'FACTORY';
  const TOKEN_X = 'TOKEN_X';
  const TOKEN_Y = 'TOKEN_Y';
  export class Amounts {
    constructor(public amountX: u64, public amountY: u64) {}
  }
  
  export class MintReturn {
    constructor(
      public amountXAdded: u64,
      public amountYAdded: u64,
      public liquidityMinted: u64[],
    ) {}
  }
  
  export class IPair {
    _origin: Address;
  
    /**
     * Wraps a smart contract exposing standard token FFI.
     *
     * @param {Address} at - Address of the smart contract.
     */
    constructor(at: Address) {
      this._origin = at;
    }
  
    getBin(_id: u32): Bin {
      const bs = call(this._origin, 'getBin', new Args().add(_id), 0);
      return new Args(bs).nextSerializable<Bin>().unwrap();
    }
  
    /**
     * Swap tokens iterating over the bins until the entire amount is swapped.
     * Will swap token X for token Y if `_swapForY` is true, and token Y for token X if `_swapForY` is false.
     * This function will not transfer the tokens from the caller, it is expected that the tokens have already been
     * transferred to this contract through another contract.
     * That is why this function shouldn't be called directly, but through one of the swap functions of the router
     * that will also perform safety checks.
     *
     * @param {bool} swapForY - Whether you've swapping token X for token Y (true) or token Y for token X (false)
     * @param {Address} to - The address to send the tokens to
     *
     */
    swap(swapForY: bool, to: Address): u64 {
      const args = new Args().add(swapForY).add(to);
      const res = call(this._origin, 'swap', args, 0);
      return bytesToU64(res);
    }
  
    /**
     * Mint new LB tokens for each bins where the user adds liquidity.
     * This function will not transfer the tokens from the caller, it is expected that the tokens have already been
     * transferred to this contract through another contract.
     * That is why this function shouldn't be called directly, but through one of the add liquidity functions of the
     * router that will also perform safety checks.
     * Any excess amount of token will be sent to the `to` address. The lengths of the arrays must be the same.
     *
     * @param {Array<u64>} _ids - The ids of the bins where the liquidity will be added. It will mint LB tokens for each of these bins.
     * @param {Array<u64>} _distributionX - The percentage of token X to add to each bin. The sum of all the values must not exceed 100%, that is 1e9.
     * @param {Array<u64>} _distributionY - The percentage of token Y to add to each bin. The sum of all the values must not exceed 100%, that is 1e9.
     * @param {Address} _to - The address that will receive the LB tokens and the excess amount of tokens.
     *
     */
    mint(
      _ids: u64[],
      _distributionX: u64[],
      _distributionY: u64[],
      _to: Address,
    ): MintReturn {
      const args = new Args()
        .add(_ids)
        .add(_distributionX)
        .add(_distributionY)
        .add(_to);
      const res = new Args(call(this._origin, 'mint', args, 0));
      return new MintReturn(
        res.nextU64().unwrap(),
        res.nextU64().unwrap(),
        res.nextFixedSizeArray<u64>().unwrap(),
      );
    }
  
    burn(_ids: u64[], _amounts: u64[], _to: Address): Amounts {
      const args = new Args().add(_ids).add(_amounts).add(_to);
      const res = new Args(call(this._origin, 'burn', args, 0));
      return new Amounts(res.nextU64().unwrap(), res.nextU64().unwrap());
    }
  
    getTokenX(): IERC20 {
      return new IERC20(new Address(Storage.getOf(this._origin, TOKEN_X)));
    }
  
    getTokenY(): IERC20 {
      return new IERC20(new Address(Storage.getOf(this._origin, TOKEN_Y)));
    }
  
    getPairInformation(): PairInformation {
      const res = call(this._origin, 'getPairInformation', new Args(), 0);
      return new Args(res).nextSerializable<PairInformation>().unwrap();
    }
  
    getUserBins(account: Address): u32[] {
      const res = call(this._origin, 'getUserBins', new Args().add(account), 0);
      return new Args(res).nextFixedSizeArray<u32>().unwrap();
    }
  
    findFirstNonEmptyBinId(id: u32, sentTokenY: bool): u32 {
      const res = call(
        this._origin,
        'findFirstNonEmptyBinId',
        new Args().add(id).add(sentTokenY),
        0,
      );
      return bytesToU32(res);
    }
  
    getFactory(): Address {
      return new Address(Storage.getOf(this._origin, FACTORY));
    }
  
    name(): string {
      const res = call(this._origin, 'name', new Args(), 0);
      return bytesToString(res);
    }
  
    symbol(): string {
      const res = call(this._origin, 'symbol', new Args(), 0);
      return bytesToString(res);
    }
  
    totalSupply(_id: u64): u64 {
      const res = call(this._origin, 'totalSupply', new Args().add(_id), 0);
      return bytesToU64(res);
    }
  
    balanceOf(_account: Address, _id: u64): u64 {
      const res = call(
        this._origin,
        'balanceOf',
        new Args().add(_account).add(_id),
        0,
      );
      return bytesToU64(res);
    }
  
    balanceOfBatch(_accounts: Address[], _ids: u64[]): u64[] {
      const args = new Args().addSerializableObjectArray(_accounts).add(_ids);
      const res = call(this._origin, 'balanceOfBatch', args, 0);
      return new Args(res).nextFixedSizeArray<u64>().unwrap();
    }
  
    isApprovedForAll(_owner: Address, _spender: Address): bool {
      const res = call(
        this._origin,
        'isApprovedForAll',
        new Args().add(_owner).add(_spender),
        0,
      );
      return byteToBool(res);
    }
  
    setApprovalForAll(_approved: bool, _sender: Address): void {
      call(
        this._origin,
        'setApprovalForAll',
        new Args().add(_approved).add(_sender),
        0,
      );
    }
  
    safeTransferFrom(_from: Address, _to: Address, _id: u64, amount: u64): void {
      call(
        this._origin,
        'safeTransferFrom',
        new Args().add(_from).add(_to).add(_id).add(amount),
        0,
      );
    }
  
    safeBatchTransferFrom(
      _from: Address,
      _to: Address,
      _ids: u64[],
      _amounts: u64[],
    ): void {
      const args = new Args().add(_from).add(_to).add(_ids).add(_amounts);
      call(this._origin, 'safeBatchTransferFrom', args, 0);
    }
  
    pendingFees(account: Address, ids: u64[]): Amounts {
      const args = new Args().add(account).add(ids);
      const res = new Args(call(this._origin, 'pendingFees', args, 0));
      return new Amounts(res.nextU64().unwrap(), res.nextU64().unwrap());
    }
  
    collectFees(account: Address, ids: u64[]): Amounts {
      const args = new Args().add(account).add(ids);
      const res = new Args(call(this._origin, 'collectFees', args, 0));
      return new Amounts(res.nextU64().unwrap(), res.nextU64().unwrap());
    }
  }
  
  export class PairInformation implements Serializable {
    /**
     * @param {u32} activeId - The current id used for swaps, this is also linked with the price
     * @param {u64} reserveX - The sum of amounts of tokenX across all bins
     * @param {u64} reserveY - The sum of amounts of tokenY across all bins
     * @param {FeesDistribution} feesX - The current amount of fees to distribute in tokenX (total, protocol)
     * @param {FeesDistribution} feesY - The current amount of fees to distribute in tokenY (total, protocol)
     */
    constructor(
      public activeId: u32 = 0,
      public reserveX: u64 = 0,
      public reserveY: u64 = 0,
      public feesX: FeesDistribution = new FeesDistribution(),
      public feesY: FeesDistribution = new FeesDistribution(),
      public oracleSampleLifetime: u32 = 0,
      public oracleSize: u32 = 0,
      public oracleActiveSize: u32 = 0,
      public oracleLastTimestamp: u64 = 0,
      public oracleId: u32 = 0,
    ) {}
  
    // ======================================================== //
    // ====                  SERIALIZATION                 ==== //
    // ======================================================== //
  
    serialize(): StaticArray<u8> {
      return new Args()
        .add(this.activeId)
        .add(this.reserveX)
        .add(this.reserveY)
        .add(this.feesX)
        .add(this.feesY)
        .add(this.oracleSampleLifetime)
        .add(this.oracleSize)
        .add(this.oracleActiveSize)
        .add(this.oracleLastTimestamp)
        .add(this.oracleId)
        .serialize();
    }
  
    deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
      const args = new Args(data, offset);
      this.activeId = args.nextU32().expect('Failed to deserialize activeId');
      this.reserveX = args.nextU64().expect('Failed to deserialize reserveX');
      this.reserveY = args.nextU64().expect('Failed to deserialize reserveY');
      this.feesX = args
        .nextSerializable<FeesDistribution>()
        .expect('Failed to deserialize feesX');
      this.feesY = args
        .nextSerializable<FeesDistribution>()
        .expect('Failed to deserialize feesY');
      this.oracleSampleLifetime = args
        .nextU32()
        .expect('Failed to deserialize oracleSampleLifetime');
      this.oracleSize = args.nextU32().expect('Failed to deserialize oracleSize');
      this.oracleActiveSize = args
        .nextU32()
        .expect('Failed to deserialize oracleActiveSize');
      this.oracleLastTimestamp = args
        .nextU64()
        .expect('Failed to deserialize oracleLastTimestamp');
      this.oracleId = args.nextU32().expect('Failed to deserialize oracleId');
      return new Result(args.offset);
    }
  }
  
  export class FeesDistribution implements Serializable {
    /**
     * @param {u64} total - The total amount of fees
     * @param {u64} protocol - The amount of fees reserved for protocol
     */
    constructor(public total: u64 = 0, public protocol: u64 = 0) {}
  
    /**
     * Calculate the tokenPerShare when fees are added
     *
     * @param {u64} totalSupply - the total supply of a specific bin
     */
    getTokenPerShare(totalSupply: u64): u64 {
      // This can't overflow as `totalFees >= protocolFees`,
      // shift can't overflow as we shift fees that are a uint32, by 32 bits.
      // The result will always be smaller than max(uint64)
      const fees = this.total - this.protocol;
      const shifted = fees << u32.MAX_VALUE;
      return shifted / totalSupply;
    }
  
    // ======================================================== //
    // ====                  SERIALIZATION                 ==== //
    // ======================================================== //
  
    serialize(): StaticArray<u8> {
      return new Args().add(this.total).add(this.protocol).serialize();
    }
  
    deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
      const args = new Args(data, offset);
      this.total = args.nextU64().expect('Failed to deserialize total fees');
      this.protocol = args
        .nextU64()
        .expect('Failed to deserialize protocol fees');
      return new Result(args.offset);
    }
  }
  
  export class Bin implements Serializable {
    constructor(
      public reserveX: u64 = 0,
      public reserveY: u64 = 0,
      public accTokenXPerShare: u64 = 0,
      public accTokenYPerShare: u64 = 0,
    ) {}
  
    /**
     * Update the fees of the pair and accumulated token per share of the bin
     *
     * @param {FeesDistribution} pairFees - The current fees of the pair information
     * @param {FeesDistribution} fees - The fees amounts added to the pairFees
     * @param {bool} swapForY - whether the token sent was Y (true) or X (false)
     * @param {u64} totalSupply - The total supply of the token id
     */
    updateFees(
      pair: PairInformation,
      fees: FeesDistribution,
      swapForY: bool,
      totalSupply: u64,
    ): void {
      if (swapForY) {
        pair.feesX.total += fees.total;
        pair.feesX.protocol += fees.protocol;
        this.accTokenXPerShare += fees.getTokenPerShare(totalSupply);
      } else {
        pair.feesY.total += fees.total;
        pair.feesY.protocol += fees.protocol;
        this.accTokenYPerShare += fees.getTokenPerShare(totalSupply);
      }
    }
  
    /**
     * Update reserves
     *
     * @param {PairInformation} pair - The pair information
     * @param {bool} swapForY - whether the token sent was Y (true) or X (false)
     * @param {u64} amountInToBin - The amount of token that is added to the bin without fees
     * @param {u64} amountOutOfBin - The amount of token that is removed from the bin
     */
    updateReserves(
      pair: PairInformation,
      swapForY: bool,
      amountInToBin: u64,
      amountOutOfBin: u64,
    ): void {
      if (swapForY) {
        this.reserveX = add(this.reserveX, amountInToBin);
  
        // safe uncheck
        this.reserveY -= amountOutOfBin;
        pair.reserveX += amountInToBin;
        pair.reserveY -= amountOutOfBin;
      } else {
        this.reserveY = add(this.reserveY, amountInToBin);
  
        // safe uncheck
        this.reserveX -= amountOutOfBin;
        pair.reserveX -= amountOutOfBin;
        pair.reserveY += amountInToBin;
      }
    }
  
  
    // ======================================================== //
    // ====                  SERIALIZATION                 ==== //
    // ======================================================== //
  
    serialize(): StaticArray<u8> {
      return new Args()
        .add(this.reserveX)
        .add(this.reserveY)
        .add(this.accTokenXPerShare)
        .add(this.accTokenYPerShare)
        .serialize();
    }
  
    deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
      const args = new Args(data, offset);
      this.reserveX = args.nextU64().expect("Can't deserialize reserveX");
      this.reserveY = args.nextU64().expect("Can't deserialize reserveY");
      this.accTokenXPerShare = args
        .nextU64()
        .expect("Can't deserialize accTokenXPerShare");
      this.accTokenYPerShare = args
        .nextU64()
        .expect("Can't deserialize accTokenYPerShare");
      return new Result(args.offset);
    }
  }
  
  function add(a: u64, b: u64): u64 {
    const c: u64 = a + b;
    assert(c >= a, 'SafeMath: addition overflow');
  
    return c;
  }
  