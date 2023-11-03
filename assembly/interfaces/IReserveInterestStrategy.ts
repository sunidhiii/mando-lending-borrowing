import { Args, bytesToU64, stringToBytes } from "@massalabs/as-types";
import { Address, Storage, call } from "@massalabs/massa-as-sdk";

const baseVariableBorrowRateKey = stringToBytes('BASE_VARIABLE_BORROW_RATE'); // 0

export class IReserveInterestRateStrategy {

    _origin: Address;

    /**
     * Wraps a smart contract exposing standard token FFI.
     *
     * @param {Address} at - Address of the smart contract.
     */
    constructor(at: Address) {
        this._origin = at;
    }

    getBaseVariableBorrowRate(): u64 {
        return bytesToU64(Storage.getOf(this._origin, baseVariableBorrowRateKey));
    }

    calculateInterestRates(availableLiquidity: u64, totalBorrowsStable: u64, totalBorrowsVariable: u64, averageStableBorrowRate: u64): Array<u64> {        
        return new Args(call(this._origin, "calculateInterestRates", new Args().add(availableLiquidity).add(totalBorrowsStable).add(totalBorrowsVariable).add(averageStableBorrowRate), 0)).nextFixedSizeArray<u64>().unwrap();
    }

}