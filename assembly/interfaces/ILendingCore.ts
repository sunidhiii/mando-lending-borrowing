import { Args, NoArg, bytesToU64 } from '@massalabs/as-types';
import { Address, call } from '@massalabs/massa-as-sdk';
import Reserve from '../helpers/Reserve';
import UserReserve from '../helpers/UserReserve';

export class ILendingCore {
  _origin: Address;

  /**
   * Wraps a smart contract exposing standard token FFI.
   *
   * @param at - Address of the smart contract.
   */
  constructor(at: Address) {
    this._origin = at;
  }

  initReserve(reserve: Reserve): void {
    // const arg = new Args().add(reserve);
    call(this._origin, 'initReserve', new Args().add(reserve), 0);
  }

  getReserve(reserve: string): Reserve {
    const result = call(this._origin, 'getReserve', new Args().add(reserve), 0);
    const reserveData = new Args(result).nextSerializable<Reserve>().unwrap();
    return reserveData;
  }

  deleteReserve(reserve: string): void {
    const arg = new Args().add(reserve);
    call(this._origin, 'deleteReserve', arg, 0);
  }

  initUser(userReserve: UserReserve, reserve: string): void {
    const arg = new Args().add(userReserve).add(reserve);
    call(this._origin, 'initUser', arg, 2);
  }

  getUserReserve(_user: Address, _reserve: string): UserReserve {
    const result = call(
      this._origin,
      'getUserReserve',
      new Args().add(_user.toString()).add(_reserve),
      0,
    );
    const userData = new Args(result).nextSerializable<UserReserve>().unwrap();
    return userData;
  }

  transferToReserve(_reserve: Address, _user: Address, _amount: u64): void {
    const args = new Args()
      .add(_reserve.toString())
      .add(_user.toString())
      .add(_amount);
    call(this._origin, 'transferToReserve', args, 0);
  }

  transferFeeToOwner(_reserve: string, _user: Address, _amount: u64): void {
    const args = new Args().add(_reserve).add(_user.toString()).add(_amount);
    call(this._origin, 'transferFeeToOwner', args, 0);
  }

  transferToUser(_reserve: Address, _user: Address, _amount: u64): void {
    const args = new Args()
      .add(_reserve.toString())
      .add(_user.toString())
      .add(_amount);
    call(this._origin, 'transferToUser', args, 0);
  }

  viewAllReserves(): string[] {
    let reserves = call(this._origin, 'viewAllReserves', NoArg, 0);
    // let reservesData: string[] = reserves.toString().split(',');
    let reservesData = new Args(reserves).nextStringArray().unwrap();
    return reservesData;
    // return bytesToFixedSizeArray<string>(call(this._origin, "viewAllReserves", new Args(), 0));
  }

  getReserveAvailableLiquidity(reserve: string): u64 {
    return bytesToU64(
      call(
        this._origin,
        'getReserveAvailableLiquidity',
        new Args().add(reserve),
        0,
      ),
    );
  }

  getUserBorrowBalances(reserve: string, user: string): Array<u64> {
    return new Args(
      call(
        this._origin,
        'getUserBorrowBalances',
        new Args().add(reserve).add(user),
        0,
      ),
    )
      .nextFixedSizeArray<u64>()
      .unwrap();
  }

  updateStateOnDeposit(
    reserve: string,
    user: string,
    amount: u64,
    isFirstDeposit: bool,
  ): void {
    call(
      this._origin,
      'updateStateOnDeposit',
      new Args().add(reserve).add(user).add(amount).add(isFirstDeposit),
      1,
    );
  }

  updateStateOnBorrow(
    reserve: string,
    user: string,
    amount: u64,
    borrowFee: u64,
    rateMode: u8,
  ): void {
    const args = new Args()
      .add(reserve)
      .add(user)
      .add(amount)
      .add(borrowFee)
      .add(rateMode);
    call(this._origin, 'updateStateOnBorrow', args, 1);
  }

  updateStateOnRepay(
    reserve: string,
    user: string,
    paybackAmountMinusFees: u64,
    originationFeeRepaid: u64,
    balanceIncrease: u64,
    repaidWholeLoan: bool,
  ): void {
    const args = new Args()
      .add(reserve)
      .add(user)
      .add(paybackAmountMinusFees)
      .add(originationFeeRepaid)
      .add(balanceIncrease)
      .add(repaidWholeLoan);
    call(this._origin, 'updateStateOnRepay', args, 1);
  }

  updateStateOnRedeem(
    reserve: string,
    user: string,
    amountRedeemed: u64,
    userRedeemedEverything: bool,
  ): void {
    const args = new Args()
      .add(reserve)
      .add(user)
      .add(amountRedeemed)
      .add(userRedeemedEverything);
    call(this._origin, 'updateStateOnRedeem', args, 1);
  }

  getNormalizedIncome(reserve: string): u64 {
    return bytesToU64(
      call(this._origin, 'getNormalizedIncome', new Args().add(reserve), 0),
    );
  }

  getUserBasicReserveData(reserve: string, user: string): Array<u64> {
    return new Args(
      call(
        this._origin,
        'getUserBasicReserveData',
        new Args().add(reserve).add(user),
        0,
      ),
    )
      .nextFixedSizeArray<u64>()
      .unwrap();
  }
}
