import { useCallback, useEffect, useMemo, useState } from "react"
import { useCustomFetch } from "src/hooks/useCustomFetch"
import { SetTransactionApprovalParams } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

type OverrideMap = Record<string, boolean>;

export const Transactions: TransactionsComponent = ({ transactions }) => {
  const { fetchWithCache, loading } = useCustomFetch()

  const [overrides, setOverrides] = useState<OverrideMap>(() => {
      try {
        return JSON.parse(localStorage.getItem('txApprovals')!) || {};
      } catch {
        return {};
      }
    });

  const finTransactions = useMemo(
    () => 
      transactions 
      ? transactions.map((tx) => ({
        ...tx,
        approved: overrides[tx.id] ?? tx.approved,
      }))
      : null,
      [transactions, overrides]
  )

  const setOverride = useCallback((id: string, approved: boolean) => {
    setOverrides((o) => ({ ...o, [id]: approved }));
  }, []);

  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      setOverride(transactionId, newValue)
      await fetchWithCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
        transactionId,
        value: newValue,
      })
    },
    [fetchWithCache, setOverride]
  )

  useEffect(() => {
    localStorage.setItem('txApprovals', JSON.stringify(overrides));
  }, [overrides])

  if (transactions === null) {
    return <div className="RampLoading--container">Loading...</div>
  }

  return (
    <div data-testid="transaction-container">
      {finTransactions?.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          setTransactionApproval={setTransactionApproval}
        />
      ))}
    </div>
  )
}
