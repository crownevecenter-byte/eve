/** Strip internal/cost fields from products for public or customer-facing responses. */
const sanitizeProduct = (product) => {
  if (!product) return product;

  const copy = Array.isArray(product) ? product.map(sanitizeProduct) : { ...product };

  if (Array.isArray(product)) return copy;

  if (copy.partDetail) {
    const { cp_price, serial_no, ...safePartDetail } = copy.partDetail;
    copy.partDetail = safePartDetail;
  }

  delete copy.productParts;

  return copy;
};

const sanitizeProductList = (result) => {
  if (!result) return result;
  if (Array.isArray(result)) return result.map(sanitizeProduct);
  if (result.data) {
    return { ...result, data: result.data.map(sanitizeProduct) };
  }
  return sanitizeProduct(result);
};

module.exports = { sanitizeProduct, sanitizeProductList };
