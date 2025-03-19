"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TransactionConfirmation = {
  ticker: string;
  companyName: string;
  quantity: number;
  maxPurchasePrice: number;
  onConfirm: () => void;
  onReject: () => void;
};

export function TransactionConfirmationPending(props: TransactionConfirmation) {
  const {
    ticker,
    companyName,
    quantity,
    maxPurchasePrice,
    onConfirm,
    onReject,
  } = props;

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          Confirm Stock Purchase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-1">
          <p className="text-sm font-medium">Company</p>
          <p className="text-sm">
            {companyName} ({ticker})
          </p>
        </div>
        <div className="grid gap-1">
          <p className="text-sm font-medium">Quantity</p>
          <p className="text-sm">{quantity} shares</p>
        </div>
        <div className="grid gap-1">
          <p className="text-sm font-medium">Maximum Price per Share</p>
          <p className="text-sm">${maxPurchasePrice?.toFixed(2)}</p>
        </div>
        <div className="bg-muted rounded-md p-3">
          <p className="text-sm font-medium">Total Maximum Cost:</p>
          <p className="text-lg font-bold">
            ${(quantity * maxPurchasePrice)?.toFixed(2)}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={onReject}>
          <span className="mr-2">✕</span>
          Reject
        </Button>
        <Button onClick={onConfirm}>
          <span className="mr-2">✓</span>
          Confirm
        </Button>
      </CardFooter>
    </Card>
  );
}
