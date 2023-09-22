import { Args, bytesToU64 } from '@massalabs/as-types';
import { Address, call } from '@massalabs/massa-as-sdk';
import { IERC20 } from './IERC20';

export class GetSwapInReturn {
  constructor(public amountIn: u64 = 0, public feesIn: u64 = 0) {}
}
export class GetSwapOutReturn {
  constructor(public amountOut: u64 = 0, public feesIn: u64 = 0) {}
}
export class IRouter {
  _origin: Address;

  /*
   * Wraps a smart contract exposing standard token FFI.
   *
   * @param {Address} at - Address of the smart contract.
   */
  constructor(at: Address) {
    this._origin = at;
  }

  /*
   * Swaps exact tokens for tokens while performing safety checks
   *
   * @param {u64} amountIn - The amount of tokens to send
   * @param {u64} amountOutMin - The min amount of tokens to receive
   * @param {Array<u64>} pairBinSteps - The bin step of the pairs (0: V1, other values will use V2)
   * @param {IERC20[]} tokenPath - The swap path using the binSteps following _pairBinSteps
   * @param {Address} to - The address of the recipient
   * @param {u64} deadline - The deadline of the tx
   */
  swapExactTokensForTokens(
    amountIn: u64,
    amountOutMin: u64,
    pairBinSteps: Array<u64>,
    tokenPath: IERC20[],
    to: Address,
    deadline: u64,
  ): u64 {
    const args = new Args()
      .add(amountIn)
      .add(amountOutMin)
      .add(pairBinSteps)
      .addSerializableObjectArray(tokenPath)
      .add(to)
      .add(deadline);
    const res = call(this._origin, 'swapExactTokensForTokens', args, 0);
    return bytesToU64(res);
  }

  /*
   * Swaps exact tokens for MAS while performing safety checks
   *
   * @param {u64} amountIn - The amount of tokens to send
   * @param {u64} amountOutMinMAS - The min amount of MAS to receive
   * @param {Array<u64>} pairBinSteps - The bin step of the pairs (0: V1, other values will use V2)
   * @param {IERC20[]} tokenPath - The swap path using the binSteps following `_pairBinSteps`
   * @param {Address} to - The address of the recipient
   * @param {u64} deadline - The deadline of the tx
   */
  swapExactTokensForMAS(
    amountIn: u64,
    amountOutMinMAS: u64,
    pairBinSteps: Array<u64>,
    tokenPath: IERC20[],
    to: Address,
    deadline: u64,
  ): u64 {
    const args = new Args()
      .add(amountIn)
      .add(amountOutMinMAS)
      .add(pairBinSteps)
      .addSerializableObjectArray(tokenPath)
      .add(to)
      .add(deadline);
    const res = call(this._origin, 'swapExactTokensForMAS', args, 0);
    return bytesToU64(res);
  }

  /*
   * Swaps exact MAS for tokens while performing safety checks
   *
   * @param {u64} amountIn - The amount of MAS to send
   * @param {u64} amountOutMin - The min amount of token to receive
   * @param {Array<u64>} pairBinSteps - The bin step of the pairs (0: V1, other values will use V2)
   * @param {IERC20[]} tokenPath - The swap path using the binSteps following _pairBinSteps
   * @param {Address} to - The address of the recipient
   * @param {u64} deadline - The deadline of the tx
   */
  swapExactMASForTokens(
    amountIn: u64,
    amountOutMin: u64,
    pairBinSteps: Array<u64>,
    tokenPath: IERC20[],
    to: Address,
    deadline: u64,
  ): u64 {
    const args = new Args()
      .add(amountOutMin)
      .add(pairBinSteps)
      .addSerializableObjectArray(tokenPath)
      .add(to)
      .add(deadline);
    const res = call(this._origin, 'swapExactMASForTokens', args, amountIn);
    return bytesToU64(res);
  }

  /*
  * Swaps tokens for exact tokens while performing safety checks
  *
  * @param {u64} amountOut - The amount of token to receive
  * @param {u64} amountInMax - The max amount of token to send
  * @param {Array<u64>} pairBinSteps - The bin step of the pairs (0: V1, other values will use V2)
  * @param {IERC20[]} tokenPath - The swap path using the binSteps following `_pairBinSteps`
  * @param {Address} to - The address of the recipient
  * @param {u64} deadline - The deadline of the tx
  */
 swapTokensForExactTokens(
   amountOut: u64,
   amountInMax: u64,
   pairBinSteps: Array<u64>,
   tokenPath: IERC20[],
   to: Address,
   deadline: u64,
 ): u64 {
   const args = new Args()
     .add(amountOut)
     .add(amountInMax)
     .add(pairBinSteps)
     .addSerializableObjectArray(tokenPath)
     .add(to)
     .add(deadline);
   const res = call(this._origin, 'swapTokensForExactTokens', args, 0);
   return bytesToU64(res);
 }

 /*
  * Swaps tokens for exact MAS while performing safety checks
  *
  * @param {u64} amountOut - The amount of MAS to receive
  * @param {u64} amountInMax - The max amount of token to send
  * @param {Array<u64>} pairBinSteps - The bin step of the pairs (0: V1, other values will use V2)
  * @param {IERC20[]} tokenPath - The swap path using the binSteps following _pairBinSteps
  * @param {Address} to - The address of the recipient
  * @param {u64} deadline - The deadline of the tx
  */
 swapTokensForExactMAS(
   amountOut: u64,
   amountInMax: u64,
   pairBinSteps: Array<u64>,
   tokenPath: IERC20[],
   to: Address,
   deadline: u64,
 ): u64 {
   const args = new Args()
     .add(amountOut)
     .add(amountInMax)
     .add(pairBinSteps)
     .addSerializableObjectArray(tokenPath)
     .add(to)
     .add(deadline);
   const res = call(this._origin, 'swapTokensForExactMAS', args, 0);
   return bytesToU64(res);
 }

 /**
  * Swaps MAS for exact tokens while performing safety checks
  *
  * @param {u64} amountOut - The amount of token to receive
  * @param {u64} amountInMax - The max amount of token to send
  * @param {Array<u64>} pairBinSteps - The bin step of the pairs (0: V1, other values will use V2)
  * @param {IERC20[]} tokenPath - The swap path using the binSteps following _pairBinSteps
  * @param {Address} to - The address of the recipient
  * @param {u64} deadline - The deadline of the tx
  */
 swapMASForExactTokens(
   amountOut: u64,
   amountInMax: u64,
   pairBinSteps: Array<u64>,
   tokenPath: IERC20[],
   to: Address,
   deadline: u64,
 ): u64 {
   const args = new Args()
     .add(amountOut)
     .add(pairBinSteps)
     .addSerializableObjectArray(tokenPath)
     .add(to)
     .add(deadline);
   const res = call(this._origin, 'swapMASForExactTokens', args, amountInMax);
   return bytesToU64(res);
 }

 getSwapIn(_pair: Address, _amountOut: u64, _swapForY: bool): GetSwapInReturn {
   const args = new Args().add(_pair).add(_amountOut).add(_swapForY);
   const result = new Args(call(this._origin, 'getSwapIn', args, 0));
   return new GetSwapInReturn(
     result.nextU64().unwrap(),
     result.nextU64().unwrap(),
   );
 }

 getSwapOut(_pair: Address, _amountIn: u64, _swapForY: bool): GetSwapOutReturn {
   const args = new Args().add(_pair).add(_amountIn).add(_swapForY);
   const result = new Args(call(this._origin, 'getSwapOut', args, 0));
   return new GetSwapOutReturn(
     result.nextU64().unwrap(),
     result.nextU64().unwrap(),
   );
 }

}