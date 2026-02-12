// SendGrid integration for transactional emails
import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email };
}

// WARNING: Never cache this client.
export async function getUncachableSendGridClient() {
  const { apiKey, email } = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

interface OrderItem {
  name: string;
  price: number | string;
  quantity: number;
}

interface OrderReceiptData {
  orderId: string;
  customerEmail: string;
  customerName: string;
  restaurantName: string;
  items: OrderItem[];
  subtotal: string;
  deliveryFee: string;
  tip: string;
  total: string;
  deliveryAddress: string;
  orderDate: Date;
}

export async function sendOrderReceiptEmail(data: OrderReceiptData): Promise<void> {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();

    const itemRows = data.items.map(item => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      const lineTotal = price * item.quantity;
      return `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.name}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">$${price.toFixed(2)}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">$${lineTotal.toFixed(2)}</td>
        </tr>`;
    }).join('');

    const tipRow = parseFloat(data.tip) > 0
      ? `<tr>
          <td colspan="3" style="padding: 6px 0; text-align: right; color: #6b7280;">Tip / Gorjeta:</td>
          <td style="padding: 6px 0; text-align: right; color: #374151;">$${parseFloat(data.tip).toFixed(2)}</td>
        </tr>`
      : '';

    const formattedDate = data.orderDate.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              
              <tr>
                <td style="background: linear-gradient(135deg, #009739 0%, #00662b 100%); padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">BrazaDash</h1>
                  <p style="color: #FEDD00; margin: 8px 0 0 0; font-size: 14px;">Your Brazilian Marketplace / Seu Mercado Brasileiro</p>
                </td>
              </tr>

              <tr>
                <td style="padding: 30px;">
                  <h2 style="color: #1f2937; margin: 0 0 5px 0; font-size: 22px;">Order Confirmation</h2>
                  <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 14px;">Confirmacao do Pedido</p>
                  
                  <p style="color: #374151; font-size: 15px; line-height: 1.6;">
                    Hi ${data.customerName},<br>
                    Thank you for your order! Here is your receipt.
                  </p>

                  <table width="100%" style="margin: 20px 0; background-color: #f9fafb; border-radius: 6px; padding: 16px;" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 8px 16px;">
                        <span style="color: #6b7280; font-size: 13px;">Order # / Pedido:</span><br>
                        <span style="color: #1f2937; font-size: 15px; font-weight: 600;">${data.orderId.slice(0, 8).toUpperCase()}</span>
                      </td>
                      <td style="padding: 8px 16px;">
                        <span style="color: #6b7280; font-size: 13px;">Date / Data:</span><br>
                        <span style="color: #1f2937; font-size: 15px;">${formattedDate}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding: 8px 16px;">
                        <span style="color: #6b7280; font-size: 13px;">Restaurant / Restaurante:</span><br>
                        <span style="color: #1f2937; font-size: 15px; font-weight: 600;">${data.restaurantName}</span>
                      </td>
                    </tr>
                  </table>

                  <h3 style="color: #1f2937; font-size: 16px; margin: 24px 0 12px 0; border-bottom: 2px solid #009739; padding-bottom: 8px;">Items Ordered / Itens do Pedido</h3>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <thead>
                      <tr>
                        <th style="padding: 8px 0; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Item</th>
                        <th style="padding: 8px 0; text-align: center; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Qty</th>
                        <th style="padding: 8px 0; text-align: right; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Price</th>
                        <th style="padding: 8px 0; text-align: right; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemRows}
                    </tbody>
                  </table>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                    <tr>
                      <td colspan="3" style="padding: 6px 0; text-align: right; color: #6b7280;">Subtotal:</td>
                      <td style="padding: 6px 0; text-align: right; color: #374151;">$${parseFloat(data.subtotal).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td colspan="3" style="padding: 6px 0; text-align: right; color: #6b7280;">Delivery Fee / Taxa de Entrega:</td>
                      <td style="padding: 6px 0; text-align: right; color: #374151;">$${parseFloat(data.deliveryFee).toFixed(2)}</td>
                    </tr>
                    ${tipRow}
                    <tr>
                      <td colspan="3" style="padding: 12px 0 6px 0; text-align: right; font-weight: 700; font-size: 17px; color: #009739; border-top: 2px solid #009739;">Total:</td>
                      <td style="padding: 12px 0 6px 0; text-align: right; font-weight: 700; font-size: 17px; color: #009739; border-top: 2px solid #009739;">$${parseFloat(data.total).toFixed(2)}</td>
                    </tr>
                  </table>

                  <table width="100%" style="margin: 24px 0; background-color: #f9fafb; border-radius: 6px;" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding: 16px;">
                        <span style="color: #6b7280; font-size: 13px;">Delivery Address / Endereco de Entrega:</span><br>
                        <span style="color: #1f2937; font-size: 15px;">${data.deliveryAddress}</span>
                      </td>
                    </tr>
                  </table>

                  <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin-top: 24px;">
                    You will receive updates as your order progresses.<br>
                    Voce recebera atualizacoes sobre o andamento do seu pedido.
                  </p>
                </td>
              </tr>

              <tr>
                <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                    BrazaDash - Connecting the Brazilian Community in California<br>
                    Conectando a Comunidade Brasileira na California
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`;

    const msg = {
      to: data.customerEmail,
      from: fromEmail,
      subject: `BrazaDash - Order Confirmation #${data.orderId.slice(0, 8).toUpperCase()}`,
      html,
      text: `BrazaDash Order Confirmation\n\nOrder #${data.orderId.slice(0, 8).toUpperCase()}\nRestaurant: ${data.restaurantName}\nDate: ${formattedDate}\n\nItems:\n${data.items.map(i => `- ${i.name} x${i.quantity} $${(typeof i.price === 'string' ? parseFloat(i.price) : i.price).toFixed(2)}`).join('\n')}\n\nSubtotal: $${parseFloat(data.subtotal).toFixed(2)}\nDelivery Fee: $${parseFloat(data.deliveryFee).toFixed(2)}${parseFloat(data.tip) > 0 ? `\nTip: $${parseFloat(data.tip).toFixed(2)}` : ''}\nTotal: $${parseFloat(data.total).toFixed(2)}\n\nDelivery Address: ${data.deliveryAddress}\n\nThank you for your order!`,
    };

    await client.send(msg);
    console.log(`Order receipt email sent to ${data.customerEmail} for order #${data.orderId.slice(0, 8)}`);
  } catch (error: any) {
    console.error("Failed to send order receipt email:", error?.message || error);
  }
}
