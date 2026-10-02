import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import authController from '../../../src/server/controllers/authController.cjs';
import productController from '../../../src/server/controllers/productController.cjs';
import memberController from '../../../src/server/controllers/memberController.cjs';
import transactionController from '../../../src/server/controllers/transactionController.cjs';
import reportController from '../../../src/server/controllers/reportController.cjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


const JWT_SECRET = process.env.JWT_SECRET || 'kasir_dito_smk_pos_secret_token_2026_xyz';

function jsonResponse(statusCode, body) {
  return NextResponse.json(body, { status: statusCode });
}

function parseBody(request) {
  return request.json().catch(() => ({}));
}

async function invoke(controller, request, { params = {}, user = null, body = {}, query = {} } = {}) {
  let statusCode = 200;
  let responseBody;
  let ended = false;

  const req = {
    body,
    params,
    query,
    user,
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(bodyValue) {
      responseBody = bodyValue;
      ended = true;
      return this;
    },
    send(bodyValue) {
      responseBody = bodyValue;
      ended = true;
      return this;
    },
  };

  await controller(req, res);

  if (!ended) {
    return jsonResponse(statusCode, responseBody ?? { success: true });
  }

  return jsonResponse(statusCode, responseBody);
}

function getUser(request) {
  const header = request.headers.get('authorization') || '';
  if (!header.startsWith('Bearer ')) {
    return { error: jsonResponse(401, { success: false, message: 'Akses ditolak. Token autentikasi tidak ditemukan.' }) };
  }

  try {
    return { user: jwt.verify(header.slice(7), JWT_SECRET) };
  } catch {
    return { error: jsonResponse(403, { success: false, message: 'Token tidak valid atau sudah kedaluwarsa. Silakan login kembali.' }) };
  }
}

function requireRole(user, role) {
  if (!user || user.role !== role) {
    return jsonResponse(403, {
      success: false,
      message: `Akses ditolak. Fitur ini hanya dapat diakses oleh role: ${role}.`,
    });
  }
  return null;
}

export async function GET(request, context) {
  return handle(request, context);
}

export async function POST(request, context) {
  return handle(request, context);
}

export async function PUT(request, context) {
  return handle(request, context);
}

export async function PATCH(request, context) {
  return handle(request, context);
}

export async function DELETE(request, context) {
  return handle(request, context);
}

async function handle(request, context) {
  const { path = [] } = await context.params;
  const method = request.method;
  const [resource, first, second] = path;
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await parseBody(request) : {};

  // Public login
  if (resource === 'auth' && first === 'login' && method === 'POST') {
    return invoke(authController.login, request, { body, query });
  }

  const auth = getUser(request);
  if (auth.error) return auth.error;
  const user = auth.user;

  // Authenticated auth routes
  if (resource === 'auth' && first === 'me' && method === 'GET') {
    return invoke(authController.getProfile, request, { user, query });
  }

  if (resource === 'auth' && first === 'register' && method === 'POST') {
    const roleError = requireRole(user, 'admin');
    if (roleError) return roleError;
    return invoke(authController.registerPetugas, request, { user, body, query });
  }

  // Products
  if (resource === 'products') {
    if (first === 'barcode' && second && method === 'GET') {
      return invoke(productController.getProductByBarcode, request, { user, params: { barcode: second }, query });
    }
    if (first && !second && method === 'GET' && /^\d+$/.test(first)) {
      return invoke(productController.getProductById, request, { user, params: { id: first }, query });
    }
    if (!first && method === 'GET') {
      return invoke(productController.getAllProducts, request, { user, query });
    }
    if (!first && method === 'POST') {
      const roleError = requireRole(user, 'admin');
      if (roleError) return roleError;
      return invoke(productController.createProduct, request, { user, body, query });
    }
    if (first && !second && method === 'PUT') {
      const roleError = requireRole(user, 'admin');
      if (roleError) return roleError;
      return invoke(productController.updateProduct, request, { user, params: { id: first }, body, query });
    }
    if (first && !second && method === 'DELETE') {
      const roleError = requireRole(user, 'admin');
      if (roleError) return roleError;
      return invoke(productController.deleteProduct, request, { user, params: { id: first }, query });
    }
    if (first && second === 'stock' && method === 'PATCH') {
      const roleError = requireRole(user, 'admin');
      if (roleError) return roleError;
      return invoke(productController.updateStock, request, { user, params: { id: first }, body, query });
    }
  }

  // Members
  if (resource === 'members') {
    if (!first && method === 'GET') return invoke(memberController.getAllMembers, request, { user, query });
    if (first && method === 'GET') return invoke(memberController.getMemberById, request, { user, params: { id: first }, query });
    if (!first && method === 'POST') return invoke(memberController.createMember, request, { user, body, query });
  }

  // Transactions
  if (resource === 'transactions') {
    if (!first && method === 'POST') {
      const roleError = requireRole(user, 'petugas');
      if (roleError) return roleError;
      return invoke(transactionController.createTransaction, request, { user, body, query });
    }
    if (!first && method === 'GET') return invoke(transactionController.getAllTransactions, request, { user, query });
    if (first && method === 'GET') return invoke(transactionController.getTransactionById, request, { user, params: { id: first }, query });
  }

  // Reports
  if (resource === 'reports' && !first && method === 'GET') {
    return invoke(reportController.getReport, request, { user, query });
  }

  return jsonResponse(404, { success: false, message: 'Endpoint API tidak ditemukan.' });
}