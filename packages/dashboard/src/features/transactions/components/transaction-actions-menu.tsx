import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/dropdown-menu";
import type { Transaction } from "@features/transactions/types";
import { DeleteTransactionAlert } from "@features/transactions/components/delete-transaction-alert";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

interface TransactionActionsMenuProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionActionsMenu({
  transaction,
  onEdit,
}: TransactionActionsMenuProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(transaction)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowDeleteAlert(true)}
          >
            <Trash2 className="size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteTransactionAlert
        transaction={transaction}
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
      />
    </>
  );
}
