import api, { getOnce } from "./api";

export async function listProductCategories(params = {}) {
  const { data } = await getOnce("/sales/categories", { params });
  return data;
}

export async function createProductCategory(payload) {
  const { data } = await api.post("/sales/categories", payload);
  return data;
}

export async function updateProductCategory(categoryId, payload) {
  const { data } = await api.patch(`/sales/categories/${categoryId}`, payload);
  return data;
}

export async function updateProductCategoryStatus(categoryId, isActive) {
  const { data } = await api.patch(`/sales/categories/${categoryId}/status`, { isActive });
  return data;
}

export async function listProducts(params = {}) {
  const { data } = await getOnce("/sales/products", { params });
  return data;
}

export async function createProduct(payload) {
  const { data } = await api.post("/sales/products", payload);
  return data;
}

export async function updateProduct(productId, payload) {
  const { data } = await api.patch(`/sales/products/${productId}`, payload);
  return data;
}

export async function updateProductStatus(productId, isActive) {
  const { data } = await api.patch(`/sales/products/${productId}/status`, { isActive });
  return data;
}

export async function listSales(params = {}) {
  const { data } = await getOnce("/sales", { params });
  return data;
}

export async function getSale(saleId) {
  const { data } = await getOnce(`/sales/${saleId}`);
  return data;
}

export async function createSale(payload) {
  const { data } = await api.post("/sales", payload);
  return data;
}

export async function cancelSale(saleId, cancelReason) {
  const { data } = await api.patch(`/sales/${saleId}/cancel`, { cancelReason });
  return data;
}

export async function listFiados() {
  const { data } = await getOnce("/sales/fiados");
  return data;
}

export async function receiveSalePayment(saleId, amountCents) {
  const { data } = await api.post(`/sales/${saleId}/payments`, { amountCents });
  return data;
}
