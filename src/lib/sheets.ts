import { google, sheets_v4 } from "googleapis";
import { prisma } from "./db";

export const TAB_NAMES = {
  inventory: "Inventory",
  clients: "Clients",
  transactions: "Transactions",
} as const;

export const EXPECTED_HEADERS = {
  [TAB_NAMES.inventory]: ["Item Name", "Quantity", "Price"],
  [TAB_NAMES.clients]: ["Client Name", "Phone Number", "Email"],
  [TAB_NAMES.transactions]: [
    "Transaction Date",
    "Client Name",
    "Item Name",
    "Quantity",
    "Price",
    "Total Cost",
  ],
} as const;

export type InventoryItem = {
  rowIndex: number;
  itemName: string;
  quantity: number;
  price: number;
};

export type Client = {
  rowIndex: number;
  clientName: string;
  phoneNumber: string;
  email: string;
};

export type Transaction = {
  rowIndex: number;
  transactionDate: string;
  clientName: string;
  itemName: string;
  quantity: number;
  price: number;
  totalCost: number;
};

function friendlyGoogleError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("sheets.googleapis.com") && message.includes("disabled")) {
    return "Google Sheets API is not enabled. In Google Cloud Console go to APIs & Services → Library, search for “Google Sheets API”, and enable it for your project.";
  }
  if (message.includes("404")) {
    return "Spreadsheet not found. Check the URL and make sure the sheet is in the same Google account you signed in with.";
  }
  if (message.includes("403") || message.includes("permission")) {
    return "No access to this spreadsheet. Make sure you own it or it is shared with the Google account you signed in with.";
  }
  return message;
}

function parseSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[a-zA-Z0-9-_]+$/.test(trimmed)) return trimmed;
  return null;
}

export function extractSpreadsheetId(input: string): string {
  const id = parseSpreadsheetId(input);
  if (!id) throw new Error("Invalid spreadsheet URL or ID");
  return id;
}

async function getSheetsClient(userId: string): Promise<{
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { accounts: { where: { provider: "google" } } },
  });

  if (!user?.spreadsheetId) {
    throw new Error("Spreadsheet not configured");
  }

  const account = user.accounts[0];
  if (!account?.refresh_token) {
    throw new Error("Google account not connected");
  }

  const auth = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );
  auth.setCredentials({ refresh_token: account.refresh_token });

  return {
    sheets: google.sheets({ version: "v4", auth }),
    spreadsheetId: user.spreadsheetId,
  };
}

export async function validateSpreadsheet(
  userId: string,
  spreadsheetInput: string
): Promise<{ spreadsheetId: string; valid: boolean; errors: string[] }> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  const { sheets } = await getSheetsClientForValidation(userId, spreadsheetId);

  let meta;
  try {
    meta = await sheets.spreadsheets.get({ spreadsheetId });
  } catch (error) {
    throw new Error(friendlyGoogleError(error));
  }
  const sheetTitles = meta.data.sheets?.map((s) => s.properties?.title) ?? [];
  const errors: string[] = [];

  for (const tabName of Object.values(TAB_NAMES)) {
    if (!sheetTitles.includes(tabName)) {
      errors.push(`Missing tab: "${tabName}"`);
    }
  }

  for (const [tabName, expected] of Object.entries(EXPECTED_HEADERS)) {
    if (!sheetTitles.includes(tabName)) continue;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tabName}'!1:1`,
    });
    const headers = res.data.values?.[0] ?? [];
    for (const header of expected) {
      if (!headers.includes(header)) {
        errors.push(`Tab "${tabName}" missing header: "${header}"`);
      }
    }
  }

  return { spreadsheetId, valid: errors.length === 0, errors };
}

async function getSheetsClientForValidation(
  userId: string,
  spreadsheetId: string
) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.refresh_token) {
    throw new Error("Google account not connected");
  }

  const auth = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET
  );
  auth.setCredentials({ refresh_token: account.refresh_token });

  return {
    sheets: google.sheets({ version: "v4", auth }),
    spreadsheetId,
  };
}

export async function linkSpreadsheet(
  userId: string,
  spreadsheetInput: string
): Promise<void> {
  const { spreadsheetId, valid, errors } = await validateSpreadsheet(
    userId,
    spreadsheetInput
  );
  if (!valid) {
    throw new Error(errors.join("; "));
  }

  await prisma.user.update({
    where: { id: userId },
    data: { spreadsheetId, setupComplete: true },
  });
}

function rowToInventory(row: string[], rowIndex: number): InventoryItem | null {
  if (!row[0]?.trim()) return null;
  return {
    rowIndex,
    itemName: row[0],
    quantity: Number(row[1]) || 0,
    price: Number(row[2]) || 0,
  };
}

function rowToClient(row: string[], rowIndex: number): Client | null {
  if (!row[0]?.trim()) return null;
  return {
    rowIndex,
    clientName: row[0],
    phoneNumber: row[1] ?? "",
    email: row[2] ?? "",
  };
}

function rowToTransaction(row: string[], rowIndex: number): Transaction | null {
  if (!row[0]?.trim() && !row[1]?.trim()) return null;
  return {
    rowIndex,
    transactionDate: row[0] ?? "",
    clientName: row[1] ?? "",
    itemName: row[2] ?? "",
    quantity: Number(row[3]) || 0,
    price: Number(row[4]) || 0,
    totalCost: Number(row[5]) || 0,
  };
}

export async function getInventory(userId: string): Promise<InventoryItem[]> {
  const { sheets, spreadsheetId } = await getSheetsClient(userId);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${TAB_NAMES.inventory}'!A2:C`,
  });
  return (res.data.values ?? [])
    .map((row, i) => rowToInventory(row, i + 2))
    .filter((item): item is InventoryItem => item !== null);
}

export async function getClients(userId: string): Promise<Client[]> {
  const { sheets, spreadsheetId } = await getSheetsClient(userId);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${TAB_NAMES.clients}'!A2:C`,
  });
  return (res.data.values ?? [])
    .map((row, i) => rowToClient(row, i + 2))
    .filter((client): client is Client => client !== null);
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const { sheets, spreadsheetId } = await getSheetsClient(userId);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${TAB_NAMES.transactions}'!A2:F`,
  });
  return (res.data.values ?? [])
    .map((row, i) => rowToTransaction(row, i + 2))
    .filter((tx): tx is Transaction => tx !== null);
}

export async function addInventoryItem(
  userId: string,
  data: { itemName: string; quantity: number; price: number }
): Promise<void> {
  const { sheets, spreadsheetId } = await getSheetsClient(userId);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${TAB_NAMES.inventory}'!A:C`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[data.itemName, data.quantity, data.price]],
    },
  });
}

export async function updateInventoryItem(
  userId: string,
  rowIndex: number,
  data: { itemName: string; quantity: number; price: number }
): Promise<void> {
  const { sheets, spreadsheetId } = await getSheetsClient(userId);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${TAB_NAMES.inventory}'!A${rowIndex}:C${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[data.itemName, data.quantity, data.price]],
    },
  });
}

export async function addClient(
  userId: string,
  data: { clientName: string; phoneNumber: string; email: string }
): Promise<void> {
  const { sheets, spreadsheetId } = await getSheetsClient(userId);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${TAB_NAMES.clients}'!A:C`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[data.clientName, data.phoneNumber, data.email]],
    },
  });
}

export async function updateClient(
  userId: string,
  rowIndex: number,
  data: { clientName: string; phoneNumber: string; email: string }
): Promise<void> {
  const { sheets, spreadsheetId } = await getSheetsClient(userId);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${TAB_NAMES.clients}'!A${rowIndex}:C${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[data.clientName, data.phoneNumber, data.email]],
    },
  });
}

export async function addTransaction(
  userId: string,
  data: {
    clientName: string;
    itemName: string;
    quantity: number;
    price: number;
  }
): Promise<void> {
  const inventory = await getInventory(userId);
  const item = inventory.find((i) => i.itemName === data.itemName);
  if (!item) throw new Error("Item not found in inventory");
  if (item.quantity < data.quantity) {
    throw new Error(`Insufficient stock. Available: ${item.quantity}`);
  }

  const totalCost = data.quantity * data.price;
  const today = new Date().toISOString().split("T")[0];

  const { sheets, spreadsheetId } = await getSheetsClient(userId);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${TAB_NAMES.transactions}'!A:F`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          today,
          data.clientName,
          data.itemName,
          data.quantity,
          data.price,
          totalCost,
        ],
      ],
    },
  });

  const newQuantity = item.quantity - data.quantity;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${TAB_NAMES.inventory}'!A${item.rowIndex}:C${item.rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[item.itemName, newQuantity, item.price]],
    },
  });
}

export async function getMonthlySales(userId: string): Promise<number> {
  const transactions = await getTransactions(userId);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return transactions
    .filter((tx) => {
      const date = new Date(tx.transactionDate);
      return (
        !isNaN(date.getTime()) &&
        date.getFullYear() === year &&
        date.getMonth() === month
      );
    })
    .reduce((sum, tx) => sum + tx.totalCost, 0);
}

export async function getLowStockItems(
  userId: string,
  threshold = 10
): Promise<InventoryItem[]> {
  const inventory = await getInventory(userId);
  return inventory.filter((item) => item.quantity < threshold);
}
