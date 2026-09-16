import { NextRequest, NextResponse } from 'next/server';
import { addProduct, addProductCategory, addProductVendorPrice, getProductCategories, getProducts, getProductVendorPrices, readableError, updateProduct, updateProductVendorPrice } from '@/lib/data-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [categories, products, vendorPrices] = await Promise.all([getProductCategories(), getProducts(), getProductVendorPrices()]);
    return NextResponse.json({ success: true, data: { categories, products, vendorPrices } });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.kind === 'category') return NextResponse.json({ success: true, data: await addProductCategory(body.data) });
    if (body.kind === 'vendorPrice') return NextResponse.json({ success: true, data: await addProductVendorPrice(body.data) });
    if (!body.data?.sku || !body.data?.name || !body.data?.categoryId) return NextResponse.json({ success: false, error: 'SKU, nama produk, dan kategori wajib diisi.' }, { status: 400 });
    return NextResponse.json({ success: true, data: await addProduct(body.data) });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ success: false, error: 'ID wajib diisi.' }, { status: 400 });
    const data = body.kind === 'vendorPrice' ? await updateProductVendorPrice(body.id, body.data || {}) : await updateProduct(body.id, body.data || {});
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: readableError(error) }, { status: 500 });
  }
}
