import slug from "slug";

function generateSKU(
  productSlug: string,
  attributes?: Record<string, string | number>
) {
  const attrPart = attributes
    ? Object.values(attributes)
        .map(v => slug(String(v), { lower: true }))
        .join("-")
    : "default";

  const unique = Math.random().toString(36).substring(2, 7);

  return `${productSlug}-${attrPart}-${unique}`;
}

export default generateSKU;