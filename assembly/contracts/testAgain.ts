import { Address, Context, generateEvent } from "@massalabs/massa-as-sdk";
import { u256 } from 'as-bignum/assembly';
import { timestamp } from "@massalabs/massa-as-sdk/assembly/std/context";
import { onlyOwner, ownerAddress } from "../helpers/ownership";
import { ONE_UNIT } from "./FeeProvider";
import { ILendingCore } from "../interfaces/ILendingCore";
import { ILendingAddressProvider } from "../interfaces/ILendingAddressProvider";
import { Args, bytesToString } from "@massalabs/as-types";
import { IRouter } from "../interfaces/IRouter";
import { IERC20 } from "../interfaces/IERC20";
import { IFactory } from "../interfaces/IFactory";

export function constructor(_: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  // const ONE_UNIT = 1000000000;
  // const lastUpdateTimestamp = 1697010645182;
  // const rate: u256 = u256.fromU64(1000001248);
  // const rate1 = 1.000001248;

  // const ratePerSecond = u64.parse(rate.toString()) / 31536000;
  // const ratePerSecond2: f64 = f64.parse(rate.toString()) / f64(31536000);
  // const ratePerSecond1 = (u64.parse(rate.toString()) * ONE_UNIT) / 31536000;

  // const data =  u256.fromU64((ratePerSecond + ONE_UNIT) ** (timeDifference));
  // const data2 =  u256.fromF64((ratePerSecond2 + f64(ONE_UNIT)) ** f64(timeDifference));
  // const data1 =  u256.fromU64(((ratePerSecond1 + ONE_UNIT) / ONE_UNIT) ** (timeDifference));
  //  data: 'data 13216000, 31, 3.170983155758498e-8, 0, 1409696000, 0, 0 0 1.0055134174104122e-24, 1000000000.4190772, 3.1884661094975805e-41, 8.781281541983695e-11 1.2266779144568718e-20 '
  // data: 'data 13984000, 3.170983155758498e-8, 1.0055134174104123e-15, 1.556277463267316, 3.188466109497581e-23, 0.09831520157588808, 0.014531977190159548 '


  // const exp = timestamp() - lastUpdateTimestamp;

  // const expMinusOne = exp - 1;
  // const expMinusTwo = exp > 2 ? exp - 2 : 0;

  // const ratePerSecond = (u64.parse(rate.toString()) ) / 31536000;
  // const basePowerTwo = (ratePerSecond * ratePerSecond) / ONE_UNIT;
  // const basePowerThree = (basePowerTwo * ratePerSecond) / ONE_UNIT;
  // const secondTerm = (exp * expMinusOne * basePowerTwo) / 2;
  // const thirdTerm = (exp * expMinusOne * expMinusTwo * basePowerThree) / 6;
  // const data = u256.fromU64(ONE_UNIT + (ratePerSecond * exp) + secondTerm + thirdTerm);

  // const ratePerSecond1 = f64(rate1) / f64(31536000);
  // const basePowerTwo1 = f64(ratePerSecond1) * f64(ratePerSecond1);
  // const basePowerThree1 = f64(basePowerTwo1) * f64(ratePerSecond1);
  // const secondTerm1 = (f64(exp) * f64(expMinusOne) * f64(basePowerTwo1)) / 2.0;
  // const thirdTerm1 = (f64(exp) * f64(expMinusOne) * f64(expMinusTwo) * f64(basePowerThree1)) / 6.0;
  // const data1 = f64(1.0 + (f64(ratePerSecond1) * f64(exp)) + f64(secondTerm1) + f64(thirdTerm1));

  // const data: f64 = 1.556277463267316;
  // const data1 = u64(data);
  // const data2 = u256.fromF64(data);

  // var n = timestamp() - lastUpdateTimestamp
  // var ratePerSecond = u64.parse(rate.toString()) / 31536000;
  // var x = ONE_UNIT + ratePerSecond;

  // var z = n % 2 != 0 ? x : ONE_UNIT;

  // for (n /= 2; n != 0; n /= 2) {
  //   x = (x * x) / ONE_UNIT;

  //   if (n % 2 != 0) {
  //     z = (z * x) / ONE_UNIT;
  //   }
  // }

  // const _balance: u256 = new u256(8050000000000);
  // const normalizedIncome: u256 = new u256(1023186051);
  // const userIndex: u256 = new u256(1022945862);
  // const currentSupplyPrincipal: u256 = new u256(5014925727293);
  // const normalizedIncome1: u64 = 1023186051;
  // const userIndex1: u64 = 1022945862;
  // let cumulatedBal: u256 = u256.Zero;
  // let cumulatedBal2: u64 = 0;
  // let cumulatedBal1: u64 = 0;
  // cumulatedBal = u256.fromU64((u64.parse(_balance.toString()) * u64.parse(normalizedIncome.toString())) / u64.parse(userIndex.toString()));
  // cumulatedBal2 = (u64.parse(_balance.toString()) * (normalizedIncome / userIndex));
  // const totalSupply = (u64.parse(currentSupplyPrincipal.toString()) * u64.parse(normalizedIncome.toString())) / ONE_UNIT;
  // const totalSupply3 = u64((f64.parse(currentSupplyPrincipal.toString()) * f64.parse(normalizedIncome.toString())) / f64(ONE_UNIT));
  // const totalSupply1 = u64.parse(currentSupplyPrincipal.toString()) * (u64.parse(normalizedIncome.toString()) / ONE_UNIT);
  // const totalSupply2 = u64(f64.parse(currentSupplyPrincipal.toString()) * (f64.parse(normalizedIncome.toString()) / f64(ONE_UNIT)));

  // cumulatedBal1 = u64((f64.parse(_balance.toString()) * f64(normalizedIncome1)) / f64(userIndex1));

  //     data: 'data 9189004056, 8051890150321.562, 8050000000000'

  // const reserveDecimals = 9;
  // const reserveDecimals1 = 18;
  // const tokenUnit = 10 ** reserveDecimals;
  // const tokenUnit1 = 10 ** reserveDecimals1;

  // const ONE_UNIT = 1000000000;
  // const cumulatedLiquidityInterest: f64 = 1289733654621123.0;
  // const cumulatedLiquidityInterest1 = 128923733654698;

  // const updatedLastLiquidityCumulativeIndex = u64(cumulatedLiquidityInterest) * u64(f64(cumulatedLiquidityInterest1) / f64(ONE_UNIT));
  // const updatedLastLiquidityCumulativeIndex1 = u64((cumulatedLiquidityInterest * f64(cumulatedLiquidityInterest1)) / f64(ONE_UNIT));

  // const core = new ILendingCore(new Address('AS12mPMppiXh1RNWLLxpgexDZPhjGTukaeovjvrMzUPsexFXnbM2y'));
  // const isAutoRewardEnabled = core.getUserReserve(new Address('AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8'), new Address('AS12ZMZHtmmXPjyujRk9BAoigish2F5TuSSrupYanxjq55YaDDLva')).autonomousRewardStrategyEnabled;
  // const owner = new ILendingAddressProvider(new Address('AS1c9FRU4VZufLdaLSLJiDwA8izqPecyNKwHWCENGZPNh9ixd3jp')).getOwner();
  // const owner = bytesToString(ownerAddress(new Args().serialize()));

  // const arr = cumulateBalanceInternal();

  // const previousBalance: u64 = arr[1];
  // const currentBalance: u64 = arr[1];
  // const balanceIncrease: u64 = arr[2];
  
    // const FACTORY = new Address("AS1pLmABmGWUTBoaMPwThauUy75PQi8WW29zVYMHbU54ep1o9Hbf");
    // const ROUTER = new Address("AS12ZhJYEffSWWyp7XvCoEMKFBnbXw5uwp6S3cY2xbEr76W3VL3Dk");
    // const USDC = new Address("AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9");
    // const WMAS = new Address("AS1JKtvk4HDkxoL8XSCF4XFtzXdWsVty7zVu4yjbWAjS58tP9KzJ");
    // const WETH = new Address("AS1SVGodhgXdRXrjrPURBRk3ay4sHLgYWzDC3PXAjvTxjzraLaQ8");
    // const USDC = new Address("AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9");
    
    // let amount: u64 = 1;
    // const binStep: u64 = 20;
    // const router = new IRouter(ROUTER);
    // const factory = new IFactory(FACTORY);
    // const wmas = new IERC20(WMAS);
    // const usdc = new IERC20(USDC);
    // const pair = factory.getLBPairInformation(wmas._origin, usdc._origin, binStep).pair;
    // const wmas_is_y = pair.getTokenY()._origin == usdc._origin;
    // const swapForY = wmas_is_y;
    // const amountIn = router.getSwapIn(pair._origin, amount * ONE_UNIT, swapForY).amountIn;
    // const path = [wmas, usdc];
    // const deadline = Context.timestamp() + 5000;

  // const name2 = 'Mando Interest bearing ' + new IERC20(WMAS).name();
  // const symbol2 = 'm'.concat(new IERC20(WMAS).symbol());

  // const name1 = 'Mando Interest bearing '.concat(new IERC20(WMAS).name());
  // const symbol1 = 'm' + new IERC20(WMAS).symbol();
  // let binStep: u64 = 0;
  
  // const symbol = new IERC20(WMAS).symbol();
  // const name = new IERC20(new Address('AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9')).name();
  // const symbol1 = new IERC20(new Address('AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9')).symbol();
  // if (symbol == 'USDC') {
  //   binStep = 20;
  // } else if (symbol == 'WETH') {
  //   binStep = 15;
  // } else {
  //   binStep = 10;
  // }
  
  // let aas: bool = false;
  // let test : number = 0;

  // if(pair) {
    //   aas = true;
    //   test = 10;
    // }

  // const createdByOwner = factory.getLBPairInformation(new Address('AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9'), WMAS, 10).createdByOwner;
  // const ignoredForRouting = factory.getLBPairInformation(new Address('AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9'), WMAS, 10).ignoredForRouting;

  // const name = new IERC20(WMASt).name();
  // const symbol = new IERC20(WMASt).symbol();
  // const name1 = new IERC20(WETHt).name();
  // const symbol1 = new IERC20(WETHt).symbol();
  // const name2 = new IERC20(USDCt).name();
  // const symbol2 = new IERC20(USDCt).symbol();
  //   // router.swapExactTokensForTokens(amountIn, 0, [binStep], path, Context.callee(), deadline);
  //   generateEvent(`${name} ${symbol} ${name1} ${symbol1} ${name2} ${symbol2}`);

  // generateEvent(`data ${previousBalance} ${currentBalance} ${balanceIncrease}`);
}

export function test(): void {
  let abcd = 3;
  testing();
  abcd = 4;
  generateEvent(`${abcd}`);
}

function testing(): void {
  let abc: u64 = 0;
  if(abc == 1) {
    abc = 1;
  } else {
    return;
  }

  abc = 2;

}

// export function swapping(): void {  // Worked
    
//   const FACTORY = new Address("AS1pLmABmGWUTBoaMPwThauUy75PQi8WW29zVYMHbU54ep1o9Hbf");
//   const ROUTER = new Address("AS12ZhJYEffSWWyp7XvCoEMKFBnbXw5uwp6S3cY2xbEr76W3VL3Dk");
//   const USDC = new Address("AS1fznHuwLZSbADxaRY1HNfA7hgqHQrNkf2F12vZP2xrwNzAW7W9");
//   const WMAS = new Address("AS1JKtvk4HDkxoL8XSCF4XFtzXdWsVty7zVu4yjbWAjS58tP9KzJ");
  
//   let amount: u64 = 1;
//   const binStep: u64 = 20;
//   const router = new IRouter(ROUTER);
//   const factory = new IFactory(FACTORY);
//   const wmas = new IERC20(WMAS);
//   const usdc = new IERC20(USDC);
//   const pair = factory.getLBPairInformation(wmas._origin, usdc._origin, binStep).pair;
//   const usdc_is_y = pair.getTokenY()._origin == usdc._origin;
//   const swapForY = usdc_is_y;
//   const amountIn = router.getSwapIn(pair._origin, amount * ONE_UNIT, swapForY).amountIn;
//   const path = [wmas, usdc];
//   const deadline = Context.timestamp() + 5000;
//   new IERC20(WMAS).transferFrom(Context.caller(), Context.callee(), amountIn);
//   new IERC20(WMAS).increaseAllowance(router._origin, amountIn);

//   router.swapExactTokensForTokens(amountIn, 0, [binStep], path, Context.callee(), deadline);
//   generateEvent(`DEBUG: Bought ${usdc_is_y} ${pair._origin} ${amount} ${swapForY} WMAS for ${amountIn} USDC`);

// }

// function cumulateBalanceInternal(): Array<u64> { 
//   const balanceOf: u256 = new u256(3074008113407);
//   const previousPrincipalBal: u256 = new u256(3073999999969);
//   const balanceIncrease = u64.parse(balanceOf.toString()) > u64.parse(previousPrincipalBal.toString()) ? u64.parse(balanceOf.toString()) - u64.parse(previousPrincipalBal.toString()) : 0;
  
//   generateEvent(`Balance ${previousPrincipalBal} increased to ${balanceIncrease} tokens`)

//   return [u64.parse(previousPrincipalBal.toString()), (u64.parse(previousPrincipalBal.toString()) + balanceIncrease), (balanceIncrease)];
// }

//     data: 'data 9189004056, 8051890150321.562, 8050000000000'

// const reserveDecimals = 9;
// const reserveDecimals1 = 18;
// const tokenUnit = 10 ** reserveDecimals;
// const tokenUnit1 = 10 ** reserveDecimals1;

//   generateEvent(`data ${tokenUnit}, ${tokenUnit1}`);
// }



// export function arrU64Again12(): StaticArray<u8> {  // Worked
//     const num: u64 = 1;
//     const numm = u256.fromU64(u64.parse(u256.fromU64(num).toString()) + 1);
//     return new Args().add<Array<u256>>([numm, numm]).serialize();
// }

// export function arrU64Again(): StaticArray<u8> {  // Worked
//     const num: u64 = 1;
//     const numm: u64 = 10;
//     return new Args().add<Array<u64>>([num, numm]).serialize();
// }

// export function arrU64Again1(): Array<u64> {  // Worked
//     const num: u64 = 10;
//     const numm: u64 = 11;
//     return [num, numm];
// }

// export function getrrU64(): StaticArray<u8> {  // Wrong data

//     const itest = new ITest(new Address('AS12RdRD3QMA5CUjXegmEdyzwoXhXY5ThSe1oXVnMH3L5upZQJLMc'));

//     const argsAgain1 = itest.arrU64Again1(u256.fromU64(4));
//     const data21 = argsAgain1[0]
//     const data31 = argsAgain1[1]

//     generateEvent(`Data ==> ${data21} & ${data31}`)
//     return new Args().add<Array<u64>>([data21, data31]).serialize()
// }

// export function getrrU64a(): StaticArray<u8> {  //  Worked

//     const itest = new ITest(new Address('AS12RdRD3QMA5CUjXegmEdyzwoXhXY5ThSe1oXVnMH3L5upZQJLMc'));

//     const argsAgain1 = itest.arrU64Again2(u256.fromU64(4));
//     const data21 = argsAgain1[0]
//     const data31 = argsAgain1[1]

//     generateEvent(`Data ==> ${data21} & ${data31}`)
//     return new Args().add<Array<u64>>([data21, data31]).serialize()
// }

// export function testing(): StaticArray<u8> {   // Worked

//     const data21 = arrU64Again1()
//     const data31 = data21[0]
//     const data1 = data21[1]

//     const data = data1 + 1;

//     generateEvent(`Data ==> ${data21} & ${data1} & ${data}`)
//     return u64ToBytes(data);
// }

// export function testing1(): StaticArray<u8> {  // Wrong data

//     const data21 = new Args(arrU64Again())
//     const data31 = data21.nextU64().unwrap()
//     const data1 = data21.nextU64().unwrap();

//     const data = data1 + 1;

//     generateEvent(`Data ==> ${data31} & ${data1} & ${data}`)
//     return u64ToBytes(data);
// }

// export function testing2(): StaticArray<u8> {  // Wrong data

//     const data21 = bytesToFixedSizeArray<u64>(arrU64Again())
//     const data31 = data21[0]
//     const data1 = data21[1];

//     const data = data1 + 1;

//     generateEvent(`Data ==> ${data31} & ${data1}  & ${data}`)
//     return u64ToBytes(data);
// }

// export function testing3(): StaticArray<u8> {  // Worked

//     const data21 = new Args(arrU64Again()).nextFixedSizeArray<u64>().unwrap()
//     const data31 = data21[0]
//     const data1 = data21[1];

//     const data = data1 + 1;

//     generateEvent(`Data ==> ${data31} & ${data1}  & ${data}`)
//     return u64ToBytes(data);
// }

// export function testing4(): StaticArray<u8> {  // Worked

//     const itest = new ITest(new Address('AS12RdRD3QMA5CUjXegmEdyzwoXhXY5ThSe1oXVnMH3L5upZQJLMc'));

//     const data21 = itest.arrU64(u256.fromU64(4))
//     const data31 = data21[0]
//     const data1 = data21[1];

//     const data = data1 + 1;

//     generateEvent(`Data ==> ${data31} & ${data1}  & ${data}`)
//     return u64ToBytes(data);
// }

// export function testing4(): StaticArray<u8> {  // Worked

//     const underlyingBalance: u256 = new u256(999999000000001);
//     let userReserveData: Array<u64> = new Array(3)
//     userReserveData[0] = u64.parse(underlyingBalance.toString());
//     const data = u64.parse(underlyingBalance.toString());

//     generateEvent(`Data ==> ${underlyingBalance} & ${userReserveData[0]}  & ${data}`)
//     return u64ToBytes(data);
// }

// export function testing3(): StaticArray<u8> {

//     const data = bytesToU256(testing5());

//     generateEvent(`Data ==> ${data}`);
//     return u256ToBytes(data);
// }

// export function testing4(): StaticArray<u8> {

//     const data = new Args(testing5()).nextU256().unwrap();

//     generateEvent(`Data ==> ${data}`);
//     return u256ToBytes(data);
// }

// export function testing5(): StaticArray<u8> {  // Worked

//     // const storageKey = `USER_INDEX_${user}`;
//     const _balance: u256 = new u256(1000000);
//     const normalizedIncome: u256 = new u256(1000000000);
//     const userIndex: u256 = new u256(1000000000);

//     const cumulatedBal = u256.fromU64(u64.parse(_balance.toString()) * (u64.parse(normalizedIncome.toString()) / u64.parse(userIndex.toString())));

//     generateEvent(`Data ==> ${cumulatedBal}`)
//     return u256ToBytes(cumulatedBal);
// }

// export function testing6(): StaticArray<u8> {

//     const data = u64.MAX_VALUE;
//     const data1 = u64.MIN_VALUE;

//     generateEvent(`data ${data} ${data1}`);

//     return u64ToBytes(data);
// }

// export function testing6(): StaticArray<u8> {

//     const ONE_UNIT = 1000000000;

//     const timeDifference = timestamp() - 1;
//     const ratePerSecond = 10000000 / 31536000;

//     const data = u256.fromU64((ratePerSecond + ONE_UNIT) ** (timeDifference));

//     generateEvent(`data ${ratePerSecond} ${data}`);
//     return u256ToBytes(data);
// }

/*  
OpId:  {
  instance: UserReserve {
    addr: 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8',
    principalBorrowBalance: 100000n,
    lastVariableBorrowCumulativeIndex: 0n,
    originationFee: 250n,
    stableBorrowRate: 0n,
    lastUpdateTimestamp: 1696515173182n,
    useAsCollateral: true
  },
  offset: 218
}
OpId:  {
  instance: Reserve {
    addr: 'AS12ZMZHtmmXPjyujRk9BAoigish2F5TuSSrupYanxjq55YaDDLva',
    name: 'usdc',
    symbol: 'USDC',
    decimals: 9,
    mTokenAddress: 'AS1yMt8sCJuXufhizfgpwZERfiAk56tHZXopgvPqy1BDxpukRRv9',
    interestCalcAddress: 'AS12bQKhddFFd8jPygBesVrjyddUyvVvp4sGwv9rsUy7eWkv737zi',
    baseLTV: 60n,
    LiquidationThreshold: 75n,
    LiquidationBonus: 125n,
    lastUpdateTimestamp: 1696515173182n,
    lastUpdateTimelastLiquidityCumulativeIndexstamp: 0n,
    lastLiquidityCumulativeIndex: 0n,
    currentLiquidityRate: 0n,
    totalBorrowsStable: 100000n,
    totalBorrowsVariable: 0n,
    currentVariableBorrowRate: 0n,
    currentStableBorrowRate: 13751n,
    currentAverageStableBorrowRate: 0n,
    lastVariableBorrowCumulativeIndex: 0n
  }, 

  OpId:  {
  instance: Reserve {
    addr: 'AS12ZMZHtmmXPjyujRk9BAoigish2F5TuSSrupYanxjq55YaDDLva',
    name: 'usdc',
    symbol: 'USDC',
    decimals: 9,
    mTokenAddress: 'AS12aSoy5PrWUkbPmTUwTPTgL7RCaoGatwnr7veM5SbuJQhAJoc7G',
    interestCalcAddress: 'AS17MpgjV2F2ZaY9KZQ2uCDXC8cmeZtD6nm4M3r76LSmXMDggjr7',
    baseLTV: 60n,
    LiquidationThreshold: 75n,
    LiquidationBonus: 125n,
    lastUpdateTimestamp: 1696923141182n,
    lastLiquidityCumulativeIndex: 1005398942n,
    currentLiquidityRate: 3333333n,
    totalBorrowsStable: 10000n,
    totalBorrowsVariable: 0n,
    currentVariableBorrowRate: 333333n,
    currentStableBorrowRate: 1000416666n,
    currentAverageStableBorrowRate: 1000000000n,
    lastVariableBorrowCumulativeIndex: 0n
  },
  
   instance: UserReserve {
    addr: 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8',
    principalBorrowBalance: 13236275030462989440n,
    lastVariableBorrowCumulativeIndex: 0n,
    originationFee: 4700n,
    stableBorrowRate: 1000000000n,
    lastUpdateTimestamp: 1696838725182n,
    useAsCollateral: true
  },
  
  OpId:  {
  instance: UserReserve {
    addr: 'AU12CB1BBEUkLQDZqKr1XdnxdtPECUJ6rTcCd17NGAM5qBvUmdun8',
    principalBorrowBalance: 10000n,
    lastVariableBorrowCumulativeIndex: 0n,
    originationFee: 25n,
    stableBorrowRate: 1000000000n,
    lastUpdateTimestamp: 1696889493182n,
    useAsCollateral: true
  },
  offset: 218
}

User data: [
  5046483899999n,
  5046483899999n,
  931552346630n,
  0n,
  60n,
  75n,
  4062963223n
]
User global data: [
  5096948738998n,
  5096948738998n,
  940867870096n,
  0n,
  60n,
  75n,
  4062963223n
]
User Borrow balances: [ 931400435837n, 931692418470n, 291982633n ]
Available borrows USD: 2112008119869n
User Basic Reserve Data:  [ 5050328630000n, 931692418470n, 0n ]
Available borrows: 2091097148386n*/