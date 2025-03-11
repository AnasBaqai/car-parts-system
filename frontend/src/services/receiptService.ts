import api from "./api";

interface ReceiptResponse {
  status: string;
  data: {
    receipt: string;
  };
}

/**
 * Service for handling receipt-related operations
 */
class ReceiptService {
  /**
   * Get and print a receipt for an order
   * @param orderId - The ID of the order
   * @returns The receipt content as a string
   */
  async printReceipt(orderId: string): Promise<string> {
    try {
      console.log(`Fetching receipt for order: ${orderId}`);
      const response = await api.get<ReceiptResponse>(
        `/orders/${orderId}/receipt`
      );
      const receipt = response.data.data.receipt;

      // Create a hidden iframe to handle the print
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      // Write the receipt content to the iframe
      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head>
              <style>
                @page {
                  margin: 0;
                  size: 80mm 297mm;  /* Standard thermal paper width */
                }
                body {
                  font-family: monospace;
                  font-size: 12px;
                  white-space: pre;
                  margin: 0;
                  padding: 0;
                }
              </style>
            </head>
            <body>${receipt}</body>
          </html>
        `);
        doc.close();

        // Print and remove the iframe
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }

      return receipt;
    } catch (error) {
      console.error("Error printing receipt:", error);
      throw new Error("Failed to print receipt");
    }
  }
}

export default new ReceiptService();
