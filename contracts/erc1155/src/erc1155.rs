use alloc::vec::Vec;
use stylus_sdk::{
    alloy_primitives::{Address, U256},
    alloy_sol_types::{sol, SolError},
    evm, msg,
    prelude::*,
};

sol_storage! {
    pub struct Erc1155 {
        mapping(uint256 => mapping(address => uint256)) balances;
        mapping(address => mapping(address => bool)) operator_approvals;
    }
}

sol! {
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);

    error ERC1155InsufficientBalance(address sender, uint256 balance, uint256 needed, uint256 id);
    error ERC1155InvalidReceiver(address receiver);
    error ERC1155InvalidApprover(address approver);
    error ERC1155InvalidOperator(address operator);
    error ERC1155InvalidArrayLength(uint256 idsLength, uint256 valuesLength);
    error ERC1155MissingApprovalForAll(address operator, address owner);
}

pub enum Erc1155Error {
    InsufficientBalance(ERC1155InsufficientBalance),
    InvalidReceiver(ERC1155InvalidReceiver),
    InvalidApprover(ERC1155InvalidApprover),
    InvalidOperator(ERC1155InvalidOperator),
    InvalidArrayLength(ERC1155InvalidArrayLength),
    MissingApprovalForAll(ERC1155MissingApprovalForAll),
}

impl From<Erc1155Error> for Vec<u8> {
    fn from(error: Erc1155Error) -> Self {
        match error {
            Erc1155Error::InsufficientBalance(e) => e.abi_encode(),
            Erc1155Error::InvalidReceiver(e) => e.abi_encode(),
            Erc1155Error::InvalidApprover(e) => e.abi_encode(),
            Erc1155Error::InvalidOperator(e) => e.abi_encode(),
            Erc1155Error::InvalidArrayLength(e) => e.abi_encode(),
            Erc1155Error::MissingApprovalForAll(e) => e.abi_encode(),
        }
    }
}

impl Erc1155 {
    pub fn balance_of(&self, account: Address, id: U256) -> U256 {
        self.balances.get(id).get(account)
    }

    pub fn balance_of_batch(&self, accounts: Vec<Address>, ids: Vec<U256>) -> Result<Vec<U256>, Erc1155Error> {
        if accounts.len() != ids.len() {
            return Err(Erc1155Error::InvalidArrayLength(ERC1155InvalidArrayLength {
                idsLength: U256::from(ids.len()),
                valuesLength: U256::from(accounts.len()),
            }));
        }
        Ok(accounts.iter().zip(ids.iter()).map(|(acc, id)| self.balance_of(*acc, *id)).collect())
    }

    pub fn set_approval_for_all(&mut self, operator: Address, approved: bool) -> Result<(), Erc1155Error> {
        let owner = msg::sender();
        if owner == operator {
            return Err(Erc1155Error::InvalidOperator(ERC1155InvalidOperator { operator }));
        }

        let mut owner_approvals = self.operator_approvals.setter(owner);
        owner_approvals.insert(operator, approved);

        evm::log(ApprovalForAll {
            account: owner,
            operator,
            approved,
        });

        Ok(())
    }

    pub fn is_approved_for_all(&self, account: Address, operator: Address) -> bool {
        self.operator_approvals.get(account).get(operator)
    }

    pub fn safe_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        id: U256,
        value: U256,
        _data: Vec<u8>,
    ) -> Result<(), Erc1155Error> {
        let operator = msg::sender();
        if from != operator && !self.is_approved_for_all(from, operator) {
            return Err(Erc1155Error::MissingApprovalForAll(ERC1155MissingApprovalForAll {
                operator,
                owner: from,
            }));
        }

        if to.is_zero() {
            return Err(Erc1155Error::InvalidReceiver(ERC1155InvalidReceiver { receiver: Address::ZERO }));
        }

        self._update_single(from, to, id, value)?;

        Ok(())
    }

    pub fn safe_batch_transfer_from(
        &mut self,
        from: Address,
        to: Address,
        ids: Vec<U256>,
        values: Vec<U256>,
        _data: Vec<u8>,
    ) -> Result<(), Erc1155Error> {
        let operator = msg::sender();
        if from != operator && !self.is_approved_for_all(from, operator) {
            return Err(Erc1155Error::MissingApprovalForAll(ERC1155MissingApprovalForAll {
                operator,
                owner: from,
            }));
        }

        if to.is_zero() {
            return Err(Erc1155Error::InvalidReceiver(ERC1155InvalidReceiver { receiver: Address::ZERO }));
        }

        if ids.len() != values.len() {
            return Err(Erc1155Error::InvalidArrayLength(ERC1155InvalidArrayLength {
                idsLength: U256::from(ids.len()),
                valuesLength: U256::from(values.len()),
            }));
        }

        self._update_batch(from, to, ids, values)?;

        Ok(())
    }

    pub fn _update_single(
        &mut self,
        from: Address,
        to: Address,
        id: U256,
        value: U256,
    ) -> Result<(), Erc1155Error> {
        if !from.is_zero() {
            let mut balance_map = self.balances.setter(id);
            let mut from_balance_setter = balance_map.setter(from);
            let from_balance = from_balance_setter.get();
            if from_balance < value {
                return Err(Erc1155Error::InsufficientBalance(ERC1155InsufficientBalance {
                    sender: from,
                    balance: from_balance,
                    needed: value,
                    id,
                }));
            }
            from_balance_setter.set(from_balance - value);
        }

        if !to.is_zero() {
            let mut balance_map = self.balances.setter(id);
            let mut to_balance_setter = balance_map.setter(to);
            let to_balance = to_balance_setter.get();
            to_balance_setter.set(to_balance + value);
        }

        evm::log(TransferSingle {
            operator: msg::sender(),
            from,
            to,
            id,
            value,
        });

        Ok(())
    }

    pub fn _update_batch(
        &mut self,
        from: Address,
        to: Address,
        ids: Vec<U256>,
        values: Vec<U256>,
    ) -> Result<(), Erc1155Error> {
        let operator = msg::sender();
        for i in 0..ids.len() {
            let id = ids[i];
            let value = values[i];

            if !from.is_zero() {
                let mut balance_map = self.balances.setter(id);
                let mut from_balance_setter = balance_map.setter(from);
                let from_balance = from_balance_setter.get();
                if from_balance < value {
                    return Err(Erc1155Error::InsufficientBalance(ERC1155InsufficientBalance {
                        sender: from,
                        balance: from_balance,
                        needed: value,
                        id,
                    }));
                }
                from_balance_setter.set(from_balance - value);
            }

            if !to.is_zero() {
                let mut balance_map = self.balances.setter(id);
                let mut to_balance_setter = balance_map.setter(to);
                let to_balance = to_balance_setter.get();
                to_balance_setter.set(to_balance + value);
            }
        }

        evm::log(TransferBatch {
            operator,
            from,
            to,
            ids,
            values,
        });

        Ok(())
    }

}
