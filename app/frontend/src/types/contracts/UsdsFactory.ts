/* Autogenerated file. Do not edit manually. */

/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-imports */

/*
  Fuels version: 0.97.2
  Forc version: 0.66.5
  Fuel-Core version: 0.40.0
*/

import { ContractFactory, decompressBytecode } from "fuels";
import type { Provider, Account, DeployContractOptions } from "fuels";

import { Usds } from "./Usds";

const bytecode = decompressBytecode("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");

export class UsdsFactory extends ContractFactory<Usds> {

  static readonly bytecode = bytecode;

  constructor(accountOrProvider: Account | Provider) {
    super(
      bytecode,
      Usds.abi,
      accountOrProvider,
      Usds.storageSlots
    );
  }

  static deploy (
    wallet: Account,
    options: DeployContractOptions = {}
  ) {
    const factory = new UsdsFactory(wallet);
    return factory.deploy(options);
  }
}
