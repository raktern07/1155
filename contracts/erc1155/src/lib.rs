// SPDX-License-Identifier: MIT
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

pub mod erc1155;

use alloc::vec::Vec;
use erc1155::Erc1155;
use stylus_sdk::{alloy_primitives::{Address, U256}, prelude::*};

#[entrypoint]
#[storage]
pub struct My1155 {
    erc1155: Erc1155,
}

#[public]
impl My1155 {
    pub fn balance_of(&self, account: Address, id: U256) -> U256 {
        self.erc1155.balance_of(account, id)
    }

    pub fn balance_of_batch(&self, accounts: Vec<Address>, ids: Vec<U256>) -> Result<Vec<U256>, Vec<u8>> {
        self.erc1155.balance_of_batch(accounts, ids).map_err(|e| e.into())
    }

    pub fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Vec<u8>> {
        self.erc1155.set_approval_for_all(operator, approved).map_err(|e| e.into())
    }

    pub fn is_approved_for_all(&self, account: Address, operator: Address) -> bool {
        self.erc1155.is_approved_for_all(account, operator)
    }

    pub fn safe_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        id: U256,
        value: U256,
        data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        self.erc1155.safe_transfer_from(from, to, id, value, data).map_err(|e| e.into())
    }

    pub fn safe_batch_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        ids: Vec<U256>,
        values: Vec<U256>,
        data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        self.erc1155.safe_batch_transfer_from(from, to, ids, values, data).map_err(|e| e.into())
    }
}

