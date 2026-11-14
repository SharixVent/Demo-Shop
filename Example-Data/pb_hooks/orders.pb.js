/// <reference path="../types.d.ts" />

console.log("[orders.pb.js] HOOK MODULE LOADED (Scoped Variables | PB v0.23+ | DemoShop EN)");

// =====================================================================
// 1. ORDER CREATION (Awaiting Payment)
// =====================================================================
onRecordCreateRequest((e) => {
    console.log("[CREATE] New order entering the system...");

    const STORE_URL = $os.getenv("STORE_URL") || "https://example.com";
    const PRODUCT_PATH = "/item/";
    const SENDER_EMAIL = $os.getenv("SENDER_EMAIL") || $app.settings().meta.senderAddress || "no-reply@example.com";
    const SENDER_NAME = $os.getenv("SENDER_NAME") || $app.settings().meta.senderName || "DemoShop Store";

    function escapeHtml(unsafe) {
        if (!unsafe) return "";
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    const record = e.record;
    record.set("status", "unpaid");

    const rawItems = record.get("items") ?? [];
    let items = [];

    if (Array.isArray(rawItems)) {
        const isByteArray =
            rawItems.length > 0 &&
            rawItems.every((v) => typeof v === "number" && v >= 0 && v <= 255);
        if (isByteArray) {
            const jsonStr = String.fromCharCode.apply(null, rawItems);
            try {
                items = JSON.parse(jsonStr);
            } catch (err) {
                items = [];
            }
        } else {
            items = rawItems;
        }
    } else if (typeof rawItems === "string") {
        try {
            items = JSON.parse(rawItems);
        } catch (err) {
            items = [];
        }
    } else if (rawItems && typeof rawItems === "object") {
        items = [rawItems];
    }

    const validItems = items.filter((it) => it && typeof it === "object");
    let calculatedTotal = 0;

    // Server-side price and promotion verification
    const verifiedItems = validItems.map((item) => {
        let originalPrice = Number(item.price) || 0;
        let realPrice = originalPrice;
        let realName = item.name;
        let hasActivePromo = false;

        try {
            let productRecord = null;
            if (e.app && e.app.findRecordById) {
                try {
                    productRecord = e.app.findRecordById("products", item.id);
                } catch (err1) {
                    try {
                        productRecord = e.app.findRecordById("items", item.id);
                    } catch (err2) {}
                }
            }

            if (productRecord) {
                originalPrice = Number(productRecord.get("price")) || originalPrice;
                let salePrice = Number(productRecord.get("sale_price")) || 0;
                let saleEndDateStr = productRecord.get("sale_end_date") || "";

                realPrice = originalPrice;

                if (salePrice > 0) {
                    if (!saleEndDateStr) {
                        hasActivePromo = true;
                        realPrice = salePrice;
                    } else {
                        let endDate = new Date(saleEndDateStr);
                        endDate.setHours(23, 59, 59, 999);
                        if (endDate.getTime() >= new Date().getTime()) {
                            hasActivePromo = true;
                            realPrice = salePrice;
                        }
                    }
                }
                realName = productRecord.get("name") || realName;
            }
        } catch (err) {}

        item.price = realPrice;
        item.originalPrice = originalPrice;
        item.hasPromo = hasActivePromo;
        item.name = realName;

        calculatedTotal += realPrice * (item.quantity || 1);
        return item;
    });

    const deliveryCost = Number(record.get("delivery_cost")) || 0;

    if (verifiedItems.length > 0) {
        record.set("items", verifiedItems);
        record.set("total", calculatedTotal + deliveryCost);
    }

    // Save record in PocketBase
    e.next();

    // Send confirmation email
    try {
        const orderId = record.id;
        const email = record.get("email");
        const status = record.get("status");
        const total = record.get("total");

        console.log(`[CREATE] Order ${orderId} saved. Preparing confirmation email...`);

        if (!email || verifiedItems.length === 0) {
            console.log("[CREATE] Email skipped: Missing customer email address.");
            return;
        }

        const firstName = escapeHtml(record.get("first_name"));
        const lastName = escapeHtml(record.get("last_name"));
        const street = escapeHtml(record.get("street"));
        const houseNumber = escapeHtml(record.get("house_number"));
        const postalCode = escapeHtml(record.get("postal_code"));
        const city = escapeHtml(record.get("city"));

        const rawClientType = String(record.get("clientType") || "");
        const isCompany =
            rawClientType.toLowerCase().includes("company") ||
            rawClientType.toLowerCase().includes("firma");
        const companyName = escapeHtml(record.get("companyName") || record.get("company_name"));
        const nip = escapeHtml(record.get("nip"));

        const deliveryMethod = escapeHtml(record.get("delivery_method") || "Standard Courier");
        const paczkomatId = escapeHtml(record.get("paczkomat_id") || "");

        const rowsHtml = verifiedItems
            .map((it, idx) => {
                const name = escapeHtml(it.name || it.id || `Product #${idx + 1}`);
                const size = escapeHtml(it.size || "-");
                const qty = typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1;
                const price = typeof it.price === "number" && it.price >= 0 ? it.price : 0;
                const originalPrice = typeof it.originalPrice === "number" ? it.originalPrice : price;
                const hasPromo = it.hasPromo === true;
                const imgUrl = escapeHtml(it.imagePath || it.image_url || "");
                const itemLink = it.id ? `${STORE_URL}${PRODUCT_PATH}${it.id}` : STORE_URL;

                const priceDisplay = hasPromo
                    ? `<div style="text-decoration: line-through; color: #94a3b8; font-size: 12px; margin-bottom: 2px;">$${(originalPrice * qty).toFixed(2)}</div>
                       <div style="color: #dc2626; font-weight: bold; font-size: 15px;">$${(price * qty).toFixed(2)}</div>`
                    : `<div style="color: #0f172a; font-weight: bold; font-size: 15px;">$${(price * qty).toFixed(2)}</div>`;

                return `
<tr>
  <td style="border-bottom: 1px solid #e2e8f0; text-align: center; padding: 10px; width: 70px;">
    ${imgUrl ? `<a href="${itemLink}" target="_blank"><img src="${imgUrl}" alt="${name}" style="width:100%; max-width:65px; height:auto; object-fit:cover; border-radius:6px;" /></a>` : ""}
  </td>
  <td style="border-bottom: 1px solid #e2e8f0; padding: 10px;">
    <a href="${itemLink}" target="_blank" style="color: #0f172a; text-decoration: none; font-weight: bold; font-size: 14px; display: block;">${name}</a>
    <div style="font-size: 12px; color: #64748b; margin-top: 4px;" class="mobile-show">Size: ${size} | Qty: ${qty}</div>
    ${hasPromo ? `<div style="display: inline-block; background-color: #fef2f2; color: #dc2626; font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid #fecaca; margin-top: 6px; font-weight: bold;">SALE</div>` : ""}
  </td>
  <td class="mobile-hide" style="border-bottom: 1px solid #e2e8f0; text-align: center; padding: 10px; color: #475569;">${size}</td>
  <td class="mobile-hide" style="border-bottom: 1px solid #e2e8f0; text-align: center; padding: 10px; color: #475569;">${qty}</td>
  <td style="border-bottom: 1px solid #e2e8f0; text-align: right; padding: 12px 10px; white-space: nowrap;">${priceDisplay}</td>
</tr>`;
            })
            .join("");

        const totalStr = "$" + Number(total || 0).toFixed(2);
        const subject = `Awaiting Payment — Order #${orderId} | DemoShop`;
        const headerTitle = `We Have Received Your Order`;
        const headerText = `Thank you for placing order <b>#${orderId}</b> at DemoShop.<br><br>Current status: <b style="color: #2563eb; text-transform: uppercase;">${escapeHtml(status)}</b>. Once your payment is confirmed, we will immediately begin preparing your package and send you a confirmation email.`;

        let deliveryHtml =
            deliveryMethod.toLowerCase().includes("paczkomat") ||
            deliveryMethod.toLowerCase().includes("locker")
                ? `${deliveryMethod} ${paczkomatId ? `(${paczkomatId})` : ""}`
                : deliveryMethod;

        let customerDetailsHtml =
            isCompany && companyName
                ? `<b>${companyName}</b><br>Tax ID: ${nip}<br>${street} ${houseNumber}<br>${postalCode} ${city}<br>Email: ${escapeHtml(email)}`
                : `<b>${firstName} ${lastName}</b><br>${street} ${houseNumber}<br>${postalCode} ${city}<br>Email: ${escapeHtml(email)}`;

        const addressHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 20px; font-family: 'Inter', Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="50%" valign="top">
                        <h4 style="margin-top: 0; margin-bottom: 10px; color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Customer Details:</h4>
                        ${customerDetailsHtml}
                    </td>
                    <td width="50%" valign="top" style="padding-left: 15px; border-left: 1px solid #e2e8f0;">
                        <h4 style="margin-top: 0; margin-bottom: 10px; color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Shipping Method:</h4>
                        <b>Delivery:</b> ${deliveryHtml}
                    </td>
                </tr>
            </table>
        </div>`;

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @media screen and (max-width: 480px) {
      .mobile-hide { display: none !important; }
      .mobile-show { display: block !important; }
      .email-container { width: 100% !important; padding: 10px !important; }
      .content-padding { padding: 20px 15px !important; }
      td[width="50%"] { width: 100% !important; display: block; border-left: none !important; padding-left: 0 !important; margin-top: 15px; }
    }
    .mobile-show { display: none; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 24px 0;">
    <tr>
      <td align="center">
        <table class="email-container" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(90deg, #0f172a, #2563eb); padding: 24px; text-align: center;">
              <a href="${STORE_URL}" style="color: #ffffff; text-decoration: none; font-family: 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                Demo<span style="color: #93c5fd;">Shop</span>
              </a>
            </td>
          </tr>
          <tr>
            <td class="content-padding" style="padding: 30px;">
              <h2 style="margin-top: 0; color: #0f172a; font-family: 'Inter', Arial, sans-serif;">${headerTitle}</h2>
              <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
                ${headerText}
              </p>
              ${addressHtml}
              <h3 style="margin-top: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #0f172a;">Ordered Items:</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-family: 'Inter', Arial, sans-serif;">
                <thead>
                  <tr style="font-size: 12px; color: #64748b; text-transform: uppercase;">
                    <th style="padding: 10px 5px; border-bottom: 2px solid #e2e8f0; text-align: center;">Photo</th>
                    <th style="padding: 10px 5px; border-bottom: 2px solid #e2e8f0; text-align: left;">Product</th>
                    <th class="mobile-hide" style="padding: 10px 5px; border-bottom: 2px solid #e2e8f0; text-align: center;">Size</th>
                    <th class="mobile-hide" style="padding: 10px 5px; border-bottom: 2px solid #e2e8f0; text-align: center;">Qty</th>
                    <th style="padding: 10px 5px; border-bottom: 2px solid #e2e8f0; text-align: right;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                  <tr>
                    <td colspan="2" class="mobile-hide" style="padding: 20px 10px 10px 10px; text-align: right; font-size: 15px;"><b>Total:</b></td>
                    <td colspan="3" class="mobile-show" style="padding: 20px 10px 10px 10px; text-align: left; font-size: 15px;"><b>Total:</b></td>
                    <td class="mobile-hide" colspan="2" style="padding: 20px 10px 10px 10px; text-align: right; font-size: 18px; color: #2563eb; font-weight: bold;">${totalStr}</td>
                    <td class="mobile-show" style="padding: 20px 10px 10px 10px; text-align: right; font-size: 18px; color: #2563eb; font-weight: bold;">${totalStr}</td>
                  </tr>
                </tbody>
              </table>
              <div style="text-align: center; margin-top: 35px;">
                <a href="${STORE_URL}" style="font-size: 15px; font-family: 'Inter', Arial, sans-serif; color: #ffffff; background-color: #2563eb; text-decoration: none; border-radius: 8px; padding: 14px 30px; display: inline-block; font-weight: bold;">Visit DemoShop</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const msg = new MailerMessage({
            from: { address: SENDER_EMAIL, name: SENDER_NAME },
            to: [{ address: email }],
            subject: subject,
            html: htmlBody,
        });

        console.log(`[CREATE] Sending order email to: ${email}...`);
        $app.newMailClient().send(msg);
        console.log("[CREATE] SUCCESS! 'Awaiting Payment' email sent.");
    } catch (err) {
        console.error("[CREATE] CRITICAL EMAIL ERROR: " + (err.message || err));
    }
}, "orders");

// =====================================================================
// 2. ORDER STATUS UPDATE (Paid / Shipped)
// =====================================================================
onRecordAfterUpdateSuccess((e) => {
    const STORE_URL = $os.getenv("STORE_URL") || "https://example.com";
    const PRODUCT_PATH = "/item/";
    const SENDER_EMAIL = $os.getenv("SENDER_EMAIL") || $app.settings().meta.senderAddress || "no-reply@example.com";
    const SENDER_NAME = $os.getenv("SENDER_NAME") || $app.settings().meta.senderName || "DemoShop Store";

    function escapeHtml(unsafe) {
        if (!unsafe) return "";
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    try {
        const record = e.record;
        if (!record) return;

        const orderId = record.id;
        const email = record.get("email");
        const newStatus = record.get("status") || "unknown";

        let oldStatus = "";
        try {
            const original = record.originalCopy();
            if (original) {
                oldStatus = original.get("status") || "";
            }
        } catch (err) {}

        if (oldStatus === newStatus) {
            return;
        }

        const isPaid = newStatus === "paid" || newStatus === "opłacone";
        const isShipped = newStatus === "shipped" || newStatus === "wysłano";

        if (!isPaid && !isShipped) {
            console.log(`[UPDATE] Status '${newStatus}' does not trigger an email notification.`);
            return;
        }

        if (!email) {
            console.log("[UPDATE] Email skipped: Missing customer email.");
            return;
        }

        const tracking = record.get("tracking_number") || "";
        const rawItems = record.get("items") ?? [];
        const total = record.get("total") || 0;

        const firstName = escapeHtml(record.get("first_name"));
        const lastName = escapeHtml(record.get("last_name"));
        const street = escapeHtml(record.get("street"));
        const houseNumber = escapeHtml(record.get("house_number"));
        const postalCode = escapeHtml(record.get("postal_code"));
        const city = escapeHtml(record.get("city"));

        const rawClientType = String(record.get("clientType") || "");
        const isCompany =
            rawClientType.toLowerCase().includes("company") ||
            rawClientType.toLowerCase().includes("firma");
        const companyName = escapeHtml(record.get("companyName") || record.get("company_name"));
        const nip = escapeHtml(record.get("nip"));

        const deliveryMethod = escapeHtml(record.get("delivery_method") || "Standard Courier");
        const paczkomatId = escapeHtml(record.get("paczkomat_id") || "");

        let items = [];
        if (Array.isArray(rawItems)) {
            const isByteArray =
                rawItems.length > 0 &&
                rawItems.every((v) => typeof v === "number" && v >= 0 && v <= 255);
            if (isByteArray) {
                const jsonStr = String.fromCharCode.apply(null, rawItems);
                try {
                    items = JSON.parse(jsonStr);
                } catch (err) {}
            } else {
                items = rawItems;
            }
        } else if (typeof rawItems === "string") {
            try {
                items = JSON.parse(rawItems);
            } catch {}
        } else if (rawItems && typeof rawItems === "object") {
            items = [rawItems];
        }
        const validItems = items.filter((i) => i && typeof i === "object");

        const rowsHtml = validItems
            .map((it, idx) => {
                const name = escapeHtml(it.name || `Product #${idx + 1}`);
                const size = escapeHtml(it.size || "-");
                const qty = it.quantity || 1;
                const price = it.price || 0;
                const originalPrice = typeof it.originalPrice === "number" ? it.originalPrice : price;
                const hasPromo = it.hasPromo === true;
                const imgUrl = escapeHtml(it.imagePath || it.image_url || "");
                const itemLink = it.id ? `${STORE_URL}${PRODUCT_PATH}${it.id}` : STORE_URL;

                const priceDisplay = hasPromo
                    ? `<div style="text-decoration: line-through; color: #94a3b8; font-size: 12px; margin-bottom: 2px;">$${(originalPrice * qty).toFixed(2)}</div>
                       <div style="color: #dc2626; font-weight: bold; font-size: 15px;">$${(price * qty).toFixed(2)}</div>`
                    : `<div style="color: #0f172a; font-weight: bold; font-size: 15px;">$${(price * qty).toFixed(2)}</div>`;

                return `
<tr>
  <td style="border-bottom: 1px solid #e2e8f0; text-align: center; padding: 12px 10px; width: 70px;">
    ${imgUrl ? `<a href="${itemLink}" target="_blank"><img src="${imgUrl}" alt="${name}" style="width:100%; max-width:65px; height:auto; object-fit:cover; border-radius:6px;" /></a>` : ""}
  </td>
  <td style="border-bottom: 1px solid #e2e8f0; padding: 12px 10px;">
    <a href="${itemLink}" target="_blank" style="color: #0f172a; text-decoration: none; font-weight: bold; font-size: 14px; display: block;">${name}</a>
    <div style="font-size: 12px; color: #64748b; margin-top: 4px;" class="mobile-show">Size: ${size} | Qty: ${qty}</div>
  </td>
  <td class="mobile-hide" style="border-bottom: 1px solid #e2e8f0; text-align: center; padding: 12px 10px; color: #475569;">${size}</td>
  <td class="mobile-hide" style="border-bottom: 1px solid #e2e8f0; text-align: center; padding: 12px 10px; color: #475569;">${qty}</td>
  <td style="border-bottom: 1px solid #e2e8f0; text-align: right; padding: 12px 10px; white-space: nowrap;">${priceDisplay}</td>
</tr>`;
            })
            .join("");

        const totalStr = "$" + Number(total || 0).toFixed(2);

        let trackingWebsite = (record.get("tracking_website") || "").trim();
        if (
            trackingWebsite !== "" &&
            !trackingWebsite.startsWith("http://") &&
            !trackingWebsite.startsWith("https://")
        ) {
            trackingWebsite = "https://" + trackingWebsite;
        }

        let subject = `Order Update #${orderId} | DemoShop`;
        let headerTitle = `Order Status Updated`;
        let headerText = `Your order <b>#${orderId}</b> status has been updated to: <b style="color: #2563eb; text-transform: uppercase;">${escapeHtml(newStatus)}</b>.`;
        let trackingHtml = "";

        if (isPaid) {
            subject = `Payment Confirmed — Order #${orderId} | DemoShop`;
            headerTitle = `Payment Received!`;
            headerText = `Great news! Your payment for order <b>#${orderId}</b> has been verified.<br><br>We have forwarded your order to our warehouse for packing. You will receive another email with a tracking link as soon as your parcel is dispatched.`;
        } else if (isShipped) {
            subject = `Your Package Is on Its Way! — Order #${orderId} | DemoShop`;
            headerTitle = `Order Dispatched`;
            headerText = `Your order <b>#${orderId}</b> has been packed and handed over to the courier.`;

            trackingHtml = `
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center; font-family: 'Inter', Arial, sans-serif;">
                <h3 style="margin-top: 0; color: #166534;">Track Your Shipment</h3>
                ${tracking ? `<p style="font-size: 15px; margin-bottom: 5px;">Tracking Number: <b>${escapeHtml(tracking)}</b></p>` : ""}
                ${
                    trackingWebsite !== ""
                        ? `<div style="margin-top: 14px;">
                             <a href="${trackingWebsite}" target="_blank" style="font-size: 15px; font-family: 'Inter', Arial, sans-serif; color: #ffffff; background-color: #16a34a; text-decoration: none; padding: 12px 25px; border-radius: 6px; display: inline-block; font-weight: bold;">Track Package Online</a>
                           </div>`
                        : ``
                }
            </div>`;
        }

        let deliveryHtml =
            deliveryMethod.toLowerCase().includes("paczkomat") ||
            deliveryMethod.toLowerCase().includes("locker")
                ? `${deliveryMethod} ${paczkomatId ? `(${paczkomatId})` : ""}`
                : deliveryMethod;

        let customerDetailsHtml =
            isCompany && companyName
                ? `<b>${companyName}</b><br>Tax ID: ${nip}<br>${street} ${houseNumber}<br>${postalCode} ${city}<br>Email: ${escapeHtml(email)}`
                : `<b>${firstName} ${lastName}</b><br>${street} ${houseNumber}<br>${postalCode} ${city}<br>Email: ${escapeHtml(email)}`;

        const addressHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-top: 20px; font-family: 'Inter', Arial, sans-serif; font-size: 14px; line-height: 1.5;">
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="50%" valign="top">
                        <h4 style="margin-top: 0; margin-bottom: 10px; color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Customer Details:</h4>
                        ${customerDetailsHtml}
                    </td>
                    <td width="50%" valign="top" style="padding-left: 15px; border-left: 1px solid #e2e8f0;">
                        <h4 style="margin-top: 0; margin-bottom: 10px; color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Shipping Method:</h4>
                        <b>Delivery:</b> ${deliveryHtml}
                    </td>
                </tr>
            </table>
        </div>`;

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 24px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(90deg, #0f172a, #2563eb); padding: 24px; text-align: center;">
              <a href="${STORE_URL}" style="color: #ffffff; text-decoration: none; font-family: 'Inter', Arial, sans-serif; font-size: 24px; font-weight: 800;">
                Demo<span style="color: #93c5fd;">Shop</span>
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <h2 style="margin-top: 0; color: #0f172a; font-family: 'Inter', Arial, sans-serif;">${headerTitle}</h2>
              <p style="font-family: 'Inter', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
                ${headerText}
              </p>
              ${trackingHtml}
              ${addressHtml}
              <h3 style="margin-top: 30px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; font-family: 'Inter', Arial, sans-serif; font-size: 16px; color: #0f172a;">Order Summary:</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-family: 'Inter', Arial, sans-serif;">
                <tbody>
                  ${rowsHtml}
                  <tr>
                    <td colspan="3" style="padding: 20px 10px 10px 10px; text-align: right; font-size: 15px;"><b>Total:</b></td>
                    <td colspan="2" style="padding: 20px 10px 10px 10px; text-align: right; font-size: 18px; color: #2563eb; font-weight: bold;">${totalStr}</td>
                  </tr>
                </tbody>
              </table>
              <div style="text-align: center; margin-top: 35px;">
                <a href="${STORE_URL}" style="font-size: 15px; font-family: 'Inter', Arial, sans-serif; color: #ffffff; background-color: #2563eb; text-decoration: none; border-radius: 8px; padding: 14px 30px; display: inline-block; font-weight: bold;">Return to Store</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const msg = new MailerMessage({
            from: { address: SENDER_EMAIL, name: SENDER_NAME },
            to: [{ address: email }],
            subject: subject,
            html: htmlBody,
        });

        $app.newMailClient().send(msg);
        console.log(`[UPDATE] Notification email ('${newStatus}') sent to: ${email}`);
    } catch (err) {
        console.error("[UPDATE] CRITICAL EMAIL ERROR: " + (err.message || err));
    }
}, "orders");