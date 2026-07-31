import { getProductById } from '../services/product.service';

async function main() {
  try {
    const product = await getProductById('test-produit');
    console.log("=== GET PRODUCT BY ID RESULT ===");
    console.log(JSON.stringify(product, null, 2));
  } catch (error: any) {
    console.error("Error fetching product:", error.message);
  }
}

main();

