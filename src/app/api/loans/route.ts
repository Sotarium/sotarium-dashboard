import { NextResponse } from 'next/server';
import { INITIAL_LOANS, Loan } from '@/lib/data';
import fs from 'fs';
import path from 'path';

const LOANS_FILE_PATH = path.join(process.cwd(), 'loans_data.json');

function readLoans(): Loan[] {
  try {
    if (fs.existsSync(LOANS_FILE_PATH)) {
      const data = fs.readFileSync(LOANS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading loans file:', e);
  }
  return INITIAL_LOANS;
}

function writeLoans(loans: Loan[]) {
  try {
    fs.writeFileSync(LOANS_FILE_PATH, JSON.stringify(loans, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing loans file:', e);
  }
}

export async function GET() {
  const loans = readLoans();
  return NextResponse.json(loans);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const loans = readLoans();
    const updated = [body, ...loans];
    writeLoans(updated);
    return NextResponse.json(body, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, updates } = body;
    let loans = readLoans();
    loans = loans.map((loan) => (loan.id === id ? { ...loan, ...updates } : loan));
    writeLoans(loans);
    return NextResponse.json({ success: true, loans });
  } catch {
    return NextResponse.json({ error: 'Failed to update loan' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    let loans = readLoans();
    loans = loans.filter((l) => l.id !== id);
    writeLoans(loans);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete loan' }, { status: 500 });
  }
}
