import { Args } from "@massalabs/as-types";
import { generateEvent } from "@massalabs/massa-as-sdk";

export function constructor(_: StaticArray<u8>): void {
    // This line is important. It ensures that this function can't be called in the future.
    // If you remove this check, someone could call your constructor function and reset your smart contract.

}

export function arrU64x(): StaticArray<u8> {
    let arr: Array<u64> = new Array(2);
    arr[0] = 0;
    arr[1] = u64.MAX_VALUE;
    return new Args().add(arr).serialize();
}

export function arrU64(binaryArgs :StaticArray<u8>): StaticArray<u8> {  // Worked
    const args = new Args(binaryArgs);
    const num = args.nextU256().unwrap();
    
    let arr: Array<u64> = new Array(2);
    arr[0] = u64.parse(num.toString()) + 1;
    arr[1] = u64.MAX_VALUE;
    return new Args().add(arr).serialize();
}

export function arrU64Again(binaryArgs :StaticArray<u8>): StaticArray<u8> {
    const args = new Args(binaryArgs);
    const num = args.nextU256().unwrap();

    return new Args().add(u64.parse(num.toString()) + 1).add(10).serialize();
}

export function arrU64Again1(binaryArgs :StaticArray<u8>): StaticArray<u8> {  // Worked
    const args = new Args(binaryArgs);
    const num = args.nextU256().unwrap();

    return new Args().add<Array<u64>>([u64.parse(num.toString()) + 1, 10]).serialize();
}

export function getrrU64(): StaticArray<u8> {
    const args = new Args(arrU64(new Args().add(4).serialize()));
    const data = args.nextU64().unwrap()
    const data1 = args.nextU64().unwrap()

    const argsAgain1 = new Args(arrU64Again1(new Args().add(4).serialize()));
    const data4 = argsAgain1.nextFixedSizeArray<u64>().unwrap()
    const data5 = data4[0];

    const argsAgain2 = new Args(arrU64Again1(new Args().add(4).serialize()));
    const data6 = argsAgain2.nextU64().unwrap()
    const data7 = argsAgain2.nextU64().unwrap()
    
    generateEvent(`Data ==> ${data} & ${data1} & ${data5} & ${data6} & ${data7}`)
    // return [data, data1, data5, data6, data7]
    return []
}